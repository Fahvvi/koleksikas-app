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

        return response()->json([
            'success' => true,
            'data' => [
                'payment' => $paymentConfig ? json_decode($paymentConfig->payload) : null,
                'whatsapp' => $waConfig ? [
                    'is_active' => (bool) $waConfig->is_active,
                    'daily_summary' => (bool) ($waConfig->settings['daily_summary'] ?? true) // default true
                ] : null
            ]
        ]);
    }

    // Menyimpan pembaruan pengaturan
    public function update(Request $request)
    {
        $tenantId = $request->user()->tenant_id;

        // 1. Simpan Pengaturan Payment Gateway (Pakasir)
        if ($request->has('payment')) {
            $paymentData = $request->input('payment');
            PaymentConfig::updateOrCreate(
                ['tenant_id' => $tenantId, 'provider' => 'pakasir'],
                ['payload' => json_encode([
                    'project' => $paymentData['project'] ?? '',
                    'api_key' => $paymentData['api_key'] ?? ''
                ])]
            );
        }

        // 2. Simpan Pengaturan WhatsApp
        if ($request->has('whatsapp')) {
            $waData = $request->input('whatsapp');
            
            // Ambil config lama jika ada
            $waConfig = WhatsappConfig::firstOrNew(['tenant_id' => $tenantId, 'provider' => 'waha']);
            $currentSettings = is_string($waConfig->settings) ? json_decode($waConfig->settings, true) : ($waConfig->settings ?? []);
            
            // Update settings json
            $currentSettings['daily_summary'] = $waData['daily_summary'] ?? true;

            $waConfig->is_active = $waData['is_active'] ?? true;
            $waConfig->settings = $currentSettings; // Laravel akan otomatis cast ke JSON (pastikan modelnya punya cast array/json)
            $waConfig->save();
        }

        if ($request->has('type')) {
            PaymentConfig::updateOrCreate(
                ['tenant_id' => $tenantId],
                [
                    'provider' => $request->input('type'), // Simpan tipe (pakasir/static_qris)
                    'payload' => json_encode($request->input('payment'))
                ]
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Pengaturan berhasil disimpan!'
        ]);
    }
}