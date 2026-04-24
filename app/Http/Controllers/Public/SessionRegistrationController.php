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
}