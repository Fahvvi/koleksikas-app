<?php

namespace App\Http\Controllers\Webhook;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\SessionParticipant;
use App\Models\SystemLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Cache;
use App\Jobs\WA\SendWaMemberConfirmJob;

class PaymentWebhookController extends Controller
{
    public function handle(Request $request, $provider)
    {
        SystemLog::create([
            'level' => 'info', 'service' => 'payment',
            'message' => "Menerima Webhook masuk dari provider: {$provider}"
        ]);

        try {
            $orderId = $request->input('order_id') ?? $request->input('transaction_id');

            if (!$orderId || !\Illuminate\Support\Str::isUuid($orderId)) {
                return response()->json(['message' => 'Format ID tidak didukung/Kosong'], 200);
            }

            $transaction = Transaction::with(['tenant', 'billItem.bill.session', 'user'])
                ->where('id', $orderId)->first();

            if (!$transaction) {
                return response()->json(['message' => 'Transaksi tidak ditemukan'], 404);
            }

            if ($transaction->status === 'success') {
                return response()->json(['message' => 'Transaksi sudah diproses sebelumnya'], 200);
            }

            $payloadData = json_decode($transaction->payload, true);
            $isLicensePayment = ($payloadData && isset($payloadData['type']) && $payloadData['type'] === 'license_activation');

            // RESOLUSI CONFIG
            if ($isLicensePayment) {
                $globalProject = \App\Models\GlobalSetting::where('key', 'pakasir_project')->first();
                $globalApiKey = \App\Models\GlobalSetting::where('key', 'pakasir_api_key')->first();
                $config = (object) [
                    'provider' => 'pakasir',
                    'payload' => json_encode(['project' => $globalProject->value, 'api_key' => $globalApiKey->value])
                ];
            } else {
                $config = $this->resolvePaymentConfig($transaction->tenant_id);
            }
            
            if (!$config) return response()->json(['message' => 'Konfigurasi Gateway tidak ditemukan'], 500);

            // ==========================================================
            // 🛡️ FIX SECURITY: STRICT LOCAL HMAC SIGNATURE VERIFICATION
            // ==========================================================
            $configData = json_decode($config->payload, true);
            $secretKey = $configData['api_key'] ?? ''; // Gunakan API Key / Webhook Secret sebagai Kunci HMAC
            
            $signature = $request->header('X-Callback-Signature') ?? $request->header('X-Signature');
            $rawPayload = $request->getContent(); // Ambil body JSON murni secara utuh (PENTING untuk HMAC)

            if (!$signature) {
                SystemLog::create(['level' => 'warning', 'service' => 'payment', 'message' => "SPOOFING ATTEMPT: Webhook tanpa signature untuk Order ID: {$orderId}"]);
                return response()->json(['message' => 'Missing Signature! Akses ditolak.'], 403);
            }

            // Hitung signature lokal. (Catatan: Ubah 'sha256' menjadi 'md5' atau 'sha512' jika API provider menggunakan algoritma tersebut).
            $expectedSignature = hash_hmac('sha256', $rawPayload, $secretKey);

            // Gunakan hash_equals() untuk mencegah Timing Attack!
            // Jangan pernah menggunakan operator (==) atau (===) untuk membandingkan password/signature.
            if (!hash_equals($expectedSignature, $signature)) {
                SystemLog::create([
                    'level' => 'critical', 'service' => 'payment',
                    'message' => "SPOOFING ATTEMPT: Signature mismatch! Asli: {$expectedSignature} | Palsu: {$signature}"
                ]);
                return response()->json(['message' => 'Invalid Signature! Akses ditolak.'], 403);
            }
            // ==========================================================

            // Opsional: Anda tetap bisa memanggil getPaymentService jika butuh ekstraksi data khusus dari provider
            // $paymentService = $this->getPaymentService($config);

            // PROSES PEMBAYARAN BERHASIL
            $transactionStatus = $request->input('transaction_status') ?? $request->input('status');

            if (in_array($transactionStatus, ['settlement', 'capture', 'paid', 'completed', 'success'])) {
                
                DB::transaction(function () use ($transaction, $request, $isLicensePayment, $payloadData) {
                    $transaction->update([
                        'status' => 'success',
                        'paid_at' => now(),
                        'gateway_transaction_id' => $request->input('gateway_transaction_id')
                    ]);

                    if ($isLicensePayment) {
                        $mitra = \App\Models\Mitra::find($payloadData['mitra_id']);
                        $tier = \App\Models\LicenseTier::where('slug', $payloadData['tier_slug'])->first();
                        
                        if ($mitra && $tier && $mitra->status !== 'active') {
                            $hashedPassword = Cache::pull("mitra_activation_{$transaction->id}");

                            $registerController = new \App\Http\Controllers\MitraRegisterController();
                            $registerController->executeActivation($mitra, $tier, $hashedPassword);
                        }
                    } else {
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
                    }
                });

                if (!$isLicensePayment) {
                    SendWaMemberConfirmJob::dispatch($transaction);
                }

                return response()->json(['message' => 'Webhook berhasil diproses'], 200);
            }

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

    private function resolvePaymentConfig($tenantId)
    {
        $config = \App\Models\PaymentConfig::where('tenant_id', $tenantId)->first();

        if ($config && $config->provider !== 'koleksikas') {
            return $config;
        }

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