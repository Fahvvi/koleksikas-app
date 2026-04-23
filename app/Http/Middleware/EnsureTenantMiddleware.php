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
        $slug = $request->header('X-Tenant');

        if (!$slug) {
            return response()->json([
                'success' => false,
                'message' => 'Header X-Tenant wajib disertakan.'
            ], 400);
        }

        // Cari tenant berdasarkan slug (misal: futsal-jakarta)
        $tenant = Tenant::where('slug', $slug)->first();

        if (!$tenant) {
            return response()->json([
                'success' => false,
                'message' => 'Tenant tidak ditemukan.'
            ], 404);
        }

        if ($tenant->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Tenant sedang di-suspend atau over capacity.'
            ], 403);
        }

        // Daftarkan tenant ke Service Container Laravel
        // Ini akan otomatis memicu TenantScope yang kita buat sebelumnya!
        app()->instance('tenant', $tenant);

        return $next($request);
    }
}