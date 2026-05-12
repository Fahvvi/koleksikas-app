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

    // ========================================================
    // 2. FUNGSI KONFIRMASI OLEH MEMBER (Kirim Notif ke Admin)
    // ========================================================
    public function markAsPaid($transactionId)
    {
        try {
            $transaction = \Illuminate\Support\Facades\DB::table('transactions')->where('id', $transactionId)->first();
            if (!$transaction) return response()->json(['message' => 'Transaksi tidak valid.'], 404);
            
            // 👇 FIX: Cek jika sudah lunas
            if ($transaction->status === 'success') return response()->json(['message' => 'Tagihan sudah lunas'], 400);

            // 👇 FIX: Cek jika sudah pernah minta konfirmasi agar tidak spam admin
            if ($transaction->status === 'confirmation_requested') {
                return response()->json(['message' => 'Konfirmasi sudah dikirim sebelumnya. Mohon tunggu Admin mengecek mutasi.'], 200);
            }

            // 👇 FIX: Ubah status menjadi 'confirmation_requested'
            \Illuminate\Support\Facades\DB::table('transactions')
                ->where('id', $transactionId)
                ->update(['status' => 'confirmation_requested', 'updated_at' => now()]);

            $user = \Illuminate\Support\Facades\DB::table('users')->where('id', $transaction->user_id)->first();
            $userName = $user ? $user->name : 'Member';

            $billItem = \Illuminate\Support\Facades\DB::table('bill_items')->where('id', $transaction->bill_item_id)->first();
            $bill = $billItem ? \Illuminate\Support\Facades\DB::table('bills')->where('id', $billItem->bill_id)->first() : null;
            $session = $bill ? \Illuminate\Support\Facades\DB::table('play_sessions')->where('id', $bill->session_id)->first() : null;
            $namaTagihan = $session ? $session->name : ($bill ? $bill->name : 'Tagihan Komunitas');

            $admin = null;
            if ($session && $session->created_by) {
                $admin = \Illuminate\Support\Facades\DB::table('users')->where('id', $session->created_by)->first();
            }
            if (!$admin && $bill && $bill->tenant_id) {
                $admin = \Illuminate\Support\Facades\DB::table('users')->where('tenant_id', $bill->tenant_id)->where('role', '!=', 'user')->first();
            }

            // ==========================================
            // JARING SYSLOG: REKAM IDENTITAS ADMIN
            // ==========================================
            $statusAdmin = $admin ? "KETEMU (ID: {$admin->id}, WA: " . ($admin->phone_wa ?? 'KOSONG') . ")" : "TIDAK KETEMU";
            \Illuminate\Support\Facades\DB::table('system_logs')->insert([
                'id' => \Illuminate\Support\Str::uuid()->toString(),
                'level' => 'info', 'service' => 'payment_debug',
                'message' => "[DEBUG 1] Pencarian Admin: {$statusAdmin}",
                'created_at' => now(), 'updated_at' => now(),
            ]);

            if ($admin) {
                // BLOK A: NOTIFIKASI LONCENG
                try {
                    \Illuminate\Support\Facades\DB::table('notifications')->insert([
                        'id' => \Illuminate\Support\Str::uuid()->toString(),
                        'type' => 'App\Notifications\ManualPaymentNotification',
                        'notifiable_type' => 'App\Models\User',
                        'notifiable_id' => $admin->id,
                        'data' => json_encode([
                            'title' => 'Konfirmasi Bayar Manual',
                            'message' => "Member {$userName} lapor sudah membayar untuk {$namaTagihan}.",
                            'amount' => $transaction->amount,
                            'transaction_id' => $transaction->id,
                            'type' => 'payment_confirmation',
                            'icon' => '💳'
                        ]),
                        'read_at' => null, 'created_at' => now(), 'updated_at' => now(),
                    ]);
                    
                    \Illuminate\Support\Facades\DB::table('system_logs')->insert([
                        'id' => \Illuminate\Support\Str::uuid()->toString(),
                        'level' => 'info', 'service' => 'payment_debug',
                        'message' => "[DEBUG 2] Notifikasi Lonceng DB Berhasil Disuntikkan.",
                        'created_at' => now(), 'updated_at' => now(),
                    ]);
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::error("Gagal Suntik DB Notif: " . $e->getMessage());
                }

                // BLOK B: NOTIFIKASI WHATSAPP
                try {
                    // Cari nomor WA
                    $waTarget = $admin->phone_wa ?? $admin->phone ?? null;

                    if ($waTarget) {
                        // 👇 FILTER NOMOR WA JADI FORMAT INTERNASIONAL (62) 👇
                        // 1. Bersihkan semua karakter selain angka (spasi, strip, +)
                        $waTarget = preg_replace('/[^0-9]/', '', $waTarget);
                        // 2. Jika depannya '0', ganti jadi '62'
                        if (substr($waTarget, 0, 1) === '0') {
                            $waTarget = '62' . substr($waTarget, 1);
                        }

                        $waha = new \App\Services\WhatsApp\WahaService();
                        $nominal = number_format($transaction->amount, 0, ',', '.');
                        $pesan = "🔔 *KONFIRMASI BAYAR MANUAL*\n\n"
                               . "Member *{$userName}* lapor sudah bayar *Rp {$nominal}* untuk {$namaTagihan}.\n\n"
                               . "Silakan cek mutasi dan tekan 'Tandai Lunas' di dashboard sekarang!";
                        
                        $waha->send($waTarget, $pesan);
                        
                        \Illuminate\Support\Facades\DB::table('system_logs')->insert([
                            'id' => \Illuminate\Support\Str::uuid()->toString(),
                            'level' => 'info', 'service' => 'payment_debug',
                            'message' => "[DEBUG 3] WA berhasil ditembak ke nomor: {$waTarget}",
                            'created_at' => now(), 'updated_at' => now(),
                        ]);
                    }
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\DB::table('system_logs')->insert([
                        'id' => \Illuminate\Support\Str::uuid()->toString(),
                        'level' => 'error', 'service' => 'payment_debug',
                        'message' => "[DEBUG 3] WA Crash: " . $e->getMessage(),
                        'created_at' => now(), 'updated_at' => now(),
                    ]);
                }
            }

            return response()->json(['success' => true, 'message' => 'Konfirmasi diterima!']);
            
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error Server: ' . $e->getMessage()], 500);
        }
    }

    public function getPublicSessions()
    {
        try {
            // Ambil sesi yang is_public = true, masih aktif, dan waktunya belum lewat
            $sessions = \App\Models\Session::with(['group'])
                ->where('is_public', true)
                ->where('status', 'active')
                ->where('scheduled_at', '>=', now()) // Hanya tampilkan jadwal masa depan
                ->orderBy('scheduled_at', 'asc')
                ->get()
                ->map(function ($session) {
                    // Hitung jumlah peserta yang sudah lunas
                    $paidCount = \App\Models\BillItem::whereHas('bill', function($q) use ($session) {
                        $q->where('session_id', $session->id);
                    })->where('status', 'paid')->count();

                    return [
                        'id' => $session->id,
                        'name' => $session->name,
                        'type' => $session->type,
                        'location' => $session->location,
                        'region' => $session->region, // Pastikan kolom ini ada di database
                        'scheduled_at' => $session->scheduled_at,
                        'price' => $session->price,
                        'max_participants' => $session->max_participants,
                        'participants_count' => $paidCount,
                        'group' => [
                            'name' => $session->group->name ?? 'Komunitas'
                        ]
                    ];
                });

            return response()->json(['success' => true, 'data' => $sessions]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal memuat sesi: ' . $e->getMessage()], 500);
        }
    }
    
}