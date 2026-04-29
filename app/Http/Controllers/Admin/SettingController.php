<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PaymentConfig;
use App\Models\WhatsappConfig;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    // Mengambil data pengaturan saat ini
    public function index(Request $request)
    {
        $tenantId = $request->user()->tenant_id;

        $paymentConfig = PaymentConfig::where('tenant_id', $tenantId)->first();
        $waConfig = WhatsappConfig::where('tenant_id', $tenantId)->first();
        // 👇 AMBIL DATA REKENING DARI DATABASE
        $payoutConfig = \App\Models\PayoutConfig::where('tenant_id', $tenantId)->first();

        return response()->json([
            'success' => true,
            'data' => [
                // 👇 KIRIMKAN TIPE GATEWAY (Default ke koleksikas jika kosong)
                'type' => $paymentConfig->provider ?? 'koleksikas',
                'payment' => $paymentConfig ? json_decode($paymentConfig->payload) : null,
                'whatsapp' => $waConfig ? [
                    'is_active' => (bool) $waConfig->is_active,
                    'daily_summary' => (bool) ($waConfig->settings['daily_summary'] ?? true) 
                ] : null,
                // 👇 KIRIMKAN DATA REKENING
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
                \App\Models\PaymentConfig::updateOrCreate(
                    ['tenant_id' => $tenantId],
                    [
                        'provider' => $request->input('type'), // pakasir / static_qris
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
            // CATAT ERROR KE DATABASE!
            \App\Models\SystemLog::create([
                'level' => 'critical', 
                'service' => 'settings',
                'message' => "Gagal simpan pengaturan: " . $e->getMessage()
            ]);

            // LEMPAR PESAN ERROR KE REACT
            return response()->json([
                'message' => 'Error: ' . $e->getMessage()
            ], 500);
        }
    }
}