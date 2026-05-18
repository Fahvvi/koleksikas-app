<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\Tenant;
use App\Models\Mitra;
use Illuminate\Support\Facades\Auth; // 👈 Wajib ditambahkan

class EnsureTenantMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $tenant = null;
        $user = Auth::user();

        // 1. CYBER-SECURE MODE (Berdasarkan Token/Sesi Login)
        // Mustahil bagi Admin A untuk mengakses Tenant B dengan memalsukan header.
        if ($user && $user->tenant_id) {
            $tenant = Tenant::find($user->tenant_id);
        } 
        // 2. PUBLIC MODE (Berdasarkan Header X-Tenant)
        // Digunakan untuk halaman publik yang tidak perlu login (misal: pendaftaran jadwal member).
        else {
            $slug = $request->header('X-Tenant');
            if ($slug) {
                $tenant = Tenant::where('slug', $slug)->first();
            }
        }

        // --- VALIDASI KEAMANAN TENANT ---
        if (!$tenant) {
            return response()->json([
                'success' => false,
                'message' => 'Akses Ditolak: Kredensial Tenant tidak valid atau tidak ditemukan.'
            ], 403);
        }

        if ($tenant->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Akses Ditolak: Ruang Komunitas ini sedang ditangguhkan.'
            ], 403);
        }

        // --- 🚨 PATROLI KEAMANAN MITRA (REAL-TIME KICK OUT) 🚨 ---
        $mitra = Mitra::find($tenant->mitra_id);
        if ($mitra && $mitra->status === 'suspended') {
            
            // JIKA YANG MENGAKSES ADALAH ADMIN MITRA YANG SEDANG LOGIN -> TENDANG PAKSA!
            if ($user && $user->role === 'admin') {
                Auth::guard('web')->logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                return response()->json([
                    'account_suspended' => true, // 👈 Ini yang ditangkap oleh Axios Interceptor di React
                    'message' => 'Sesi Berakhir: Akun komunitas Anda telah diblokir oleh Super Admin.'
                ], 403);
            }

            // JIKA DIAKSES OLEH PUBLIK / MEMBER BUKAN ADMIN
            return response()->json([
                'success' => false,
                'message' => 'Akses Ditolak: Komunitas ini sedang ditangguhkan oleh sistem pusat.'
            ], 403);
        }

        // Ikat Tenant ke dalam Service Container Laravel
        // Ini yang membuat app('tenant') dan Trait BelongsToTenant bisa bekerja!
        app()->instance('tenant', $tenant);

        return $next($request);
    }
}