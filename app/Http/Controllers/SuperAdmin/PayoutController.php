<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\PayoutRequest;
use App\Models\User;
use App\Models\SystemLog;
use App\Services\WhatsApp\WahaService;
use Illuminate\Http\Request;

class PayoutController extends Controller
{
    // 1. GET ALL PAYOUT REQUESTS
   
    public function index(Request $request)
    {
        // Menggunakan CASE WHEN agar kompatibel dengan PostgreSQL, SQLite, dan MySQL
        $payouts = PayoutRequest::withoutGlobalScopes()
            ->with('tenant.mitra')
            ->orderByRaw("
                CASE status 
                    WHEN 'pending' THEN 1 
                    WHEN 'processing' THEN 2 
                    WHEN 'completed' THEN 3 
                    WHEN 'rejected' THEN 4 
                    ELSE 5 
                END
            ")
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $payouts
        ]);
    }

    // 2. UBAH STATUS KE "PROCESSING" 
    public function process($id)
    {
        // 👇 TAMBAHKAN withoutGlobalScopes() SAAT MENCARI DATA (Jika tidak, akan 404 Not Found)
        $payout = PayoutRequest::withoutGlobalScopes()->findOrFail($id);
        
        if ($payout->status !== 'pending') {
            return response()->json(['message' => 'Hanya status pending yang bisa diproses.'], 400);
        }

        $payout->update(['status' => 'processing']);

        SystemLog::create([
            'level' => 'info', 'service' => 'finance',
            'message' => "Super Admin memproses penarikan dana ID: {$payout->id} (Rp " . number_format($payout->amount, 0, ',', '.') . ")"
        ]);

        return response()->json(['success' => true, 'message' => 'Status diubah menjadi Diproses.']);
    }

    // 3. UBAH STATUS KE "COMPLETED" & KIRIM WA BOT
    public function complete($id)
    {
        // 👇 TAMBAHKAN withoutGlobalScopes()
        $payout = PayoutRequest::withoutGlobalScopes()->findOrFail($id);
        
        if ($payout->status !== 'processing' && $payout->status !== 'pending') {
            return response()->json(['message' => 'Status tidak valid untuk diselesaikan.'], 400);
        }

        $payout->update(['status' => 'completed']);

        // Cari Admin dari Tenant yang mencairkan dana
        $adminUser = User::where('tenant_id', $payout->tenant_id)
            ->whereIn('role', ['admin'])
            ->first();

        // JIKA ADMIN PUNYA NOMOR WA, KIRIM BOT!
        if ($adminUser && $adminUser->phone_wa) {
            $wahaService = new WahaService();
            $nominal = number_format($payout->amount, 0, ',', '.');
            
            $pesan = "✅ *PENCAIRAN DANA BERHASIL*\n\n"
                   . "Halo *{$adminUser->name}*,\n"
                   . "Dana sebesar *Rp {$nominal}* telah berhasil kami transfer ke rekening Anda:\n\n"
                   . "🏦 Bank: {$payout->bank_name}\n"
                   . "💳 No. Rek: {$payout->account_number}\n"
                   . "👤 A.n: {$payout->account_holder}\n\n"
                   . "Terima kasih telah mempercayakan pengelolaan kas komunitas Anda bersama *KoleksiKas*! 🚀";

            try {
                $wahaService->send($adminUser->phone_wa, $pesan);
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error("Gagal kirim WA Payout: " . $e->getMessage());
            }
        }

        SystemLog::create([
            'level' => 'info', 'service' => 'finance',
            'message' => "Pencairan dana selesai ID: {$payout->id}."
        ]);

        return response()->json(['success' => true, 'message' => 'Pencairan Selesai! Notifikasi WA telah dikirim ke Mitra.']);
    }

    // 4. UBAH STATUS KE "REJECTED" 
    public function reject(Request $request, $id)
    {
        $request->validate(['reason' => 'required|string']);
        
        // 👇 TAMBAHKAN withoutGlobalScopes()
        $payout = PayoutRequest::withoutGlobalScopes()->findOrFail($id);
        $payout->update(['status' => 'rejected']);

        $adminUser = User::where('tenant_id', $payout->tenant_id)->where('role', 'admin')->first();

        if ($adminUser && $adminUser->phone_wa) {
            $wahaService = new WahaService();
            $nominal = number_format($payout->amount, 0, ',', '.');
            
            $pesan = "❌ *PENCAIRAN DANA GAGAL*\n\n"
                   . "Halo *{$adminUser->name}*,\n"
                   . "Mohon maaf, penarikan dana sebesar *Rp {$nominal}* gagal diproses dengan alasan:\n"
                   . "_{$request->reason}_\n\n"
                   . "Silakan perbaiki data rekening Anda di menu Pengaturan lalu ajukan penarikan kembali.";

            $wahaService->send($adminUser->phone_wa, $pesan);
        }

        return response()->json(['success' => true, 'message' => 'Pencairan Ditolak. Notifikasi WA telah dikirim.']);
    }
}