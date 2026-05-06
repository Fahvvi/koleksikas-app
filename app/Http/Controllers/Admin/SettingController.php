<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PaymentConfig;
use App\Models\WhatsappConfig;
use App\Models\Tenant;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    // Mengambil data pengaturan saat ini
    public function index(Request $request)
    {
        $tenantId = $request->user()->tenant_id;

        // 👇 1. AMBIL DATA LISENSI TENANT 👇
        $tenant = Tenant::with('mitraLicense.tier')->find($tenantId);
        $tierFeatures = $tenant->mitraLicense->tier->features ?? [];
        if (is_string($tierFeatures)) {
            $tierFeatures = json_decode($tierFeatures, true);
        }
        
        // Ambil allowed_gateways dari JSON, defaultnya hanya 'koleksikas'
        $allowedGateways = $tierFeatures['allowed_gateways'] ?? ['koleksikas'];

        $paymentConfig = PaymentConfig::where('tenant_id', $tenantId)->first();
        $waConfig = WhatsappConfig::where('tenant_id', $tenantId)->first();
        $payoutConfig = \App\Models\PayoutConfig::where('tenant_id', $tenantId)->first();
        
        return response()->json([
            'success' => true,
            'data' => [
                'type' => $paymentConfig->provider ?? 'koleksikas',
                'payment' => $paymentConfig ? json_decode($paymentConfig->payload) : null,
                'whatsapp' => $waConfig ? [
                    'is_active' => (bool) $waConfig->is_active,
                    'daily_summary' => (bool) ($waConfig->settings['daily_summary'] ?? true) 
                ] : null,
                'allowed_gateways' => $allowedGateways, // 👈 KIRIM KE FRONTEND
                'payout' => $payoutConfig ? [
                    'bank_name' => $payoutConfig->bank_name ?? '',
                    'account_number' => $payoutConfig->account_number ?? '',
                    'account_holder' => $payoutConfig->account_holder ?? '',
                ] : null
            ]
        ]);
    }

    // Menyimpan pembaruan pengaturan
    public function update(Request $request)
    {
        try {
            $tenantId = $request->user()->tenant_id;

            // 1. Simpan Pengaturan Payment Gateway
            if ($request->has('type')) {
                $provider = $request->input('type');

                // 👇 VALIDASI KEAMANAN BACKEND 👇
                $tenant = Tenant::with('mitraLicense.tier')->find($tenantId);
                $tierFeatures = $tenant->mitraLicense->tier->features ?? [];
                if (is_string($tierFeatures)) {
                    $tierFeatures = json_decode($tierFeatures, true);
                }
                $allowedGateways = $tierFeatures['allowed_gateways'] ?? ['koleksikas'];

                // Tolak jika Mitra mencoba menyimpan gateway yang tidak diizinkan
                if (!in_array($provider, $allowedGateways)) {
                    return response()->json([
                        'message' => 'Paket lisensi Anda tidak mendukung Gateway ini. Silakan upgrade paket Anda.'
                    ], 403);
                }

                \App\Models\PaymentConfig::updateOrCreate(
                    ['tenant_id' => $tenantId],
                    [
                        'provider' => $provider,
                        'payload' => json_encode($request->input('payment'))
                    ]
                );
            }

            // 2. Simpan Pengaturan WhatsApp
            if ($request->has('whatsapp')) {
                $waData = $request->input('whatsapp');
                
                $waConfig = \App\Models\WhatsappConfig::firstOrNew(['tenant_id' => $tenantId, 'provider' => 'waha']);
                $currentSettings = is_string($waConfig->settings) ? json_decode($waConfig->settings, true) : ($waConfig->settings ?? []);
                
                $currentSettings['daily_summary'] = $waData['daily_summary'] ?? true;

                $waConfig->is_active = $waData['is_active'] ?? true;
                $waConfig->settings = $currentSettings; 
                $waConfig->save();
            }

            // 3. Simpan Pengaturan Payout (Rekening)
            if ($request->has('payout')) {
                $payoutData = $request->input('payout');
                \App\Models\PayoutConfig::updateOrCreate(
                    ['tenant_id' => $tenantId],
                    [
                        'bank_name' => $payoutData['bank_name'] ?? '',
                        'account_number' => $payoutData['account_number'] ?? '',
                        'account_holder' => $payoutData['account_holder'] ?? '',
                    ]
                );
            }

            return response()->json([
                'success' => true,
                'message' => 'Pengaturan berhasil disimpan!'
            ]);

        } catch (\Exception $e) {
            \App\Models\SystemLog::create([
                'level' => 'critical', 
                'service' => 'settings',
                'message' => "Gagal simpan pengaturan: " . $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Error: ' . $e->getMessage()
            ], 500);
        }
    }
}