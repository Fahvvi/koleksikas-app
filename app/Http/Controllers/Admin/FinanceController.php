<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\PayoutRequest;
use App\Models\PayoutConfig;
use Illuminate\Http\Request;

class FinanceController extends Controller
{
    // 1. GET DATA DASHBOARD KEUANGAN
    public function index(Request $request)
    {
        $tenantId = $request->user()->tenant_id;

        // A. Hitung Total Pendapatan Kotor dari Gateway KoleksiKAS (Asumsi transaksi yang masuk ke platform)
        // Nanti sesuaikan query ini jika kamu punya penanda khusus (misal kolom 'is_platform_held')
        $totalRevenue = Transaction::where('tenant_id', $tenantId)
            ->where('status', 'paid') // Hanya yang sukses bayar
            ->sum('amount'); 

        // B. Hitung Total yang Sedang Diproses & Sudah Dicairkan
        $totalPendingPayout = PayoutRequest::where('tenant_id', $tenantId)->whereIn('status', ['pending', 'processing'])->sum('amount');
        $totalCompletedPayout = PayoutRequest::where('tenant_id', $tenantId)->where('status', 'completed')->sum('amount');

        // C. Saldo Tersedia (Pendapatan - (Pending + Completed))
        $availableBalance = $totalRevenue - ($totalPendingPayout + $totalCompletedPayout);

        // D. Ambil Riwayat Pencairan (History Payout)
        $payoutHistory = PayoutRequest::where('tenant_id', $tenantId)
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        // E. Ambil Riwayat Transaksi Masuk (History Pendapatan)
        $revenueHistory = Transaction::with(['user:id,name', 'billItem.bill'])
            ->where('tenant_id', $tenantId)
            ->where('status', 'paid')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        // F. Cek apakah pengaturan rekening sudah diisi
        $payoutConfig = PayoutConfig::where('tenant_id', $tenantId)->first();

        return response()->json([
            'success' => true,
            'data' => [
                'summary' => [
                    'available_balance' => $availableBalance,
                    'total_revenue' => $totalRevenue,
                    'total_pending' => $totalPendingPayout,
                    'total_withdrawn' => $totalCompletedPayout,
                ],
                'has_payout_config' => !empty($payoutConfig->account_number),
                'payout_history' => $payoutHistory,
                'revenue_history' => $revenueHistory
            ]
        ]);
    }

    // 2. REQUEST PENCAIRAN DANA
    public function requestPayout(Request $request)
    {
        $tenantId = $request->user()->tenant_id;
        
        $request->validate([
            'amount' => 'required|numeric|min:10000' // Minimal tarik 10.000
        ]);

        $requestedAmount = $request->amount;

        // Hitung ulang saldo untuk keamanan ganda (Double Validation)
        $totalRevenue = Transaction::where('tenant_id', $tenantId)->where('status', 'paid')->sum('amount'); 
        $totalDeducted = PayoutRequest::where('tenant_id', $tenantId)->whereIn('status', ['pending', 'processing', 'completed'])->sum('amount');
        $availableBalance = $totalRevenue - $totalDeducted;

        if ($requestedAmount > $availableBalance) {
            return response()->json(['message' => 'Saldo tidak mencukupi untuk penarikan ini.'], 400);
        }

        // Cek Rekening
        $payoutConfig = PayoutConfig::where('tenant_id', $tenantId)->first();
        if (!$payoutConfig || empty($payoutConfig->account_number)) {
            return response()->json(['message' => 'Silakan atur rekening pencairan terlebih dahulu di menu Pengaturan.'], 400);
        }

        // Buat Request Pencairan
        PayoutRequest::create([
            'tenant_id' => $tenantId,
            'amount' => $requestedAmount,
            'bank_name' => $payoutConfig->bank_name,
            'account_number' => $payoutConfig->account_number,
            'account_holder' => $payoutConfig->account_holder,
            'status' => 'pending'
        ]);

        // Opsional: Kirim Notifikasi ke Superadmin di sini

        return response()->json([
            'success' => true,
            'message' => 'Permintaan pencairan berhasil dikirim. Dana akan diproses dalam 1x24 jam kerja.'
        ]);
    }
}