<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Mitra;
use App\Services\License\LicenseService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\SystemLog;
use Illuminate\Support\Facades\Auth;

class MitraController extends Controller
{
    // List semua mitra yang butuh approval
    public function getPending()
    {
        $mitras = Mitra::where('status', 'pending')->with('licenses.tier')->get();
        
        return response()->json([
            'success' => true,
            'data' => $mitras
        ]);
    }

    // Approve Mitra & Generate License Key
    public function approve(Request $request, $id)
    {
        $mitra = Mitra::findOrFail($id);

        if ($mitra->status === 'active') {
            return response()->json(['success' => false, 'message' => 'Mitra sudah aktif.'], 400);
        }

        // Cek apakah mitra sudah punya lisensi di database
        $mitraLicense = $mitra->licenses()->first();

        if (!$mitraLicense) {
            // ALUR BYPASS BARU: Mitra baru daftar tapi di-approve paksa oleh Super Admin
            // Kita otomatis berikan paket termurah dan password default
            $tier = \App\Models\LicenseTier::orderBy('price', 'asc')->first(); 
            
            if (!$tier) {
                return response()->json(['success' => false, 'message' => 'Gagal: Belum ada paket lisensi di database.'], 400);
            }

            // Gunakan fungsi executeActivation dari MitraRegisterController yang sudah kita buat!
            $registerController = new \App\Http\Controllers\MitraRegisterController();
            $registerController->executeActivation($mitra, $tier, \Illuminate\Support\Facades\Hash::make('koleksikas123'));

            return response()->json([
                'success' => true, 
                'message' => "Bypass Approve Berhasil! Akun Admin dibuat dengan password default: koleksikas123"
            ]);

        } else {
            // ALUR LAMA: Jika lisensi sudah ada (misal dari form Create Mitra Super Admin)
            $licenseService = app(\App\Services\License\LicenseService::class);
            $rawLicenseKey = $licenseService->generateKey();

            $mitra->update(['status' => 'active', 'approved_at' => now()]);
            $mitraLicense->update([
                'license_key' => \Illuminate\Support\Facades\Hash::make($rawLicenseKey),
                'status' => 'active',
                'activated_at' => now()
            ]);

            return response()->json(['success' => true, 'message' => 'Mitra berhasil disetujui.']);
        }
    }

    public function index()
    {
        // Kita ambil mitra berdasarkan data terbaru
        $mitras = \App\Models\Mitra::orderBy('created_at', 'desc')->get();
        
        $data = $mitras->map(function ($mitra) {
            // SINKRONISASI LISENSI
            $activeLicense = \App\Models\MitraLicense::where('mitra_id', $mitra->id)
                ->where('status', 'active')
                ->with('tier')
                ->latest()
                ->first();

            $tenant = \App\Models\Tenant::where('mitra_id', $mitra->id)->first();
            
            // 👇 FIX: AMBIL DATA AKUN ADMIN SEBENARNYA 👇
            $adminUser = $tenant ? \App\Models\User::where('tenant_id', $tenant->id)->where('role', 'admin')->first() : null;

            // Hitung total member tenant tersebut
            $totalMembers = $tenant ? \App\Models\User::where('tenant_id', $tenant->id)->where('role', '!=', 'super_admin')->count() : 0;

            return [
                'id' => $mitra->id,
                'company_name' => $mitra->company_name,
                // PRIORITASKAN DATA ADMIN (Jika admin belum dibuat, fallback ke data registrasi awal)
                'name' => $adminUser ? $adminUser->name : $mitra->name,
                'email' => $adminUser ? $adminUser->email : $mitra->email,
                'phone' => $adminUser ? $adminUser->phone_wa : $mitra->phone,
                'address' => $mitra->address,
                'status' => $mitra->status,
                'tier_name' => $activeLicense && $activeLicense->tier ? $activeLicense->tier->name : 'Tidak Ada',
                'total_members' => $totalMembers,
                'created_at' => $mitra->created_at->format('d M Y')
            ];
        });

        return response()->json(['success' => true, 'data' => $data]);
    }

    // Fungsi untuk memblokir/menonaktifkan mitra
    public function suspend($id)
    {
        $mitra = \App\Models\Mitra::findOrFail($id);
        $mitra->status = 'suspended'; // atau 'inactive', sesuaikan dengan enum di databasemu
        $mitra->save();

        // Opsional: Kamu juga bisa menonaktifkan Tenant milik mitra ini di sini

        return response()->json([
            'success' => true,
            'message' => 'Mitra berhasil dinonaktifkan'
        ]);
    }

    public function unblock($id)
    {
        $mitra = \App\Models\Mitra::findOrFail($id);
        $mitra->status = 'active';
        $mitra->save();

        return response()->json(['success' => true, 'message' => 'Mitra berhasil diaktifkan kembali']);
    }

