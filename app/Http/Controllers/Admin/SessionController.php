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
        // SOLUSI: Langsung ambil ID dari kolom tabel user (Aman 100%)
        $tenantId = $request->user()->tenant_id;

        $sessions = Session::with(['group:id,name', 'creator:id,name'])
            ->whereHas('group', function ($q) use ($tenantId) {
                $q->where('tenant_id', $tenantId);
            })
            ->withCount('participants') // Menghitung dari model SessionParticipant
            ->orderBy('scheduled_at', 'desc')
            ->get();

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
        $appUrl = config('app.url'); // Pastikan ini berisi link Ngrok kamu saat testing

        foreach ($members as $member) {
            if ($member->user->phone_wa) {
                // Generate Magic Link Unik per Member
                $magicLink = "{$appUrl}/api/v1/sessions/{$session->id}/join/{$member->user->id}";

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
            }
        }

        \App\Models\SystemLog::create([
            'level' => 'info', 'service' => 'whatsapp',
            'message' => "Admin mem-broadcast Sesi: {$session->name} (Via Magic Link) ke " . count($members) . " member.",
        ]);

        return response()->json(['success' => true, 'message' => 'Broadcast beserta Link Pembayaran berhasil dikirim!']);
    }

    // 6. MAGIC LINK: GENERATE QRIS & REDIRECT
   public function joinAndPay($sessionId, $userId)
    {
        try {
            $session = Session::with('group.tenant')->findOrFail($sessionId);
            $user = \App\Models\User::findOrFail($userId);
            $tenant = $session->group->tenant;

            // Cek apakah member ini sudah bayar sebelumnya
            $existingItem = \App\Models\BillItem::whereHas('bill', function($q) use ($sessionId) {
                $q->where('session_id', $sessionId);
            })->where('user_id', $userId)->first();

            if ($existingItem && $existingItem->status === 'paid') {
                return response("Kamu sudah melunasi pembayaran untuk sesi ini. Sampai jumpa di lapangan! ⚽", 200);
            }

            // 1. Buat Bill Induk (TAMBAHKAN DUE DATE DI SINI)
            $bill = \App\Models\Bill::firstOrCreate(
                ['session_id' => $session->id, 'tenant_id' => $tenant->id],
                [
                    'id' => Str::uuid(), 
                    'name' => "Iuran {$session->name}", 
                    'group_id' => $session->group_id, 
                    'amount' => $session->price, 
                    'created_by' => $session->created_by,
                    'due_date' => $session->scheduled_at // <--- INI SOLUSINYA
                ]
            );

            // 2. Buat Bill Item (Tagihan Individu)
            $billItem = \App\Models\BillItem::firstOrCreate(
                ['bill_id' => $bill->id, 'user_id' => $user->id],
                ['id' => Str::uuid(), 'amount' => $session->price, 'status' => 'pending']
            );

            // 3. Tembak API Pakasir
            $config = \App\Models\PaymentConfig::where('tenant_id', $tenant->id)->first();
            
            // JIKA ADMIN BELUM SETTING, KITA BUATKAN DUMMY SEMENTARA UNTUK TESTING
            if (!$config) {
                $dummyPayload = json_encode(['secret_key' => 'RAHASIA-TESTING-123']);
                $config = \App\Models\PaymentConfig::create([
                    'id' => Str::uuid(),
                    'tenant_id' => $tenant->id,
                    'provider' => 'pakasir',
                    'payload' => $dummyPayload,
                    'is_active' => true
                ]);
                
                \App\Models\SystemLog::create([
                    'level' => 'warning', 'service' => 'payment',
                    'message' => "Membuat konfigurasi Dummy Pakasir otomatis untuk Tenant: {$tenant->id}"
                ]);
            }

            // Lanjut pakai config yang sudah pasti ada
            $pakasir = new \App\Services\Payment\PakasirService($config->payload);
            $charge = $pakasir->createCharge(['amount' => $session->price, 'user' => $user, 'bill_item_id' => $billItem->id]);

            // 4. Catat Transaksi
            \App\Models\Transaction::create([
                'id' => Str::uuid(), 
                'tenant_id' => $tenant->id, 
                'bill_item_id' => $billItem->id, 
                'user_id' => $user->id, 
                'amount' => $session->price, 
                'payment_url' => $charge['payment_url'], 
                'status' => 'pending'
            ]);

            // 5. REDIRECT BROWSER MEMBER LANGSUNG KE HALAMAN QRIS
            return redirect()->away($charge['payment_url']);

        } catch (\Exception $e) {
            \App\Models\SystemLog::create([
                'level' => 'critical', 'service' => 'payment',
                'message' => "Gagal Magic Link QRIS: " . $e->getMessage()
            ]);
            return response("Maaf, sistem sedang sibuk. Silakan coba klik link lagi dalam beberapa menit.", 500);
        }
    }
}