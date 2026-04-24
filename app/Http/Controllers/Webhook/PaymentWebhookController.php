<?php

namespace App\Http\Controllers\Webhook;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\SessionParticipant;
use App\Models\SystemLog; // <-- IMPORT MODEL SYSTEM LOG
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Jobs\WA\SendWaMemberConfirmJob;

class PaymentWebhookController extends Controller
{
    public function handle(Request $request, $provider)
    {
        // [LOG 1 - INFO]: Catat setiap ada ketukan pintu dari pihak luar
        SystemLog::create([
            'level' => 'info',
            'service' => 'payment',
            'message' => "Menerima Webhook masuk dari provider: {$provider}",
            'context' => [
                'ip_address' => $request->ip(),
                'payload' => $request->all() // Simpan seluruh data untuk keperluan audit jika ada dispute
            ]
        ]);

        try {
            // 1. Tangkap ID Transaksi dari payload
            $orderId = $request->input('order_id') ?? $request->input('transaction_id');

            if (!$orderId) {
                // [LOG 2 - WARNING]: Webhook aneh tanpa ID
                SystemLog::create([
                    'level' => 'warning',
                    'service' => 'payment',
                    'message' => "Webhook {$provider} ditolak: Payload tidak memiliki Order ID.",
                    'context' => ['payload' => $request->all()]
                ]);
                return response()->json(['message' => 'Order ID tidak ditemukan'], 400);
            }

            // 2. Cari transaksi beserta relasinya
            $transaction = Transaction::with(['tenant.paymentConfig', 'billItem.bill.session', 'user'])
                ->where('id', $orderId) 
                ->first();

            if (!$transaction) {
                // [LOG 3 - WARNING]: Transaksi tidak ada di DB (Bisa jadi ada delay koneksi atau salah DB)
                SystemLog::create([
                    'level' => 'warning',
                    'service' => 'payment',
                    'message' => "Webhook {$provider} ditolak: Transaksi ID {$orderId} tidak ditemukan di database.",
                ]);
                return response()->json(['message' => 'Transaksi tidak ditemukan'], 404);
            }

            if ($transaction->status === 'success') {
                return response()->json(['message' => 'Transaksi sudah diproses sebelumnya'], 200);
            }

            // 3. Verifikasi Signature (Keamanan)
            $config = $transaction->tenant->paymentConfig;
            $paymentService = $this->getPaymentService($config);
            
            $signature = $request->header('X-Callback-Signature') ?? $request->header('X-Signature');

            // [PERHATIAN]: Kalau sudah Production, BUKA COMMENT INI!
            // if (!$paymentService->verifyWebhook($request->all(), $signature)) {
            //     // [LOG 4 - CRITICAL]: Potensi Hacking / Pemalsuan Pembayaran!
            //     SystemLog::create([
            //         'level' => 'critical',
            //         'service' => 'payment',
            //         'message' => "Peringatan FRAUD! Invalid Signature dari Webhook {$provider}.",
            //         'context' => [
            //             'ip_address' => $request->ip(),
            //             'transaction_id' => $orderId,
            //             'signature_received' => $signature
            //         ]
            //     ]);
            //     return response()->json(['message' => 'Invalid Signature! Akses ditolak.'], 403);
            // }

            // 4. Proses Pembayaran Berhasil
            $transactionStatus = $request->input('transaction_status') ?? $request->input('status');

            if (in_array($transactionStatus, ['settlement', 'capture', 'paid', 'success'])) {
                
                DB::transaction(function () use ($transaction, $request) {
                    // A. Update Transaksi
                    $transaction->update([
                        'status' => 'success',
                        'paid_at' => now(),
                        'gateway_transaction_id' => $request->input('gateway_transaction_id')
                    ]);

                    // B. Update Bill Item
                    if ($transaction->billItem) {
                        $transaction->billItem->update([
                            'status' => 'paid',
                            'paid_at' => now()
                        ]);
                    }

                    // C. Logika "Open Play"
                    $bill = $transaction->billItem->bill ?? null;
                    if ($bill && $bill->session_id) {
                        SessionParticipant::updateOrCreate(
                            [
                                'session_id' => $bill->session_id,
                                'user_id' => $transaction->user_id,
                            ],
                            [
                                'id' => (string) Str::uuid(),
                                'status' => 'confirmed'
                            ]
                        );
                    }
                });

                // 5. Trigger Notifikasi WhatsApp
                SendWaMemberConfirmJob::dispatch($transaction);

                // [LOG 5 - INFO]: Pembayaran Sukses Diproses
                SystemLog::create([
                    'level' => 'info',
                    'service' => 'payment',
                    'message' => "Pembayaran Sukses: Transaksi {$orderId} via {$provider} telah diproses.",
                ]);

                return response()->json(['message' => 'Webhook berhasil diproses'], 200);
            }

            // Handle status lain (Expired / Failed)
            if (in_array($transactionStatus, ['expire', 'cancel', 'deny', 'failed'])) {
                $transaction->update(['status' => 'failed']);
                
                SystemLog::create([
                    'level' => 'info',
                    'service' => 'payment',
                    'message' => "Pembayaran Gagal/Expired: Transaksi {$orderId} dibatalkan.",
                ]);

                return response()->json(['message' => 'Transaksi dibatalkan/kadaluarsa'], 200);
            }

            return response()->json(['message' => 'Status tidak dikenali'], 400);

        } catch (\Exception $e) {
            // [LOG 6 - CRITICAL]: Tangkap error kodingan / database mati di tengah proses
            SystemLog::create([
                'level' => 'critical',
                'service' => 'payment',
                'message' => "FATAL ERROR saat memproses Webhook {$provider}: " . $e->getMessage(),
                'context' => [
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'order_id' => $orderId ?? 'unknown'
                ]
            ]);

            return response()->json(['message' => 'Terjadi kesalahan internal server'], 500);
        }
    }

    private function getPaymentService($config) {
        return match($config->provider) {
            'pakasir' => new \App\Services\Payment\PakasirService($config->payload),
            'midtrans' => new \App\Services\Payment\MidtransService($config->payload),
            default => throw new \Exception("Provider pembayaran tidak didukung: {$config->provider}")
        };
    }
}