    public function forceUpdateProfile(Request $request, $userId)
    {
        $user = User::findOrFail($userId);
        
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'phone_wa' => 'required|string|unique:users,phone_wa,' . $user->id,
            'password' => 'nullable|min:6',
        ]);

        $oldData = $user->only(['name', 'email', 'phone_wa']);
        
        // 1. Update Akun User (Admin)
        $user->name = $request->name;
        $user->email = $request->email;
        $user->phone_wa = $request->phone_wa;
        
        if ($request->filled('password')) {
            $user->password = Hash::make($request->password);
        }
        $user->save();

        // 2. SINKRONISASI KE TABEL MITRA (Agar Kontak di Tabel Dashboard Berubah)
        $tenant = \App\Models\Tenant::find($user->tenant_id);
        if ($tenant) {
            $mitra = \App\Models\Mitra::find($tenant->mitra_id);
            if ($mitra) {
                $mitra->name = $request->name; // Nama PIC
                $mitra->email = $request->email;
                $mitra->phone = $request->phone_wa;
                $mitra->save();
            }
        }

        SystemLog::create([
            'level' => 'warning',
            'service' => 'system',
            'message' => "Super Admin memaksa update profil User ID: {$user->id} & sinkronisasi data Mitra",
            'context' => [
                'admin_id' => Auth::id(), 
                'old_data' => $oldData,
                'new_data' => $request->except('password')
            ]
        ]);

        return response()->json(['success' => true, 'message' => 'Profil dan Kontak Mitra berhasil disinkronkan.']);
    }

    public function getManageData($mitraId)
    {
        $tenant = \App\Models\Tenant::where('mitra_id', $mitraId)->first();
        $users = $tenant ? \App\Models\User::where('tenant_id', $tenant->id)->where('role', 'admin')->get() : [];
        
        // PERBAIKAN: Gunakan 'status' => 'active', BUKAN 'is_active'
        $activeLicense = \App\Models\MitraLicense::where('mitra_id', $mitraId)
                            ->where('status', 'active') 
                            ->first();

        return response()->json([
            'success' => true,
            'users' => $users,
            'current_license_id' => $activeLicense ? $activeLicense->license_tier_id : null
        ]);
    }

    // 2. Ganti Paket Lisensi
    public function changeLicense(\Illuminate\Http\Request $request, $mitraId)
    {
        $request->validate(['license_tier_id' => 'required|exists:license_tiers,id']);
        
        \Illuminate\Support\Facades\DB::transaction(function () use ($request, $mitraId) {
            \App\Models\MitraLicense::where('mitra_id', $mitraId)
                ->where('status', 'active')
                ->update(['status' => 'expired']);

            $newLicense = \App\Models\MitraLicense::create([
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'mitra_id' => $mitraId,
                'license_tier_id' => $request->license_tier_id,
                'license_key' => 'KAS-' . strtoupper(\Illuminate\Support\Str::random(12)),
                'status' => 'active', 
                'valid_until' => now()->addYear(), 
            ]);

            // UPDATE MATA RANTAI DI TENANT
            \App\Models\Tenant::where('mitra_id', $mitraId)->update([
                'mitra_license_id' => $newLicense->id
            ]);
        });

        \App\Models\SystemLog::create([
            'level' => 'info',
            'service' => 'system',
            'message' => "Super Admin mengubah paket lisensi untuk Mitra ID: {$mitraId}",
        ]);

        return response()->json(['success' => true, 'message' => 'Paket lisensi berhasil diubah!']);
    }

    public function store(\Illuminate\Http\Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'company_name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email|unique:mitras,email',
            'phone' => 'required|string',
            'password' => 'required|min:6',
            'license_tier_id' => 'required|exists:license_tiers,id'
        ]);

        $phone = preg_replace('/[^0-9]/', '', $request->phone);
        if (str_starts_with($phone, '08')) {
            $phone = '628' . substr($phone, 2);
        }

        try {
            \Illuminate\Support\Facades\DB::beginTransaction();

            // 1. Buat Mitra
            $mitra = \App\Models\Mitra::create([
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'name' => $request->name,
                'company_name' => $request->company_name,
                'email' => $request->email,
                'phone' => $phone,
                'status' => 'active', 
            ]);

            // 2. Buat Lisensi DULU! (Ini yang terbalik sebelumnya)
            $license = \App\Models\MitraLicense::create([
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'mitra_id' => $mitra->id,
                'license_tier_id' => $request->license_tier_id,
                'license_key' => 'KAS-' . strtoupper(\Illuminate\Support\Str::random(12)),
                'status' => 'active',
                'valid_until' => now()->addMonth(),
            ]);

            // 3. Buat Tenant, dan SAMBUNGKAN MATA RANTAI LISENSINYA!
            $tenant = \App\Models\Tenant::create([
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'mitra_id' => $mitra->id,
                'mitra_license_id' => $license->id, // <--- KUNCI JAWABANNYA
                'name' => $request->company_name,
                'slug' => \Illuminate\Support\Str::slug($request->company_name . '-' . rand(100,999)),
            ]);

            // 4. Buat Akun Admin
            \App\Models\User::create([
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'tenant_id' => $tenant->id,
                'name' => $request->name,
                'email' => $request->email,
                'password' => \Illuminate\Support\Facades\Hash::make($request->password),
                'role' => 'admin',
            ]);

            \Illuminate\Support\Facades\DB::commit();

            return response()->json(['success' => true, 'message' => 'Mitra berhasil didaftarkan']);

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json(['message' => 'Gagal mendaftarkan mitra: ' . $e->getMessage()], 500);
        }
    }
}