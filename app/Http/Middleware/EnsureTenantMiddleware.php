<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\Tenant;

class EnsureTenantMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $tenant = null;

        // 1. CYBER-SECURE MODE (Berdasarkan Token/Sesi Login)
        // Mustahil bagi Admin A untuk mengakses Tenant B dengan memalsukan header.
        if (auth()->check() && auth()->user()->tenant_id) {
            $tenant = Tenant::find(auth()->user()->tenant_id);
        } 
        // 2. PUBLIC MODE (Berdasarkan Header X-Tenant)
        // Digunakan untuk halaman publik yang tidak perlu login (misal: pendaftaran jadwal member).
        else {
            $slug = $request->header('X-Tenant');
            if ($slug) {
                $tenant = Tenant::where('slug', $slug)->first();
            }
        }

        // --- VALIDASI KEAMANAN ---
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

        // Ikat Tenant ke dalam Service Container Laravel
        // Ini yang membuat app('tenant') dan Trait BelongsToTenant bisa bekerja!
        app()->instance('tenant', $tenant);

        return $next($request);
    }
}