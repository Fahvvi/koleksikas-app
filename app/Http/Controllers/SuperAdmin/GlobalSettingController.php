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
        // Data yang dikirim dari React bentuknya array/object
        $settings = $request->except('_token');

        foreach ($settings as $key => $value) {
            GlobalSetting::updateOrCreate(
                ['key' => $key], // Cari berdasarkan key
                ['value' => $value] // Update nilainya
            );
        }

        // [LOG INFO]: Catat bahwa Super Admin merubah setting!
        \App\Models\SystemLog::create([
            'level' => 'info',
            'service' => 'system',
            'message' => 'Super Admin mengubah Pengaturan Global.',
            'context' => ['updated_keys' => array_keys($settings)]
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pengaturan berhasil diperbarui'
        ]);
    }
}