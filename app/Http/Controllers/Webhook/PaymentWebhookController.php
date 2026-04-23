<?php

namespace App\Http\Controllers\Webhook;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\SessionParticipant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Jobs\WA\SendWaMemberConfirmJob; // Kita siapkan untuk nanti

class PaymentWebhookController extends Controller
{
    public function handle(Request $request, $provider)
    {
        // 1. Tangkap ID Transaksi dari payload (Sesuaikan dengan format Pakasir/Midtrans)
        // Umumnya payment gateway mengirimkan order_id yang kita set saat create charge
        $orderId = $request->input('order_id') ?? $request->input('transaction_id');

        if (!$orderId) {
            return response()->json(['message' => 'Order ID tidak ditemukan'], 400);
        }

        // 2. Cari transaksi beserta relasinya
        $transaction = Transaction::with(['tenant.paymentConfig', 'billItem.bill.session', 'user'])->find($orderId);

        if (!$transaction) {
            return response()->json(['message' => 'Transaksi tidak ditemukan'], 404);
        }

        if ($transaction->status === 'success') {
            return response()->json(['message' => 'Transaksi sudah diproses sebelumnya'], 200);
        }

        // 3. Verifikasi Signature (Keamanan)
        $config = $transaction->tenant->paymentConfig;
        $paymentService = $this->getPaymentService($config);
        
        // Asumsi Pakasir mengirim signature di header 'X-Callback-Signature'
        $signature = $request->header('X-Callback-Signature') ?? $request->header('X-Signature');

        if (!$paymentService->verifyWebhook($request->all(), $signature)) {
            return response()->json(['message' => 'Invalid Signature! Akses ditolak.'], 403);
        }

        // 4. Proses Pembayaran Berhasil
        // Cek status dari gateway (misal: 'settlement' atau 'paid')
        $transactionStatus = $request->input('transaction_status') ?? $request->input('status');

        if (in_array($transactionStatus, ['settlement', 'capture', 'paid', 'success'])) {
            
            DB::transaction(function () use ($transaction) {
                // A. Update Transaksi
                $transaction->update([
                    'status' => 'success',
                    'paid_at' => now(),
                    'gateway_transaction_id' => request('gateway_transaction_id') // ID asli dari gateway
                ]);

                // B. Update Bill Item
                $transaction->billItem->update([
                    'status' => 'paid',
                    'paid_at' => now()
                ]);

                // C. Logika Khusus "Open Play" (Jika Tagihan ini terikat ke Sesi)
                $bill = $transaction->billItem->bill;
                if ($bill->session_id) {
                    SessionParticipant::firstOrCreate([
                        'id' => Str::uuid(),
                        'session_id' => $bill->session_id,
                        'user_id' => $transaction->user_id,
                        'status' => 'confirmed'
                    ]);
                }
            });

            // 5. Trigger Notifikasi WhatsApp (Kirim ke antrean Queue)
            SendWaMemberConfirmJob::dispatch($transaction);

            return response()->json(['message' => 'Webhook berhasil diproses'], 200);
        }

        // Handle status lain seperti expired/failed
        if (in_array($transactionStatus, ['expire', 'cancel', 'deny', 'failed'])) {
            $transaction->update(['status' => 'failed']);
            return response()->json(['message' => 'Transaksi dibatalkan/kadaluarsa'], 200);
        }

        return response()->json(['message' => 'Status tidak dikenali'], 400);
    }

    private function getPaymentService($config) {
        return match($config->provider) {
            'pakasir' => new \App\Services\Payment\PakasirService($config->payload),
            'midtrans' => new \App\Services\Payment\MidtransService($config->payload),
            default => throw new \Exception("Provider tidak didukung")
        };
    }
}