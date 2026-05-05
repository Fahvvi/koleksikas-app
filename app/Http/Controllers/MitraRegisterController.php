<?php

namespace App\Http\Controllers;

use App\Models\Mitra;
use App\Models\LicenseTier;
use App\Models\MitraLicense;
use App\Models\Tenant;
use App\Models\User;
use App\Models\PaymentConfig;
use App\Models\WhatsappConfig;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class MitraRegisterController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:mitras,email',
            'phone' => 'required|string|max:20',
            'company_name' => 'required|string|max:255',
        ]);

        $mitra = Mitra::create([
            'id' => Str::uuid(),
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'company_name' => $request->company_name,
            'status' => 'pending' 
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pendaftaran berhasil. Silakan pilih paket berlangganan.',
            'data' => ['mitra_id' => $mitra->id]
        ]);
    }

    public function activate(Request $request)
    {
        $request->validate([
            'mitra_id' => 'required|uuid',
            'license_tier_slug' => 'required|string',
            'password' => 'required|string|min:6'
        ]);

        return DB::transaction(function () use ($request) {
            $mitra = Mitra::where('id', $request->mitra_id)->whereIn('status', ['pending', 'pending_payment'])->firstOrFail();
            $tier = LicenseTier::where('slug', $request->license_tier_slug)->firstOrFail();

            // JIKA PAKET GRATIS (Price == 0) -> Langsung Aktifkan
            if ($tier->price == 0) {
                return $this->executeActivation($mitra, $tier, Hash::make($request->password));
            }

            // JIKA BERBAYAR -> AMBIL CONFIG DARI GLOBAL SETTINGS (BUKAN PAYMENT CONFIG)
            $globalProject = \App\Models\GlobalSetting::where('key', 'pakasir_project')->first();
            $globalApiKey = \App\Models\GlobalSetting::where('key', 'pakasir_api_key')->first();

            if (!$globalProject || !$globalApiKey || empty($globalProject->value)) {
                return response()->json(['message' => 'Gateway pembayaran utama belum disiapkan oleh Super Admin.'], 500);
            }

            $payloadConfig = json_encode([
                'project' => $globalProject->value,
                'api_key' => $globalApiKey->value
            ]);

            $paymentService = new \App\Services\Payment\PakasirService($payloadConfig);
            
            $transactionId = (string) Str::uuid();
            $charge = $paymentService->createCharge([
                'amount' => $tier->price,
                'user' => (object)['name' => $mitra->name, 'phone_wa' => $mitra->phone],
                'transaction_id' => $transactionId
            ]);

            $mitra->update(['status' => 'pending_payment']);

            // SIMPAN DATA SEMENTARA KE TRANSAKSI (AGAR BISA DIEKSEKUSI OLEH WEBHOOK NANTI)
            \App\Models\Transaction::create([
                'id' => $transactionId,
                'tenant_id' => null, // Karena belum punya tenant
                'amount' => $tier->price,
                'payment_url' => $charge['qr_code'],
                'status' => 'pending',
                'payload' => json_encode([
                    'type' => 'license_activation',
                    'mitra_id' => $mitra->id,
                    'tier_slug' => $tier->slug,
                    'password_hash' => Hash::make($request->password)
                ])
            ]);

            return response()->json([
                'success' => true,
                'needs_payment' => true,
                'data' => [
                    'qr_string' => $charge['qr_code'],
                    'amount' => $tier->price,
                    'mitra_name' => $mitra->name
                ]
            ]);
        });
    }

    // Helper untuk Eksekusi (Dipanggil jika Gratis atau Jika Webhook Berhasil)
    public function executeActivation($mitra, $tier, $hashedPassword) {
        $mitra->update(['status' => 'active']);

        $license = MitraLicense::create([
            'id' => Str::uuid(),
            'mitra_id' => $mitra->id,
            'license_tier_id' => $tier->id,
            'license_key' => 'KAS-' . strtoupper(Str::random(12)),
            'status' => 'active'
        ]);

        $tenantSlug = Str::slug($mitra->company_name . '-' . rand(1000, 9999));
        $tenant = Tenant::create([
            'id' => Str::uuid(),
            'mitra_id' => $mitra->id,
            'mitra_license_id' => $license->id,
            'name' => $mitra->company_name,
            'slug' => $tenantSlug,
            'status' => 'active'
        ]);

        $admin = User::create([
            'id' => Str::uuid(),
            'tenant_id' => $tenant->id,
            'name' => $mitra->name,
            'email' => $mitra->email,
            'password' => $hashedPassword,
            'phone_wa' => $mitra->phone,
            'role' => 'admin'
        ]);

        PaymentConfig::create([
            'id' => Str::uuid(), 'tenant_id' => $tenant->id, 'provider' => 'koleksikas', 'payload' => json_encode([]), 'is_active' => true
        ]);

        WhatsappConfig::create([
            'id' => Str::uuid(), 'tenant_id' => $tenant->id, 'provider' => 'koleksikas', 'api_token' => null, 'is_active' => true
        ]);

        return response()->json(['success' => true, 'message' => 'Aktivasi Berhasil!']);
    }
    public function checkStatus($id)
    {
        $mitra = Mitra::find($id);
        if (!$mitra) return response()->json(['status' => 'not_found'], 404);
        
        return response()->json(['status' => $mitra->status]);
    }


}