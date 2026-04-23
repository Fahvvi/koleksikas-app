<?php

namespace App\Services\License;

use App\Models\MitraLicense;
use App\Models\Tenant;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use Exception;

class LicenseService
{
    /**
     * Generate 32-karakter License Key unik
     */
    public function generateKey(): string
    {
        // Menghasilkan format: KKAS-A1B2-C3D4-E5F6-G7H8
        return 'KKAS-' . implode('-', str_split(strtoupper(Str::random(16)), 4));
    }

    /**
     * Proses Aktivasi Lisensi
     */
    public function activate(MitraLicense $license, string $plainKey): void
    {
        // Cocokkan key yang diinput user dengan key hash di database
        if (!Hash::check($plainKey, $license->license_key)) {
            throw new Exception('License key tidak valid atau salah.', 400);
        }

        if ($license->status === 'active') {
            throw new Exception('Lisensi ini sudah aktif.', 400);
        }

        $license->update([
            'status' => 'active', 
            'activated_at' => now(),
            // Set maintenance_expires_at 1 tahun dari sekarang jika tier butuh
            // 'maintenance_expires_at' => now()->addYear() 
        ]);
    }

    /**
     * Ambil kalkulasi kapasitas tenant saat ini
     */
    public function getCapacity(Tenant $tenant): array
    {
        // Pastikan relasi mitraLicense dan tier sudah di-load
        $license = $tenant->mitraLicense;
        $tier = $license->tier;
        $override = $license->capacity_overrides ?? [];

        return [
            'max_groups' => $tier->max_groups + ($override['extra_groups'] ?? 0),
            'max_members' => $tier->max_members_per_group + ($override['extra_members'] ?? 0),
            'max_sessions' => $tier->max_sessions_per_month,
            'used_groups' => $tenant->groups()->count(),
            // Nanti bisa ditambahkan hitungan session_this_month
        ];
    }
}