<?php

namespace App\Http\Controllers\Webhook;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Session;
use App\Models\Bill;
use App\Models\BillItem;
use App\Models\Transaction;
use App\Models\PaymentConfig;
use App\Models\GroupMember;
use App\Models\SystemLog;
use App\Services\WhatsApp\WahaService;
use Illuminate\Support\Str;

class WahaWebhookController extends Controller
{
    public function handle(Request $request, WahaService $waha)
    {
        $payload = $request->all();
        if (!isset($payload['payload'])) return response('OK');

        $messageData = $payload['payload'];
        if (isset($messageData['fromMe']) && $messageData['fromMe'] === true) return response('OK');

        $body = trim(strtolower($messageData['body'] ?? ''));
        if (!in_array($body, ['1', '2', 'ikut', 'tidak'])) return response('OK');

        // --- AMBIL IDENTITAS ---
        $rawFrom = $messageData['from'] ?? ''; // Format: 155254964404264@lid
        $notifyName = $messageData['notifyName'] ?? 'Member'; // Nama Profil WA (Fahmi)
        $cleanPhone = preg_replace('/[^0-9]/', '', explode('@', $rawFrom)[0]);

        // 1. Coba cari berdasarkan Nomor
        $phoneVariant1 = $cleanPhone; 
        $phoneVariant2 = str_starts_with($cleanPhone, '62') ? '0' . substr($cleanPhone, 2) : '';
        $user = User::whereIn('phone_wa', [$phoneVariant1, $phoneVariant2])->first();
        
        // 2. JIKA GAGAL (KARENA LID), CARI BERDASARKAN NAMA WA (NOTIFY NAME)
        if (!$user && str_contains($rawFrom, '@lid')) {
            $user = User::where('name', 'LIKE', "%{$notifyName}%")->first();
            
            if ($user) {
                SystemLog::create([
                    'level' => 'info', 'service' => 'whatsapp',
                    'message' => "Berhasil mengenali user dari nama WA: {$notifyName} = {$user->name}"
                ]);
            }
        }

        // 3. JIKA TETAP TIDAK KETEMU -> BALAS KE WA MEMBER!
        if (!$user) {
            $pesanGagal = "Halo *{$notifyName}*! 👋\n\n"
                        . "Karena aturan privasi WhatsApp terbaru, kami tidak bisa melihat nomor WA kamu.\n\n"
                        . "Agar bot ini bisa mengirimimu tagihan QRIS, pastikan *Nama* di data Komunitas/KoleksiKas diubah menjadi persis seperti ini: *{$notifyName}*\n\n"
                        . "Silakan ubah namamu di sistem, lalu ketik *1* lagi ya!";
                        
            // Bot akan mengirim pesan peringatan ini ke HP kamu!
            $waha->send($rawFrom, $pesanGagal); 

            SystemLog::create([
                'level' => 'warning', 'service' => 'whatsapp',
                'message' => "BOT MENJAWAB ERROR: Mengirim notifikasi privasi LID ke {$notifyName}."
            ]);
            return response('OK');
        }

        // 4. LOGIKA IKUT & BAYAR
        if ($body === '1' || $body === 'ikut') {
            $groupIds = \App\Models\GroupMember::where('user_id', $user->id)->pluck('group_id');
            $session = Session::whereIn('group_id', $groupIds)
                ->where('status', 'active')
                ->where('scheduled_at', '>', now())
                ->orderBy('scheduled_at', 'asc')->first();

            if ($session) {
                SystemLog::create([
                    'level' => 'info', 'service' => 'whatsapp',
                    'message' => "Member {$user->name} ketik 1. Mengirim QRIS..."
                ]);
                // KITA KIRIM KE $rawFrom (@lid) AGAR SAMPAI KE HP MEMBER
                $this->processPaymentBot($rawFrom, $session->id, $user, $waha);
            }
        }

        return response('OK');
    }

    private function processPaymentBot($rawFrom, $sessionId, $user, WahaService $waha)
    {
        $session = Session::with('group.tenant')->find($sessionId);
        $tenant = $session->group->tenant;

        try {
            $bill = Bill::firstOrCreate(
                ['session_id' => $session->id, 'tenant_id' => $tenant->id],
                ['id' => Str::uuid(), 'name' => "Iuran {$session->name}", 'group_id' => $session->group_id, 'amount' => $session->price, 'created_by' => $session->created_by]
            );

            $billItem = BillItem::create([
                'id' => Str::uuid(), 'bill_id' => $bill->id, 'user_id' => $user->id, 'amount' => $session->price, 'status' => 'pending'
            ]);

            $config = PaymentConfig::where('tenant_id', $tenant->id)->first();
            
            if (!$config) {
                $waha->send($rawFrom, "Maaf, Admin komunitas belum mengatur gateway pembayaran.");
                return;
            }

            $pakasir = new \App\Services\Payment\PakasirService($config->payload);
            $charge = $pakasir->createCharge(['amount' => $session->price, 'user' => $user, 'bill_item_id' => $billItem->id]);

            Transaction::create([
                'id' => Str::uuid(), 'tenant_id' => $tenant->id, 'bill_item_id' => $billItem->id, 'user_id' => $user->id, 'amount' => $session->price, 'payment_url' => $charge['payment_url'], 'status' => 'pending'
            ]);

            $pesan = "💳 *Tagihan Berhasil Dibuat!*\n\n"
                   . "Silakan lakukan pembayaran sebesar *Rp " . number_format($session->price, 0, ',', '.') . "* melalui link QRIS berikut:\n\n"
                   . "🔗 " . $charge['payment_url'] . "\n\n"
                   . "_Sistem akan otomatis mengkonfirmasi slot Anda jika pembayaran telah berhasil._";
            
            // Bot akan menembak QRIS ke LID kamu!
            $waha->send($rawFrom, $pesan);
            
            SystemLog::create([
                'level' => 'info', 'service' => 'whatsapp',
                'message' => "SUKSES: Tagihan QRIS Mabar {$session->name} dikirim ke {$user->name}."
            ]);

        } catch (\Exception $e) {
            $waha->send($rawFrom, "Maaf, sistem pembayaran sedang sibuk. Silakan coba beberapa saat lagi.");
            SystemLog::create(['level' => 'critical', 'service' => 'whatsapp', 'message' => "GAGAL QRIS: " . $e->getMessage()]);
        }
    }
}