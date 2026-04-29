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

    // 1. Cek Tipe Gateway Mitra
    $paymentConfig = \App\Models\PaymentConfig::where('tenant_id', $tenantId)->first();
    $paymentType = $paymentConfig->provider ?? 'koleksikas';

    // 2. Siapkan Query Pendapatan (Revenue)
    $revenueQuery = Transaction::with(['user:id,name', 'billItem.bill'])
        ->where('tenant_id', $tenantId)
        ->whereIn('status', ['paid', 'success', 'completed', 'settlement']);

    // --- FILTER LOGIC ---
    if ($request->filled('start_date') && $request->filled('end_date')) {
        // Filter berdasarkan rentang tanggal
        $revenueQuery->whereBetween('created_at', [$request->start_date . ' 00:00:00', $request->end_date . ' 23:59:59']);
    } elseif ($request->filled('month') && $request->filled('year')) {
        // Filter berdasarkan bulan dan tahun
        $revenueQuery->whereMonth('created_at', $request->month)
                     ->whereYear('created_at', $request->year);
    }

    $revenueHistory = $revenueQuery->orderBy('created_at', 'desc')->get()->map(function($trx) {
    // Logika penamaan Gateway
    $gatewayName = 'KoleksiKAS Gateway'; // Default
    
    if ($trx->payment_method === 'manual') {
        $gatewayName = 'QRIS Statis (Manual)';
    } elseif ($trx->provider === 'pakasir') {
        $gatewayName = 'Pakasir (Mandiri)';
    } elseif ($trx->provider === 'midtrans') {
        $gatewayName = 'Midtrans (Mandiri)';
    }

    return [
        'id' => $trx->id,
        'created_at' => $trx->created_at,
        'amount' => (float) $trx->amount,
        'status' => $trx->status,
        'gateway_name' => $gatewayName, // 👈 Tambahkan ini
        'user' => $trx->user ? ['name' => $trx->user->name] : null,
        'bill_item' => $trx->billItem && $trx->billItem->bill 
            ? ['bill' => ['name' => $trx->billItem->bill->name]] 
            : null,
    ];
});
    $filteredRevenueTotal = $revenueHistory->sum('amount');

    // 3. Hitung Ringkasan (Summary) - Tetap Total Keseluruhan
    $totalRevenueAllTime = Transaction::where('tenant_id', $tenantId)
        ->whereIn('status', ['paid', 'success', 'completed', 'settlement'])
        ->sum('amount');

    $totalPendingPayout = PayoutRequest::where('tenant_id', $tenantId)
        ->whereIn('status', ['pending', 'processing'])
        ->sum('amount');

    $totalCompletedPayout = PayoutRequest::where('tenant_id', $tenantId)
        ->where('status', 'completed')
        ->sum('amount');

    $availableBalance = $totalRevenueAllTime - ($totalPendingPayout + $totalCompletedPayout);

    $payoutHistory = PayoutRequest::where('tenant_id', $tenantId)
        ->orderBy('created_at', 'desc')
        ->limit(20)
        ->get();

    $payoutConfig = \App\Models\PayoutConfig::where('tenant_id', $tenantId)->first();

    return response()->json([
        'success' => true,
        'data' => [
            'payment_type' => $paymentType,
            'summary' => [
                'available_balance' => (float) $availableBalance,
                'total_revenue' => (float) $totalRevenueAllTime,
                'total_pending' => (float) $totalPendingPayout,
                'total_withdrawn' => (float) $totalCompletedPayout,
                'filtered_revenue' => (float) $filteredRevenueTotal, // Total sesuai filter
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
        $totalRevenue = Transaction::where('tenant_id', $tenantId)
            ->whereIn('status', ['paid', 'completed', 'settlement', 'settled', 'success']) // 👈 Tambahkan 'success' di sini
            ->sum('amount');
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