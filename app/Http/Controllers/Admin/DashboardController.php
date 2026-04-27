<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Group;
use App\Models\Session;
use App\Models\Transaction;
use App\Models\Tenant;
use App\Models\MitraLicense; // <-- TAMBAHKAN IMPORT INI
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $tenantId = $request->user()->tenant_id;
        $tenant = Tenant::find($tenantId);

        // --- MENCARI PAKET LISENSI AKTIF ---
        $activeLicense = MitraLicense::where('mitra_id', $tenant->mitra_id)
            ->where('status', 'active') // <--- UBAH 'is_active', true MENJADI INI
            ->with('tier') 
            ->latest()
            ->first();

        // Jika tidak ada lisensi, set default string
        $currentTier = $activeLicense && $activeLicense->tier ? $activeLicense->tier->name : 'Trial / Free';

        // 1. Total Grup
        $totalGroups = Group::where('tenant_id', $tenantId)->count();

        // 2. Sesi Aktif
        $activeSessions = Session::whereHas('group', function($q) use ($tenantId) {
            $q->where('tenant_id', $tenantId);
        })->where('status', 'active')->count();

        // 3. Pemasukan
        $revenue = Transaction::where('tenant_id', $tenantId)
            ->where('status', 'success')
            ->sum('amount');

        // 4. Sesi Terdekat
        $upcomingSessions = Session::with('group')
            ->whereHas('group', function($q) use ($tenantId) {
                $q->where('tenant_id', $tenantId);
            })
            ->where('scheduled_at', '>=', now())
            ->whereIn('status', ['active', 'draft'])
            ->orderBy('scheduled_at', 'asc')
            ->take(5)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'current_tier' => $currentTier, // <-- TAMBAHKAN INI KE RESPONSE
                'total_groups' => $totalGroups,
                'active_sessions' => $activeSessions,
                'revenue' => $revenue,
                'upcoming_sessions' => $upcomingSessions
            ]
        ]);
    }
}