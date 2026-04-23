<?php

namespace App\Jobs\WA;

use App\Models\Transaction;
use App\Services\WhatsApp\FonnteService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use App\Services\WhatsApp\WahaService;

class SendWaMemberConfirmJob implements ShouldQueue
{
    use Queueable;

    protected $transaction;

    public function __construct(Transaction $transaction)
    {
        $this->transaction = $transaction;
    }

    public function handle(WahaService $wahaService): void
    {
        // Ambil relasi yang diperlukan
        $this->transaction->loadMissing(['user', 'billItem.bill.session']);
        
        $user = $this->transaction->user;
        $bill = $this->transaction->billItem->bill;
        $session = $bill->session;
        $tenantId = $this->transaction->tenant_id;

        // Susun Pesan
        $amountFormat = 'Rp ' . number_format($this->transaction->amount, 0, ',', '.');
        $date = $session ? $session->scheduled_at->format('d M Y') : $this->transaction->created_at->format('d M Y');
        $time = $session && $session->end_time ? "Jam: {$session->scheduled_at->format('H:i')} - {$session->end_time}" : '';
        $location = $session ? "📍 Lokasi: {$session->location}\n🗺️ Maps: {$session->maps_url}" : '';

        $message = "✅ *Pembayaran Berhasil!*\n\n"
                 . "Halo *{$user->name}*,\n"
                 . "Pembayaran sebesar {$amountFormat} telah kami terima.\n\n"
                 . "📋 *Detail Kegiatan:*\n"
                 . "{$bill->name}\n"
                 . "📅 Tanggal: {$date}\n"
                 . "{$time}\n"
                 . "{$location}\n\n"
                 . "Terima kasih!\n_Pesan otomatis dari KoleksiKas_";

        try {
            // Kirim via Waha Service
            $wahaService->send($user->phone_wa, $message, $tenantId);
        } catch (\Exception $e) {
            Log::error("WA Job Failed: " . $e->getMessage());
            // Di sini nanti bisa tambahkan logika retry atau simpan status gagal ke database
        }
    }
}