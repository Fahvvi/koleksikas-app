<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\GlobalSetting;
use Illuminate\Http\Request;

class GlobalSettingController extends Controller
{
    // Mengambil semua setting dalam bentuk objek sederhana { key: value }
    public function index()
    {
        $settings = GlobalSetting::all()->pluck('value', 'key');
        return response()->json([
            'success' => true,
            'data' => $settings
        ]);
    }

    // Menyimpan banyak setting sekaligus
    public function update(Request $request)
    {
        // Daftarkan 'pakasir_project' dan 'pakasir_api_key' agar tidak diblokir oleh sistem
        $settings = $request->only([
            'app_name', 
            'platform_fee', 
            'maintenance_mode', 
            'pakasir_endpoint', 
            'pakasir_project',  // <-- Wajib Ada
            'pakasir_api_key',  // <-- Wajib Ada
            'waha_endpoint', 
            'waha_default_session'
        ]);

        foreach ($settings as $key => $value) {
            \App\Models\GlobalSetting::updateOrCreate(
                ['key' => $key],
                ['value' => $value]
            );
        }

        return response()->json(['message' => 'Konfigurasi Global berhasil diperbarui']);
    }
}