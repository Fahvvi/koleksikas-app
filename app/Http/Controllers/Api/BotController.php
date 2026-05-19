<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;

class BotController extends Controller
{
    public function cekTagihan(Request $request)
    {
        // 1. GEMBOK KEAMANAN (Cek API Key dari n8n)
        // Kita gunakan token rahasia "KoleksiKasN8nSecret2026"
        $botToken = $request->bearerToken();
    
    if ($botToken !== 'KoleksiKasN8nSecret2026') {
        return response()->json([
            'success' => false,
            'reply_message' => 'Akses Ditolak: API Key tidak valid.'
        ], 401);
    }

        // 2. Tangkap nomor WA dari n8n
        $phone = $request->query('phone');
        $phone = explode('@', $phone)[0];

        // 3. Cari User berdasarkan nomor WA tersebut
        $user = User::where('phone_wa', $phone)->first();

        // 4. Jika nomor tidak dikenali di database
        if (!$user) {
            return response()->json([
                'success' => false,
                'reply_message' => "Maaf, nomor WhatsApp ini tidak terdaftar di sistem KoleksiKAS. 😔"
            ]);
        }

        // --- DUMMY DATA UNTUK TESTING ---
        $totalTagihan = \App\Models\Bill::where('user_id', $user->id)
                                ->where('status', 'unpaid') // atau 'pending'
                                ->sum('amount');

// 2. Set bulan secara dinamis
        $bulanSekarang = now()->translatedFormat('F Y'); // Mengikuti bulan saat ini, misal: "Mei 2026"

        // 5. Rangkai Pesan Balasan
        if ($totalTagihan > 0) {
            $reply = "Halo *{$user->name}*! 👋\n\nTotal tagihan komunitas Anda untuk periode {$bulanSekarang} adalah:\n*Rp " . number_format($totalTagihan, 0, ',', '.') . "*\n\nSilakan lakukan pembayaran agar akses sistem tetap aktif. Terima kasih! 🙏";
        } else {
            $reply = "Halo *{$user->name}*! 👋\n\nWah, tagihan Anda sudah lunas semua. Terima kasih telah menjadi bagian dari KoleksiKAS! 🎉";
        }

        // 6. Kembalikan ke n8n
        return response()->json([
            'success' => true,
            'reply_message' => $reply
        ]);
    }

}