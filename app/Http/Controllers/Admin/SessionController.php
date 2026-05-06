<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Session;
use App\Models\Group;
use App\Models\Bill;
use App\Models\BillItem;
use App\Models\Transaction;
use App\Models\SessionParticipant;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

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
        ->orderBy('scheduled_at', 'desc')
        ->get()
        ->map(function ($session) {
            // 👇 AMBIL SEMUA PESERTA DARI BILL ITEMS (YANG PENDING & PAID) 👇
            $billItems = BillItem::with('user')->whereHas('bill', function($q) use ($session) {
                $q->where('session_id', $session->id);
            })->get();

            return [
                'id' => $session->id,
                'name' => $session->name,
                'type' => $session->type,
                'group' => $session->group,
                'location' => $session->location,
                'scheduled_at' => $session->scheduled_at,
                'price' => $session->price,
                'max_participants' => $session->max_participants,
                'participants_count' => $billItems->where('status', 'paid')->count(),
                'status' => $session->status,
                'is_public' => $session->is_public,
                'description' => $session->description,
                
                // 👇 PETAKAN SEMUA PESERTA (TERMASUK YANG PENDING) 👇
                'all_participants' => $billItems->map(function ($item) {
                    return [
                        'id' => $item->user->id ?? 'unknown',
                        'name' => $item->user->name ?? 'User Terhapus',
                        'phone' => $item->user->phone_wa ?? '-',
                        'status' => $item->status, // 'pending' atau 'paid'
                        'amount' => $item->amount
                    ];
                })->values()
            ];
        });

        return response()->json(['success' => true, 'data' => $sessions]);
    }

    public function store(Request $request)
    {
        $tenantId = $request->user()->tenant_id;

        $request->validate([
            'group_id' => 'required|uuid',
            'name' => 'required|string|max:255',
            'scheduled_at' => 'required|date',
            'end_time' => 'nullable|date_format:H:i',
            'location' => 'nullable|string|max:255',
            'type' => 'required|in:event,arisan,iuran',
            'maps_url' => 'nullable|url',
            'price' => 'required|numeric|min:0',
            'max_participants' => 'nullable|integer|min:1',
            'is_public' => 'boolean',
            'description' => 'nullable|string'
        ]);

        $group = Group::where('id', $request->group_id)->where('tenant_id', $tenantId)->first();

        if (!$group) {
            return response()->json(['message' => 'Grup tidak valid atau bukan milik Anda.'], 403);
        }

        Session::create([
            'id' => Str::uuid(),
            'group_id' => $group->id,
            'name' => $request->name,
            'description' => $request->description,
            'type' => $request->type,
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

        return response()->json(['success' => true, 'message' => 'Tagihan/Jadwal berhasil dibuat!']);
    }

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

    public function destroy(Request $request, $id)
    {
        $tenantId = $request->user()->tenant_id;

        $session = Session::whereHas('group', function ($q) use ($tenantId) {
            $q->where('tenant_id', $tenantId);
        })->where('id', $id)->firstOrFail();

        $session->delete();

        return response()->json(['success' => true, 'message' => 'Data berhasil dihapus.']);
    }

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
        $appUrl = config('app.url'); 
        $mapsUrl = $session->maps_url ?: 'Belum ditentukan oleh Admin';

        $confirmedUserIds = \App\Models\SessionParticipant::where('session_id', $session->id)
            ->where('status', 'confirmed')
            ->pluck('user_id')
            ->toArray();

        $pesanTerkirim = 0; 

        foreach ($members as $member) {
            if (!in_array($member->user->id, $confirmedUserIds) && $member->user->phone_wa) {
                $magicLink = "{$appUrl}/checkout/{$session->id}/{$member->user->id}";

                if ($session->type === 'arisan') {
                    $pesan = "🤝 *TAGIHAN ARISAN: {$session->name}*\n\n"
                           . "Halo *{$member->user->name}*,\n"
                           . "Waktunya setor arisan untuk periode ini. Mohon segera diselesaikan sebelum: " . $session->scheduled_at->format('d M Y, H:i') . "\n\n"
                           . "💸 Nominal: Rp " . number_format($session->price, 0, ',', '.') . "\n\n"
                           . "✅ *Bayar Sekarang via Link:*\n"
                           . "🔗 {$magicLink}\n\n";
                } elseif ($session->type === 'iuran') {
                    $pesan = "💰 *IURAN: {$session->name}*\n\n"
                           . "Halo *{$member->user->name}*,\n"
                           . "Iuran kas komunitas telah diterbitkan. Yuk bayar agar iuran kita terpenuhi!\n\n"
                           . "💸 Nominal: Rp " . number_format($session->price, 0, ',', '.') . "\n"
                           . "⏳ Tenggat Waktu: " . $session->scheduled_at->format('d M Y') . "\n\n"
                           . "✅ *Bayar Sekarang via Link:*\n"
                           . "🔗 {$magicLink}";
                } else {
                    $pesan = "📢 *UNDANGAN: {$session->name}*\n\n"
                           . "📍 Lokasi: {$session->location}\n"
                           . "🗺️ Maps: {$mapsUrl}\n"
                           . "🕒 Waktu: " . $session->scheduled_at->format('d M Y, H:i') . "\n"
                           . "💸 HTM: Rp " . number_format($session->price, 0, ',', '.') . "\n\n"
                           . "✅ *Ingin Ikut?*\n"
                           . "Klik link di bawah ini untuk mengamankan slot:\n"
                           . "🔗 {$magicLink}";
                }

                $wahaService->send($member->user->phone_wa, $pesan);
                $pesanTerkirim++;
            }
        }

        \App\Models\SystemLog::create([
            'level' => 'info', 'service' => 'whatsapp',
            'message' => "Admin mem-broadcast {$session->type}: {$session->name} ke {$pesanTerkirim} member.",
        ]);

        return response()->json([
            'success' => true, 
            'message' => "Broadcast berhasil dikirim ke {$pesanTerkirim} member yang belum mendaftar!"
        ]);
    }

    // 6. MAGIC LINK: GENERATE QRIS & REDIRECT
    // 6. MAGIC LINK: GENERATE QRIS & REDIRECT
    private function resolvePaymentConfig($tenantId)
    {
        $config = \App\Models\PaymentConfig::where('tenant_id', $tenantId)
                    ->where('is_active', true)
                    ->first();

        // 👇 CEK JIKA GATEWAY MITRA BUKAN KOLEKSIKAS, KEMBALIKAN GATEWAY MEREKA 👇
        if ($config && $config->provider !== 'koleksikas') {
            return $config;
        }

        // JIKA GATEWAY KOLEKSIKAS ATAU KOSONG, FALLBACK KE SUPER ADMIN
        $globalProject = \App\Models\GlobalSetting::where('key', 'pakasir_project')->first();
        $globalApiKey = \App\Models\GlobalSetting::where('key', 'pakasir_api_key')->first();

        if ($globalProject && $globalApiKey && !empty($globalProject->value) && !empty($globalApiKey->value)) {
            return (object) [
                'provider' => 'koleksikas', // 👈 Kita set ini agar sistem tahu ini adalah gateway utama
                'payload' => json_encode([
                    'project' => $globalProject->value,
                    'api_key' => $globalApiKey->value
                ])
            ];
        }

        return null;
    }

    public function joinAndPay($sessionId, $userId)
    {
        try {
            $session = Session::with('group.tenant')->findOrFail($sessionId);
            $user = \App\Models\User::findOrFail($userId);
            $tenantId = $session->group->tenant_id;

            $config = $this->resolvePaymentConfig($tenantId);
            if (!$config) return response()->json(['message' => 'Sistem pembayaran belum siap.'], 400);

            // TENTUKAN JENIS GATEWAY
            $isKoleksiKas = $config->provider === 'koleksikas';
            $isStaticQris = $config->provider === 'static_qris';

            // 👇 LOGIKA BARU: PLATFORM FEE HANYA BERLAKU JIKA PAKAI KOLEKSIKAS GATEWAY 👇
            $feeSetting = \App\Models\GlobalSetting::where('key', 'platform_fee')->first();
            $platformFee = $isKoleksiKas ? ((int) ($feeSetting->value ?? 0)) : 0;
            
            $baseAmount = (int) $session->price;
            $totalAmount = $baseAmount + $platformFee;

            $bill = Bill::firstOrCreate(
                ['session_id' => $session->id, 'tenant_id' => $tenantId],
                ['id' => Str::uuid(), 'group_id' => $session->group_id, 'name' => "Tagihan {$session->name}", 'amount' => $totalAmount, 'status' => 'active', 'due_date' => $session->scheduled_at, 'created_by' => $session->created_by]
            );

            $billItem = BillItem::firstOrCreate(
                ['bill_id' => $bill->id, 'user_id' => $user->id],
                ['id' => Str::uuid(), 'amount' => $totalAmount, 'status' => 'pending']
            ); 

            if ($billItem->status === 'paid') return response()->json(['already_paid' => true, 'message' => 'Tagihan ini sudah lunas.']);

            // 👇 1. JIKA GATEWAY ADALAH QRIS STATIS (MANUAL) 👇
            if ($isStaticQris) {
                $payloadData = json_decode($config->payload, true);
                $qrImage = $payloadData['qr_image'] ?? null;

                if (!$qrImage) return response()->json(['message' => 'QRIS Statis belum diatur oleh Admin komunitas ini.'], 400);

                $pendingTx = Transaction::where('bill_item_id', $billItem->id)->where('status', 'pending')->first();
                $transactionId = $pendingTx ? $pendingTx->id : (string) Str::uuid();

                if (!$pendingTx) {
                    Transaction::create([
                        'id' => $transactionId, 'tenant_id' => $tenantId, 'bill_item_id' => $billItem->id, 
                        'user_id' => $user->id, 'amount' => $totalAmount, 'payment_url' => $qrImage, 'status' => 'pending'
                    ]);
                }

                return response()->json([
                    'success' => true,
                    'data' => [
                        'transaction_id' => $transactionId,
                        'session_name' => $session->name,
                        'base_amount' => $baseAmount,
                        'platform_fee' => 0,
                        'pakasir_fee' => 0,
                        'grand_total' => $totalAmount,
                        'due_date' => \Carbon\Carbon::parse($session->scheduled_at)->format('d M Y, H:i'),
                        'qr_string' => $qrImage,
                        'is_static' => true 
                    ]
                ]);
            }

            // CEK TRANSAKSI DINAMIS PENDING
            $pendingTx = Transaction::where('bill_item_id', $billItem->id)->where('status', 'pending')->first();
            
            if ($pendingTx && $pendingTx->payment_url) {
                if ($pendingTx->amount == $totalAmount) {
                    $pakasirFee = round($totalAmount * 0.007) + 310;
                    
                    return response()->json([
                        'success' => true,
                        'message' => 'Lanjutkan pembayaran',
                        'data' => [
                            'transaction_id' => $pendingTx->id,
                            'session_name' => $session->name,
                            'base_amount' => $baseAmount,
                            'platform_fee' => $platformFee,
                            'pakasir_fee' => $pakasirFee,
                            'grand_total' => $totalAmount + $pakasirFee, 
                            'due_date' => \Carbon\Carbon::parse($session->scheduled_at)->format('d M Y, H:i'),
                            'qris_expires_at' => $pendingTx->created_at->addHour()->format('d M Y, [H:i] WIB'), // 👈 INI SUDAH DIKEMBALIKAN!
                            'qr_string' => $pendingTx->payment_url,
                            'is_static' => false 
                        ]
                    ]);
                } else {
                    $pendingTx->update(['status' => 'expired']);
                }
            }

            // 👇 2. JIKA GATEWAY DINAMIS (KOLEKSIKAS / PAKASIR MANDIRI) 👇
            $transactionId = (string) Str::uuid();
            $pakasir = new \App\Services\Payment\PakasirService($config->payload);
            $charge = $pakasir->createCharge(['amount' => $totalAmount, 'user' => $user, 'transaction_id' => $transactionId]);

            Transaction::create([
                'id' => $transactionId, 'tenant_id' => $tenantId, 'bill_item_id' => $billItem->id, 
                'user_id' => $user->id, 'amount' => $totalAmount, 'payment_url' => $charge['qr_code'], 'status' => 'pending'
            ]);

            $pakasirFee = round($totalAmount * 0.007) + 310;
            $grandTotal = $totalAmount + $pakasirFee;

            return response()->json([
                'success' => true,
                'message' => 'Tagihan berhasil dibuat',
                'data' => [
                    'transaction_id' => $transactionId,
                    'session_name' => $session->name,
                    'base_amount' => $baseAmount,
                    'platform_fee' => $platformFee,
                    'pakasir_fee' => $pakasirFee,
                    'grand_total' => $grandTotal, 
                    'due_date' => \Carbon\Carbon::parse($session->scheduled_at)->format('d M Y, H:i'),
                    'qris_expires_at' => now()->addHour()->format('d M Y, [H:i] WIB'), // 👈 INI SUDAH DIKEMBALIKAN!
                    'qr_string' => $charge['qr_code'],
                    'is_static' => false
                ]
            ]);

        } catch (\Exception $e) {
            \App\Models\SystemLog::create([
                'level' => 'critical', 'service' => 'payment',
                'message' => "Gagal Generate QRIS: " . $e->getMessage()
            ]);
            return response()->json(['message' => 'Sistem sedang sibuk.'], 500);
        }
    }

    // 👇 FUNGSI BARU: KONFIRMASI PEMBAYARAN MANUAL OLEH ADMIN 👇
    public function confirmManualPayment(Request $request, $id, $userId)
    {
        $tenantId = $request->user()->tenant_id;

        $session = Session::whereHas('group', function ($q) use ($tenantId) {
            $q->where('tenant_id', $tenantId);
        })->findOrFail($id);

        $bill = Bill::where('session_id', $session->id)->first();
        if (!$bill) return response()->json(['message' => 'Data tagihan tidak ditemukan.'], 404);

        $billItem = BillItem::where('bill_id', $bill->id)->where('user_id', $userId)->firstOrFail();

        if ($billItem->status === 'paid') {
            return response()->json(['message' => 'Tagihan sudah berstatus lunas.'], 400);
        }

        DB::transaction(function () use ($billItem, $session, $userId) {
            // Lunas-kan Bill Item
            $billItem->update(['status' => 'paid', 'paid_at' => now()]);

            // Lunas-kan Transaksi (Jika ada)
            Transaction::where('bill_item_id', $billItem->id)
                ->where('status', 'pending')
                ->update(['status' => 'success', 'paid_at' => now()]);

            // Masukkan ke Daftar Peserta Confirmed
            SessionParticipant::updateOrCreate(
                ['session_id' => $session->id, 'user_id' => $userId],
                ['id' => (string) Str::uuid(), 'status' => 'confirmed']
            );
        });

        return response()->json(['success' => true, 'message' => 'Pembayaran berhasil dikonfirmasi secara manual!']);
    }

    public function update(Request $request, $id) {
        $tenantId = $request->user()->tenant_id;
        $session = Session::whereHas('group', function ($q) use ($tenantId) {
            $q->where('tenant_id', $tenantId);
        })->findOrFail($id);

        $session->update($request->all());
        return response()->json(['success' => true, 'message' => 'Jadwal sesi berhasil diperbarui!']);
    }

    public function exportAttendance($id)
    {
        $session = Session::with(['participants.user', 'group'])->findOrFail($id);
        $participants = $session->participants->where('status', 'confirmed');

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.attendance', compact('session', 'participants'));
        
        return $pdf->download("Laporan-{$session->name}.pdf");
    }

    // ==========================================
    // FITUR MANUAL REMINDER (COLEK MEMBER)
    // ==========================================
    public function remind(Request $request, $id)
    {
        $tenantId = $request->user()->tenant_id;

        $session = Session::with('group')->whereHas('group', function ($q) use ($tenantId) {
            $q->where('tenant_id', $tenantId);
        })->findOrFail($id);

        if ($session->is_public) {
            return response()->json(['message' => 'Sesi Publik tidak bisa di-remind ke grup.'], 400);
        }

        $members = \App\Models\GroupMember::with('user')->where('group_id', $session->group_id)->get();
        $wahaService = new \App\Services\WhatsApp\WahaService();

        $confirmedUserIds = \App\Models\SessionParticipant::where('session_id', $session->id)
            ->where('status', 'confirmed')
            ->pluck('user_id')
            ->toArray();

        $pesanTerkirim = 0;
        $appUrl = config('app.url');

        foreach ($members as $member) {
            if (!in_array($member->user->id, $confirmedUserIds) && $member->user->phone_wa) {
                
                $magicLink = "{$appUrl}/checkout/{$session->id}/{$member->user->id}";

                // 👇 BUG 3 FIXED: Copywriting Disesuaikan dengan Tipe Tagihan
                if ($session->type === 'arisan') {
                    $pesan = "🔔 *PENGINGAT ARISAN: {$session->name}*\n\n"
                           . "Halo *{$member->user->name}*,\n"
                           . "Sekadar mengingatkan, tagihan arisan ini belum dibayar lho. Yuk diselesaikan sebelum jatuh tempo!\n\n"
                           . "🔗 {$magicLink}";
                } elseif ($session->type === 'iuran') {
                    $pesan = "🔔 *PENGINGAT IURAN: {$session->name}*\n\n"
                           . "Halo *{$member->user->name}*,\n"
                           . "Tagihan uang kas komunitas belum lunas nih. Boleh tolong dicek dan dibayar ya!\n\n"
                           . "🔗 {$magicLink}";
                } else {
                    $pesan = "🔔 *PENGINGAT MABAR: {$session->name}*\n\n"
                           . "Halo *{$member->user->name}*,\n"
                           . "Slot mabar masih tersedia nih! Jangan sampai kehabisan ya.\n\n"
                           . "🔗 {$magicLink}";
                }

                $wahaService->send($member->user->phone_wa, $pesan);
                $pesanTerkirim++;
            }
        }

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