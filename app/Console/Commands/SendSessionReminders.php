<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Session;
use App\Models\SessionParticipant;
use App\Services\WhatsApp\WahaService;

class SendSessionReminders extends Command
{
    protected $signature = 'app:send-session-reminders';
    protected $description = 'Kirim reminder WA H-1 untuk peserta sesi berjalan';

    public function handle(WahaService $waha)
    {
        // Cari sesi yang akan berjalan BESOK
        $sessions = Session::whereDate('scheduled_at', now()->addDay()->toDateString())
                           ->where('status', 'active')
                           ->get();

        foreach ($sessions as $session) {
            $time = $session->scheduled_at->format('H:i');
            
            // LOGIKA BARU: Hanya ambil dari tabel partisipan (yang sudah niat ikut)
            $participants = SessionParticipant::with('user')->where('session_id', $session->id)->get();

            foreach ($participants as $participant) {
                $user = $participant->user;
                if (!$user->phone_wa) continue;

                if ($participant->status === 'confirmed') {
                    // SUDAH BAYAR / LUNAS: Hanya ingatkan acara
                    $msg = "🔔 *Reminder Mabar Besok!*\n\n"
                         . "Halo {$user->name}, jangan lupa besok kita ada mabar *{$session->name}* jam {$time} di {$session->location}.\n\n"
                         . "Siapkan fisik dan jangan sampai telat ya! ⚽🔥";
                    $waha->send($user->phone_wa, $msg);
                } else {
                    // PENDING / BELUM LUNAS: Ingatkan bayar dan acara
                    $msg = "⚠️ *Reminder Pembayaran Mabar!*\n\n"
                         . "Halo {$user->name}, besok ada mabar *{$session->name}* jam {$time}, tapi kami mendeteksi tagihanmu belum lunas.\n\n"
                         . "Segera selesaikan pembayaranmu agar slot tidak diberikan kepada pemain lain! 🏃‍♂️💨";
                    $waha->send($user->phone_wa, $msg);
                }
            }
        }

        $this->info('Reminder H-1 berhasil dikirim ke partisipan terdaftar.');
    }
}