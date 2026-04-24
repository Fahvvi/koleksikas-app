<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Mitra;
use App\Models\User;
use App\Models\Transaction;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index()
    {
        // 1. Total Mitra Aktif
        $totalMitra = Mitra::where('status', 'active')->count();

        // 2. Total Member (Asumsi role-nya adalah 'member' atau menghitung semua user selain super_admin)
        $totalMember = User::where('role', '!=', 'super_admin')->count();

        // 3. Revenue Sukses (Bisa total GMV atau total platform fee, kita pakai total transaksi sukses dulu)
        $totalRevenue = Transaction::where('status', 'success')->sum('amount');

        // 4. Pending Approval Mitra
        $pendingApproval = Mitra::where('status', 'pending')->count();

        return response()->json([
            'success' => true,
            'data' => [
                'total_mitra' => $totalMitra,
                'total_member' => $totalMember,
                'revenue' => $totalRevenue,
                'pending_approval' => $pendingApproval
            ]
        ]);
    }
}