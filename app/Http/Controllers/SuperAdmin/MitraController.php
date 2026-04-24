<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Mitra;
use App\Services\License\LicenseService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

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

        $licenseService = app(LicenseService::class);
        $rawLicenseKey = $licenseService->generateKey(); // Misal: KKAS-A1B2...

        // Update status Mitra
        $mitra->update(['status' => 'active', 'approved_at' => now()]);

        // Update Lisensinya dengan Key yang di-hash (keamanan)
        $mitraLicense = $mitra->licenses()->first();
        $mitraLicense->update([
            'license_key' => Hash::make($rawLicenseKey),
            // Statusnya biarkan pending_activation atau aktifkan langsung (sesuai dokumen: aktif setelah mitra input key)
        ]);

        // Dalam sistem aslinya, rawLicenseKey ini dikirim via Email ke Mitra
        // Di sini kita return di response agar kamu bisa copy-paste untuk proses aktivasi nanti
        return response()->json([
            'success' => true,
            'data' => [
                'mitra_id' => $mitra->id,
                'license_key' => $rawLicenseKey, // CATAT KEY INI SAAT TESTING!
                'tier' => $mitraLicense->tier->name,
                'message' => 'Mitra berhasil di-approve. License key berhasil di-generate.'
            ]
        ]);
    }

    public function index()
    {
        // Ambil semua mitra. (Nanti bisa di-join dengan tabel tenant/group untuk menghitung total_members)
        $mitras = \App\Models\Mitra::orderBy('created_at', 'desc')->get();
        return response()->json([
            'success' => true,
            'data' => $mitras
        ]);
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
}