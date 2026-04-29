<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Session;
use App\Models\Group;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SessionController extends Controller
{
    // 1. GET ALL SESSIONS
    public function index(Request $request)
    {
        $tenantId = $request->user()->tenant_id;

        $sessions = Session::whereHas('group', function ($q) use ($tenantId) {
            $q->where('tenant_id', $tenantId);
        })
        ->with('group')
        // 👇 TAMBAHKAN BARIS INI UNTUK MENGAMBIL PESERTA
        ->with(['participants.user:id,name,phone_wa']) 
        ->orderBy('scheduled_at', 'desc')
        ->get()
        ->map(function ($session) {
            return [
                'id' => $session->id,
                'name' => $session->name,
                'group' => $session->group,
                'location' => $session->location,
                'scheduled_at' => $session->scheduled_at,
                'price' => $session->price,
                'max_participants' => $session->max_participants,
                'participants_count' => $session->participants()->where('status', 'confirmed')->count(),
                'status' => $session->status,
                'is_public' => $session->is_public,
                'description' => $session->description,
                
                // 👇 PETAKAN DAFTAR PESERTA YANG SUDAH CONFIRMED
                'confirmed_participants' => $session->participants
                    ->where('status', 'confirmed')
                    ->map(function ($p) {
                        return [
                            'id' => $p->user->id ?? 'unknown',
                            'name' => $p->user->name ?? 'User Terhapus',
                            'phone' => $p->user->phone_wa ?? '-'
                        ];
                    })->values()
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $sessions
        ]);
    }

    // 2. CREATE NEW SESSION
    public function store(Request $request)
    {
        $tenantId = $request->user()->tenant_id;

        $request->validate([
            'group_id' => 'required|uuid',
            'name' => 'required|string|max:255',
            'scheduled_at' => 'required|date',
            'end_time' => 'nullable|date_format:H:i',
            'location' => 'required|string|max:255',
            'maps_url' => 'nullable|url',
            'price' => 'required|numeric|min:0',
            'max_participants' => 'nullable|integer|min:1',
            'is_public' => 'boolean',
            'description' => 'nullable|string'
        ]);

        $group = Group::where('id', $request->group_id)
            ->where('tenant_id', $tenantId)
            ->first();

        if (!$group) {
            return response()->json(['message' => 'Grup tidak valid atau bukan milik Anda.'], 403);
        }

        $session = Session::create([
            'id' => Str::uuid(),
            'group_id' => $group->id,
            'name' => $request->name,
            'description' => $request->description,
            'scheduled_at' => $request->scheduled_at,
            'end_time' => $request->end_time,
            'location' => $request->location,
            'maps_url' => $request->maps_url,
            'max_participants' => $request->max_participants ?? 30,
            'price' => $request->price,
            'is_public' => $request->is_public ?? false,
            'status' => 'active',
            'created_by' => $request->user()->id
        ]);

        return response()->json(['success' => true, 'message' => 'Jadwal sesi berhasil dibuat!']);
    }

    // 3. GET DETAIL SESSION
    public function show(Request $request, $id)
    {
        $tenantId = $request->user()->tenant_id;

        $session = Session::with(['group:id,name', 'creator:id,name'])
            ->whereHas('group', function ($q) use ($tenantId) {
                $q->where('tenant_id', $tenantId);
            })
            ->withCount('participants')
            ->findOrFail($id);

        return response()->json(['success' => true, 'data' => $session]);
    }

    // 4. DELETE SESSION
    public function destroy(Request $request, $id)
    {
        $tenantId = $request->user()->tenant_id;

        $session = Session::whereHas('group', function ($q) use ($tenantId) {
            $q->where('tenant_id', $tenantId);
        })->where('id', $id)->firstOrFail();

        $session->delete();

        return response()->json(['success' => true, 'message' => 'Sesi berhasil dihapus.']);
    }

    // 5. BROADCAST WHATSAPP KE MEMBER
    // 5. BROADCAST WHATSAPP KE MEMBER
    public function broadcast(Request $request, $id)
    {
        $tenantId = $request->user()->tenant_id;

        $session = Session::with('group')->whereHas('group', function ($q) use ($tenantId) {
            $q->where('tenant_id', $tenantId);
        })->findOrFail($id);

        if ($session->is_public) {
            return response()->json(['message' => 'Sesi Publik tidak di-broadcast ke grup.'], 400);
        }

        $members = \App\Models\GroupMember::with('user')->where('group_id', $session->group_id)->get();
        $wahaService = new \App\Services\WhatsApp\WahaService();

        $mapsUrl = $session->maps_url ?: 'Belum ditentukan oleh Admin';
        $appUrl = config('app.url'); 

        // --- FILTERING LOGIC: Ambil daftar ID user yang sudah CONFIRMED (Sudah Bayar) ---
        $confirmedUserIds = \App\Models\SessionParticipant::where('session_id', $session->id)
            ->where('status', 'confirmed')
            ->pluck('user_id')
            ->toArray();

        $pesanTerkirim = 0; // Penghitung pesan sukses

        foreach ($members as $member) {
            // CEK: Jika user ini sudah ada di daftar confirmed, lewati (jangan kirim WA)
            if (in_array($member->user->id, $confirmedUserIds)) {
                continue; 
            }

            if ($member->user->phone_wa) {
                // Generate Magic Link Unik per Member
                // $magicLink = "{$appUrl}/api/v1/sessions/{$session->id}/join/{$member->user->id}";

                $magicLink = "{$appUrl}/checkout/{$session->id}/{$member->user->id}";


                $pesan = "📢 *UNDANGAN MABAR: {$session->name}*\n\n"
                       . "📍 Lokasi: {$session->location}\n"
                       . "🗺️ Maps: {$mapsUrl}\n"
                       . "🕒 Waktu: " . $session->scheduled_at->format('d M Y, H:i') . "\n"
                       . "💸 HTM: Rp " . number_format($session->price, 0, ',', '.') . "\n\n"
                       . "✅ *Ingin Ikut?*\n"
                       . "Klik link di bawah ini untuk mengamankan slot & mendapatkan QRIS pembayaran:\n"
                       . "🔗 {$magicLink}\n\n"
                       . "_Abaikan pesan ini jika tidak ingin ikut._";

                $wahaService->send($member->user->phone_wa, $pesan);
                $pesanTerkirim++;
            }
        }

        \App\Models\SystemLog::create([
            'level' => 'info', 'service' => 'whatsapp',
            'message' => "Admin mem-broadcast Sesi: {$session->name} (Via Magic Link) ke {$pesanTerkirim} member (melewati yang sudah bayar).",
        ]);

        return response()->json([
            'success' => true, 
            'message' => "Broadcast berhasil dikirim ke {$pesanTerkirim} member yang belum mendaftar!"
        ]);
    }

    // 6. MAGIC LINK: GENERATE QRIS & REDIRECT
   private function resolvePaymentConfig($tenantId)
    {
        // 1. Cek konfigurasi spesifik Tenant (Priority)
        $config = \App\Models\PaymentConfig::where('tenant_id', $tenantId)
                    ->where('is_active', true)
                    ->first();

        // Jika kosong atau slug-nya belum diisi, ambil config pusat (Global)
        if (!$config || empty(json_decode($config->payload)->project)) {
            $config = \App\Models\PaymentConfig::whereNull('tenant_id')->first(); 
            $isHeldByPlatform = true; // Tandai bahwa dana masuk ke kita
        }

        // 2. Jika tenant tidak punya, ambil dari Global Settings Super Admin
        $globalProject = \App\Models\GlobalSetting::where('key', 'pakasir_project')->first();
        $globalApiKey = \App\Models\GlobalSetting::where('key', 'pakasir_api_key')->first();

        // LOGIKA PENGECEKAN DIPERBAIKI:
        if ($globalProject && $globalApiKey && !empty($globalProject->value) && !empty($globalApiKey->value)) {
            
            \Illuminate\Support\Facades\Log::info("Menggunakan Payment Config GLOBAL (Pakasir Project: {$globalProject->value})");
            
            // Kita bungkus ke object agar formatnya sama dengan PaymentConfig
            return (object) [
                'provider' => 'pakasir',
                'payload' => json_encode([
                    'project' => $globalProject->value,
                    'api_key' => $globalApiKey->value
                ])
            ];
        }

        \Illuminate\Support\Facades\Log::warning("GAGAL RESOLUSI: Payment Config Lokal kosong, Global Settings juga tidak lengkap.");
        return null;
    }

public function joinAndPay($sessionId, $userId)
{
    try {
        $session = Session::with('group.tenant')->findOrFail($sessionId);
        $user = \App\Models\User::findOrFail($userId);
        $tenantId = $session->group->tenant_id;

        // 1. Ambil Config Gateway
        $config = $this->resolvePaymentConfig($tenantId);
        if (!$config) return response("Sistem pembayaran belum siap.", 400);

        // --- 🚀 LOGIKA BARU: TAMBAHKAN PLATFORM FEE ---
        // Ambil nominal fee dari Global Settings
        $feeSetting = \App\Models\GlobalSetting::where('key', 'platform_fee')->first();
        $platformFee = $feeSetting ? (int) $feeSetting->value : 0;

        // Hitung Total yang Harus Dibayar Member
        $totalAmount = (int) $session->price + $platformFee;
        // ----------------------------------------------

        // 2. Buat/Update Bill & BillItem menggunakan totalAmount
        $bill = \App\Models\Bill::firstOrCreate(
            ['session_id' => $session->id, 'tenant_id' => $tenantId],
            [
                'id' => \Illuminate\Support\Str::uuid(),
                'group_id' => $session->group_id,
                'name' => "Iuran {$session->name}",
                'created_by' => $session->created_by,
                'due_date' => $session->scheduled_at,
                'amount' => $totalAmount, // Gunakan total
                'status' => 'active'
            ]
        );

        $billItem = \App\Models\BillItem::firstOrCreate(
            ['bill_id' => $bill->id, 'user_id' => $user->id],
            ['id' => \Illuminate\Support\Str::uuid(), 'amount' => $totalAmount, 'status' => 'pending']
        ); 
        
        if ($billItem->status === 'paid') {
            return response()->json(['already_paid' => true, 'message' => 'Tagihan ini sudah lunas.']);
        }

        // 👇 1. CEK APAKAH ADA TRANSAKSI PENDING SEBELUMNYA 👇
        $pendingTx = \App\Models\Transaction::where('bill_item_id', $billItem->id)
            ->where('status', 'pending')
            ->first();

        // JIKA ADA, KEMBALIKAN QRIS YANG LAMA TANPA NEMBAK API LAGI
        if ($pendingTx && $pendingTx->payment_url) {
            $baseAmount = (int) $session->price;
            $koleksikasFee = (int) $platformFee;
            $subTotal = $baseAmount + $koleksikasFee;
            $pakasirFee = round($subTotal * 0.007) + 310;

            return response()->json([
                'success' => true,
                'message' => 'Lanjutkan pembayaran',
                'data' => [
                    'transaction_id' => $pendingTx->id,
                    'session_name' => $session->name,
                    'base_amount' => $baseAmount,
                    'platform_fee' => $koleksikasFee,
                    'pakasir_fee' => $pakasirFee,
                    'grand_total' => $subTotal + $pakasirFee, 
                    'due_date' => \Carbon\Carbon::parse($session->scheduled_at)->format('d M Y, H:i'),
                    'qris_expires_at' => $pendingTx->created_at->addHour()->format('d M Y, [H:i] WIB'),
                    'qr_string' => $pendingTx->payment_url // 👈 AMBIL DARI DATABASE
                ]
            ]);
        }

        // 👇 2. JIKA BELUM ADA, BARU TEMBAK API PAKASIR 👇
        $transactionId = (string) \Illuminate\Support\Str::uuid();
        $pakasir = new \App\Services\Payment\PakasirService($config->payload);
        
        $charge = $pakasir->createCharge([
            'amount' => $totalAmount, 
            'user' => $user, 
            'transaction_id' => $transactionId
        ]);

        \App\Models\Transaction::create([
            'id' => $transactionId,
            'tenant_id' => $tenantId, 
            'bill_item_id' => $billItem->id, 
            'user_id' => $user->id, 
            'amount' => $totalAmount, 
            'payment_url' => $charge['qr_code'], // 👈 SIMPAN STRING QRIS KE SINI!
            'status' => 'pending'
        ]);
        

        // 3. Eksekusi Pakasir & Catat Transaksi
        $transactionId = (string) \Illuminate\Support\Str::uuid();
        $pakasir = new \App\Services\Payment\PakasirService($config->payload);
        
        $charge = $pakasir->createCharge([
            'amount' => $totalAmount, // Member akan bayar harga mabar + fee Rp 100
            'user' => $user, 
            'transaction_id' => $transactionId
        ]);

        \App\Models\Transaction::create([
            'id' => $transactionId,
            'tenant_id' => $tenantId, 
            'bill_item_id' => $billItem->id, 
            'user_id' => $user->id, 
            'amount' => $totalAmount, 
            'payment_url' => 'API_NATIVE', // Tandai bahwa ini bukan link redirect
            'status' => 'pending'
        ]);

        // Hitung rincian biaya untuk ditampilkan di Frontend
            $baseAmount = (int) $session->price;
            $koleksikasFee = (int) $platformFee;
            $subTotal = $baseAmount + $koleksikasFee;
            
            // Rumus Fee Pakasir: (Subtotal * 0.7%) + Rp 310
            // Kita gunakan round() agar pembulatannya akurat
            $pakasirFee = round($subTotal * 0.007) + 310;
            $grandTotal = $subTotal + $pakasirFee;

        // JANGAN REDIRECT. KEMBALIKAN JSON KE REACT!
        return response()->json([
            'success' => true,
            'message' => 'Tagihan berhasil dibuat',
            'data' => [
                'transaction_id' => $transactionId,
                'session_name' => $session->name,
                
                // Rincian Biaya
                'base_amount' => $baseAmount,
                'platform_fee' => $koleksikasFee,
                'pakasir_fee' => $pakasirFee,
                'grand_total' => $grandTotal, 
                
                // Format Waktu
                'due_date' => \Carbon\Carbon::parse($session->scheduled_at)->format('d M Y, H:i'),
                'qris_expires_at' => now()->addHour()->format('d M Y, [H:i] WIB'), // Contoh: 28 Apr 2026, [16:05] WIB
                
                'qr_string' => $charge['qr_code']
            ]
        ]);

    } catch (\Exception $e) {
        \App\Models\SystemLog::create([
            'level' => 'critical', 'service' => 'payment',
            'message' => "Gagal Magic Link NATIVE: " . $e->getMessage()
        ]);
        return response()->json(['message' => 'Sistem sedang sibuk.'], 500);
    }
}

public function exportAttendance($id)
{
    $session = Session::with(['participants.user', 'group'])->findOrFail($id);
    $participants = $session->participants->where('status', 'confirmed');

    // Di sini nanti logika DomPDF untuk memproses view ke PDF
    // return PDF::loadView('pdf.attendance', compact('session', 'participants'))->download('Absensi.pdf');
}

// ==========================================
    // FITUR MANUAL REMINDER (COLEK MEMBER)
    // ==========================================
    public function remind(Request $request, $id)
    {
        $tenantId = $request->user()->tenant_id;

        // Ambil data sesi dan pastikan milik tenant ini
        $session = Session::with('group')->whereHas('group', function ($q) use ($tenantId) {
            $q->where('tenant_id', $tenantId);
        })->findOrFail($id);

        if ($session->is_public) {
            return response()->json(['message' => 'Sesi Publik tidak bisa di-remind ke grup.'], 400);
        }

        // Ambil semua member di grup ini
        $members = \App\Models\GroupMember::with('user')->where('group_id', $session->group_id)->get();
        $wahaService = new \App\Services\WhatsApp\WahaService();

        // Ambil daftar ID user yang SUDAH LUNAS / CONFIRMED
        $confirmedUserIds = \App\Models\SessionParticipant::where('session_id', $session->id)
            ->where('status', 'confirmed')
            ->pluck('user_id')
            ->toArray();

        $pesanTerkirim = 0;
        $appUrl = config('app.url');

        foreach ($members as $member) {
            // HANYA KIRIM JIKA USER BELUM ADA DI DAFTAR LUNAS
            if (!in_array($member->user->id, $confirmedUserIds) && $member->user->phone_wa) {
                
                $magicLink = "{$appUrl}/checkout/{$session->id}/{$member->user->id}";

                $pesan = "🔔 *PENGINGAT MABAR: {$session->name}*\n\n"
                       . "Halo *{$member->user->name}*,\n"
                       . "Slot mabar masih tersedia nih! Jangan sampai kehabisan ya.\n\n"
                       . "Segera amankan slotmu dengan membayar iuran melalui link berikut:\n"
                       . "🔗 {$magicLink}\n\n"
                       . "_Abaikan pesan ini jika kamu berhalangan hadir._";

                // Eksekusi kirim WA
                $wahaService->send($member->user->phone_wa, $pesan);
                $pesanTerkirim++;
            }
        }

        // Catat ke log sistem
        \App\Models\SystemLog::create([
            'level' => 'info', 'service' => 'whatsapp',
            'message' => "Admin mencolek {$pesanTerkirim} member yang belum bayar di sesi: {$session->name}",
        ]);

        return response()->json([
            'success' => true, 
            'message' => "Pengingat berhasil dikirim ke {$pesanTerkirim} member yang belum membayar!"
        ]);
    }

}