<?php

namespace App\Http\Controllers\Webhook;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\SessionParticipant;
use App\Models\SystemLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Jobs\WA\SendWaMemberConfirmJob;

class PaymentWebhookController extends Controller
{
    public function handle(Request $request, $provider)
    {
        SystemLog::create([
            'level' => 'info',
            'service' => 'payment',
            'message' => "Menerima Webhook masuk dari provider: {$provider}"
        ]);

        try {
            // 1. Tangkap ID Transaksi
            $orderId = $request->input('order_id') ?? $request->input('transaction_id');

            if (!$orderId || !\Illuminate\Support\Str::isUuid($orderId)) {
                return response()->json(['message' => 'Format ID tidak didukung/Kosong'], 200);
            }

            // 2. Cari transaksi beserta relasinya
            $transaction = Transaction::with(['tenant', 'billItem.bill.session', 'user'])
                ->where('id', $orderId) 
                ->first();

            if (!$transaction) {
                SystemLog::create([
                    'level' => 'warning', 'service' => 'payment',
                    'message' => "Webhook {$provider} ditolak: Transaksi ID {$orderId} tidak ditemukan.",
                ]);
                return response()->json(['message' => 'Transaksi tidak ditemukan'], 404);
            }

            if ($transaction->status === 'success') {
                return response()->json(['message' => 'Transaksi sudah diproses sebelumnya'], 200);
            }

            // 3. RESOLUSI CONFIG & VERIFIKASI KEAMANAN (PRODUCTION READY 🛡️)
            $config = $this->resolvePaymentConfig($transaction->tenant_id);
            
            if (!$config) {
                return response()->json(['message' => 'Konfigurasi Gateway tidak ditemukan'], 500);
            }

            $paymentService = $this->getPaymentService($config);
            $signature = $request->header('X-Callback-Signature') ?? $request->header('X-Signature');

            // BLOK KEAMANAN DIBUKA! 
            // Jika provider adalah Pakasir, ini akan menembak balik API Pakasir untuk double-check!
            if (!$paymentService->verifyWebhook($request->all(), $signature)) {
                SystemLog::create([
                    'level' => 'critical', 'service' => 'payment',
                    'message' => "Peringatan FRAUD! Invalid Signature/Status dari Webhook {$provider}.",
                    'context' => [
                        'ip_address' => $request->ip(),
                        'transaction_id' => $orderId
                    ]
                ]);
                return response()->json(['message' => 'Invalid Signature! Akses ditolak.'], 403);
            }

            // 4. Proses Pembayaran Berhasil
            $transactionStatus = $request->input('transaction_status') ?? $request->input('status');

            if (in_array($transactionStatus, ['settlement', 'capture', 'paid', 'completed', 'success'])) {
                
                DB::transaction(function () use ($transaction, $request) {
                    $transaction->update([
                        'status' => 'success',
                        'paid_at' => now(),
                        'gateway_transaction_id' => $request->input('gateway_transaction_id')
                    ]);

                    if ($transaction->billItem) {
                        $transaction->billItem->update(['status' => 'paid', 'paid_at' => now()]);
                    }

                    $bill = $transaction->billItem->bill ?? null;
                    if ($bill && $bill->session_id) {
                        SessionParticipant::updateOrCreate(
                            ['session_id' => $bill->session_id, 'user_id' => $transaction->user_id],
                            ['id' => (string) Str::uuid(), 'status' => 'confirmed']
                        );
                    }
                });

                // 5. Trigger Notifikasi WhatsApp
                SendWaMemberConfirmJob::dispatch($transaction);

                SystemLog::create([
                    'level' => 'info', 'service' => 'payment',
                    'message' => "Pembayaran Sukses: Transaksi {$orderId} via {$provider} telah diproses.",
                ]);

                return response()->json(['message' => 'Webhook berhasil diproses'], 200);
            }

            // Handle status lain (Expired / Failed)
            if (in_array($transactionStatus, ['expire', 'cancel', 'deny', 'failed'])) {
                $transaction->update(['status' => 'failed']);
                return response()->json(['message' => 'Transaksi dibatalkan/kadaluarsa'], 200);
            }

            return response()->json(['message' => 'Status tidak dikenali'], 400);

        } catch (\Exception $e) {
            SystemLog::create([
                'level' => 'critical', 'service' => 'payment',
                'message' => "FATAL ERROR saat memproses Webhook {$provider}: " . $e->getMessage()
            ]);
            return response()->json(['message' => 'Terjadi kesalahan internal server'], 500);
        }
    }

    // --- HELPER UNTUK MENGAMBIL CONFIG GLOBAL / LOKAL ---
    // --- HELPER UNTUK MENGAMBIL CONFIG GLOBAL / LOKAL ---
    private function resolvePaymentConfig($tenantId)
    {
        // Ambil config milik tenant (Sesuai kesepakatan, tanpa is_active dulu jika belum ada di DB)
        $config = \App\Models\PaymentConfig::where('tenant_id', $tenantId)->first();

        // JIKA tenant punya config SENDIRI (pakasir/midtrans), gunakan itu!
        if ($config && $config->provider !== 'koleksikas') {
            return $config;
        }

        // JIKA tenant pilih 'koleksikas' ATAU belum punya config, gunakan GLOBAL PAKASIR
        $globalProject = \App\Models\GlobalSetting::where('key', 'pakasir_project')->first();
        $globalApiKey = \App\Models\GlobalSetting::where('key', 'pakasir_api_key')->first();

        if ($globalProject && $globalApiKey && !empty($globalProject->value)) {
            return (object) [
                'provider' => 'pakasir',
                'payload' => json_encode([
                    'project' => $globalProject->value, 
                    'api_key' => $globalApiKey->value
                ])
            ];
        }

        return null;
    }

    private function getPaymentService($config) {
        return match($config->provider) {
            'pakasir' => new \App\Services\Payment\PakasirService($config->payload),
            'midtrans' => new \App\Services\Payment\MidtransService($config->payload),
            default => throw new \Exception("Provider pembayaran tidak didukung: {$config->provider}")
        };
    }
}