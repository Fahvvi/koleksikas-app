<?php

namespace App\Http\Controllers;

use App\Models\LicenseTier;
use App\Models\Mitra;
use App\Models\MitraLicense;
use App\Models\Tenant;
use App\Models\User;
use App\Services\License\LicenseService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class MitraRegisterController extends Controller
{
    /**
     * Langkah 1: Calon Mitra Mendaftar
     */
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:mitras,email',
            'phone' => 'required|string|max:20',
            'company_name' => 'required|string|max:255',
            'license_tier_slug' => 'required|exists:license_tiers,slug',
        ]);

        $tier = LicenseTier::where('slug', $request->license_tier_slug)->firstOrFail();

        $result = DB::transaction(function () use ($request, $tier) {
            $mitra = Mitra::create([
                'id' => Str::uuid(),
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'company_name' => $request->company_name,
                'status' => 'pending',
            ]);

            $license = MitraLicense::create([
                'id' => Str::uuid(),
                'mitra_id' => $mitra->id,
                'license_tier_id' => $tier->id,
                'license_key' => 'PENDING-' . Str::random(10),
                'status' => 'pending_approval', 
            ]);

            return $mitra;
        });

        return response()->json([
            'success' => true,
            'message' => 'Pendaftaran berhasil. Menunggu approval Super Admin.',
            'data' => $result
        ], 201);
    }

    /**
     * Langkah 2: Mitra Mengaktifkan Tenant (Setelah dapat License Key)
     */
    public function activate(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:mitras,email',
            'license_key' => 'required|string',
            'tenant_name' => 'required|string|max:255',
            'tenant_slug' => 'required|string|max:255|unique:tenants,slug',
            'admin_password' => 'required|string|min:6', 
        ]);

        $mitra = Mitra::where('email', $request->email)->firstOrFail();
        $license = $mitra->licenses()->latest()->first();

        if (!$license) {
            return response()->json(['success' => false, 'message' => 'Lisensi tidak ditemukan.'], 404);
        }

        try {
            $result = DB::transaction(function () use ($request, $mitra, $license) {
                
                $licenseService = app(LicenseService::class);
                $licenseService->activate($license, $request->license_key);

                $tenant = Tenant::create([
                    'id' => Str::uuid(),
                    'mitra_id' => $mitra->id,
                    'mitra_license_id' => $license->id,
                    'name' => $request->tenant_name,
                    'slug' => Str::slug($request->tenant_slug),
                    'status' => 'active',
                ]);

                $admin = User::create([
                    'id' => Str::uuid(),
                    'tenant_id' => $tenant->id,
                    'name' => $mitra->name,
                    'email' => $mitra->email, 
                    'password' => Hash::make($request->admin_password),
                    'role' => 'admin',
                    'phone_wa' => $mitra->phone,
                ]);

                return ['tenant' => $tenant, 'admin' => $admin];
            });

            return response()->json([
                'success' => true,
                'message' => 'Lisensi dan Ruang Komunitas berhasil diaktifkan!',
                'data' => [
                    'tenant_name' => $result['tenant']->name,
                    'tenant_slug' => $result['tenant']->slug,
                    'login_email' => $result['admin']->email
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }
}