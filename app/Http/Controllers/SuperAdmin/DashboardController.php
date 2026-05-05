<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Mitra;
use App\Models\User;
use App\Models\Transaction;
use App\Models\GlobalSetting;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        // 1. Data Operasional
        $total_mitra = Mitra::where('status', 'active')->count();
        $total_member = User::where('role', 'user')->count();
        $pending_approval = Mitra::whereIn('status', ['pending', 'pending_payment'])->count();

        // 2. Total GMV (Perputaran Uang Seluruh Ekosistem / Member -> Mitra)
        $gmv = Transaction::whereNotNull('tenant_id')
            ->where('status', 'success')
            ->sum('amount');

        // 3. Pendapatan Lisensi (Aktivasi / Langganan Paket)
        $license_revenue = Transaction::whereNull('tenant_id')
            ->where('status', 'success')
            ->where('payload', 'LIKE', '%"type":"license_activation"%')
            ->sum('amount');

        // 4. Kalkulasi Platform Fee dari Transaksi Member
        $platformFeeSetting = GlobalSetting::where('key', 'platform_fee')->first();
        $feePerTransaction = $platformFeeSetting ? (int) $platformFeeSetting->value : 0; // Misal Rp 1000

        $successfulMemberTxCount = Transaction::whereNotNull('tenant_id')
            ->where('status', 'success')
            ->count();
            
        $total_platform_fee = $successfulMemberTxCount * $feePerTransaction;

        // Total Pendapatan Bersih Super Admin
        $total_platform_revenue = $license_revenue + $total_platform_fee;

        return response()->json([
            'success' => true,
            'data' => [
                'total_mitra' => $total_mitra,
                'total_member' => $total_member,
                'gmv' => (float) $gmv,
                'platform_revenue' => (float) $total_platform_revenue,
                'revenue_breakdown' => [
                    'license' => (float) $license_revenue,
                    'fees' => (float) $total_platform_fee
                ],
                'pending_approval' => $pending_approval
            ]
        ]);
    }
}