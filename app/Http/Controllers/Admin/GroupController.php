<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Group;
use App\Services\License\LicenseGuard;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class GroupController extends Controller
{
    // Mengambil semua grup (Otomatis terfilter oleh TenantScope!)
    public function index()
    {
        $groups = Group::with('admin:id,name,email')->latest()->get();

        return response()->json([
            'success' => true,
            'data' => $groups
        ]);
    }

    // Membuat grup baru
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'sport_type' => 'nullable|string|max:100',
            'description' => 'nullable|string'
        ]);

        $tenant = app('tenant'); // Diambil dari EnsureTenantMiddleware

        // CEK KAPASITAS LISENSI
        // Guard ini akan throw Exception jika kuota grup Mitra sudah habis
        try {
            LicenseGuard::check($tenant, 'groups');
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 403);
        }

        // Jika aman, buat grupnya
        $group = Group::create([
            'id' => Str::uuid(),
            'name' => $request->name,
            'sport_type' => $request->sport_type,
            'description' => $request->description,
            'admin_user_id' => $request->user()->id,
            // Perhatikan: Kita tidak perlu memasukkan 'tenant_id' di sini, 
            // karena trait BelongsToTenant akan otomatis mengisinya di background!
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Grup komunitas berhasil dibuat!',
            'data' => $group
        ], 201);
    }
}