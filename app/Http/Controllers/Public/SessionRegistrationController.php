<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\PaymentConfig;
use App\Models\Session;
use App\Models\User;
use App\Models\Transaction;
use App\Models\BillItem;
use App\Models\Bill;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SessionRegistrationController extends Controller
{
    public function register(Request $request, $sessionId)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'phone_wa' => 'required|string|max:20',
        ]);

        $session = Session::findOrFail($sessionId);
        $tenant = $session->group->tenant;

        return DB::transaction(function () use ($request, $session, $tenant) {
            // 1. Cari atau buat User Guest
            $user = User::firstOrCreate(
                ['phone_wa' => $request->phone_wa, 'tenant_id' => $tenant->id],
                ['id' => Str::uuid(), 'name' => $request->name, 'role' => 'user']
            );

            // 2. Buat Bill Item (Tagihan Andi)
            $bill = Bill::where('session_id', $session->id)->first();
            $billItem = BillItem::create([
                'id' => Str::uuid(),
                'bill_id' => $bill->id,
                'user_id' => $user->id,
                'amount' => $session->price,
                'status' => 'pending'
            ]);

            // 3. AMBIL CONFIG DULU & CEK VALIDASINYA (PINDAH KE SINI)
            $paymentConfig = PaymentConfig::where('tenant_id', $tenant->id)->first();

            if (!$paymentConfig) {
                return response()->json([
                    'success' => false,
                    'message' => 'Konfigurasi pembayaran untuk tenant ini belum diatur.'
                ], 400);
            }

            // 4. BARU PANGGIL SERVICE (SETELAH DIPASTIKAN TIDAK NULL)
            $paymentService = $this->getPaymentService($paymentConfig);
            
            $charge = $paymentService->createCharge([
                'amount' => $session->price,
                'user' => $user,
                'bill_item_id' => $billItem->id
            ]);

            // 5. Catat Transaksi
            Transaction::create([
                'id' => Str::uuid(),
                'tenant_id' => $tenant->id,
                'bill_item_id' => $billItem->id,
                'user_id' => $user->id,
                'amount' => $session->price,
                'payment_url' => $charge['payment_url'],
                'qr_code_url' => $charge['qr_code'] ?? null,
                'status' => 'pending'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Silakan lakukan pembayaran QRIS',
                'data' => $charge
            ]);
        });
    }

    private function getPaymentService($config) {
        return match($config->provider) {
            'pakasir' => new \App\Services\Payment\PakasirService($config->payload),
            'midtrans' => new \App\Services\Payment\MidtransService($config->payload),
            default => throw new \Exception("Provider tidak didukung")
        };
    }

    public function markAsPaid($transactionId)
    {
        $transaction = \App\Models\Transaction::with(['tenant', 'user', 'billItem.bill'])->findOrFail($transactionId);

        if ($transaction->status === 'success') {
            return response()->json(['message' => 'Tagihan sudah lunas'], 400);
        }

        // 1. Cari Admin
        $admin = \App\Models\User::where('tenant_id', $transaction->tenant_id)
            ->where('role', 'admin')
            ->first();

        if ($admin) {
            // 👇 2. KIRIM NOTIFIKASI DATABASE (PASTI MASUK) 👇
            $admin->notify(new \App\Notifications\ManualPaymentNotification([
                'user_name' => $transaction->user->name,
                'bill_name' => $transaction->billItem->bill->name,
                'amount' => $transaction->amount,
                'transaction_id' => $transaction->id
            ]));

            // 3. Kirim WhatsApp (Fallback)
            try {
                $waha = new \App\Services\WhatsApp\WahaService();
                $nominal = number_format($transaction->amount, 0, ',', '.');
                $pesan = "🔔 *KONFIRMASI BAYAR MANUAL*\n\nMember *{$transaction->user->name}* lapor sudah bayar *Rp {$nominal}*.\nCek dashboard sekarang!";
                $waha->send($admin->phone_wa, $pesan);
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error("WA Gagal: " . $e->getMessage());
            }
        }

        // Catat ke SystemLog
        \App\Models\SystemLog::create([
            'level' => 'info',
            'service' => 'payment',
            'message' => "User {$transaction->user->name} mengonfirmasi pembayaran manual (TxID: {$transactionId})."
        ]);

        return response()->json(['success' => true, 'message' => 'Konfirmasi diterima!']);
    }
}