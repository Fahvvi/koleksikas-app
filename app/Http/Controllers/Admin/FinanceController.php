<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\PayoutRequest;
use App\Models\PayoutConfig;
use App\Models\GlobalSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class FinanceController extends Controller
{
    public function index(Request $request)
    {
        $tenantId = $request->user()->tenant_id;

        $paymentConfig = \App\Models\PaymentConfig::where('tenant_id', $tenantId)->first();
        $paymentType = $paymentConfig->provider ?? 'koleksikas';

        // 1. Ambil Platform Fee dari Global Settings
        $feeSetting = GlobalSetting::where('key', 'platform_fee')->first();
        $platformFee = $feeSetting ? (int) $feeSetting->value : 0;

        // 2. Kalkulasi ALL TIME REVENUE (Netto)
        $allSuccessTxQuery = Transaction::where('tenant_id', $tenantId)
            ->whereIn('status', ['paid', 'success', 'completed', 'settlement']);
        
        $totalGrossAllTime = (float) $allSuccessTxQuery->sum('amount');
        $totalCountAllTime = $allSuccessTxQuery->count();
        // Pendapatan bersih = (Total Uang) - (Jumlah Transaksi * Platform Fee)
        $totalNetRevenue = $totalGrossAllTime - ($totalCountAllTime * $platformFee);

        // 3. Kalkulasi FILTERED REVENUE (Netto)
        $revenueQuery = Transaction::with(['user:id,name', 'billItem.bill'])
            ->where('tenant_id', $tenantId)
            ->whereIn('status', ['paid', 'success', 'completed', 'settlement']);

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $revenueQuery->whereBetween('created_at', [$request->start_date . ' 00:00:00', $request->end_date . ' 23:59:59']);
        } elseif ($request->filled('month') && $request->filled('year')) {
            $revenueQuery->whereMonth('created_at', $request->month)
                         ->whereYear('created_at', $request->year);
        } else {
            $revenueQuery->whereMonth('created_at', date('m'))
                         ->whereYear('created_at', date('Y'));
        }

        $filteredGross = (float) $revenueQuery->sum('amount');
        $filteredCount = $revenueQuery->count();
        $filteredNetRevenue = $filteredGross - ($filteredCount * $platformFee);

        // 4. Kalkulasi Saldo Tersedia (Hanya dari Net Revenue)
        $payouts = PayoutRequest::withoutGlobalScopes()
            ->where('tenant_id', $tenantId)
            ->orderBy('created_at', 'desc')
            ->get();

        $totalPending = $payouts->whereIn('status', ['pending', 'processing'])->sum('amount');
        $totalWithdrawn = $payouts->where('status', 'completed')->sum('amount');
        
        $availableBalance = $totalNetRevenue - ($totalPending + $totalWithdrawn);

        $hasPayoutConfig = PayoutConfig::where('tenant_id', $tenantId)->exists();

        // 5. Mapping Data History dengan perhitungan Netto per transaksi
        $history = $revenueQuery->orderBy('created_at', 'desc')->get()->map(function($trx) use ($platformFee) {
            return [
                'id' => $trx->id,
                'created_at' => $trx->created_at,
                'user' => $trx->user,
                'bill_item' => $trx->billItem,
                'gateway_name' => $trx->gateway_transaction_id ? 'KoleksiKAS Gateway' : 'Gateway Mitra',
                'gross_amount' => $trx->amount,
                'platform_fee' => $platformFee,
                'net_amount' => max(0, $trx->amount - $platformFee) // 👈 Nilai Bersih yang diterima Mitra
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'payment_type' => $paymentType,
                'has_payout_config' => $hasPayoutConfig,
                'summary' => [
                    'total_revenue' => max(0, $totalNetRevenue),
                    'filtered_revenue' => max(0, $filteredNetRevenue),
                    'total_pending' => $totalPending,
                    'total_withdrawn' => $totalWithdrawn,
                    'available_balance' => max(0, $availableBalance)
                ],
                'revenue_history' => $history,
                'payout_history' => $payouts
            ]
        ]);
    }

    public function requestPayout(Request $request)
    {
        $tenantId = $request->user()->tenant_id;
        $requestedAmount = $request->amount;

        // Validasi dengan NET REVENUE
        $feeSetting = GlobalSetting::where('key', 'platform_fee')->first();
        $platformFee = $feeSetting ? (int) $feeSetting->value : 0;

        $allSuccessTxQuery = Transaction::where('tenant_id', $tenantId)
            ->whereIn('status', ['paid', 'success', 'completed', 'settlement']);
        
        $totalGrossAllTime = (float) $allSuccessTxQuery->sum('amount');
        $totalCountAllTime = $allSuccessTxQuery->count();
        $totalNetRevenue = $totalGrossAllTime - ($totalCountAllTime * $platformFee);

        $totalDeducted = PayoutRequest::withoutGlobalScopes()
            ->where('tenant_id', $tenantId)
            ->whereIn('status', ['pending', 'processing', 'completed'])
            ->sum('amount');
            
        $availableBalance = $totalNetRevenue - $totalDeducted;

        if ($requestedAmount > $availableBalance) {
            return response()->json(['message' => 'Saldo tidak mencukupi untuk penarikan ini.'], 400);
        }

        $payoutConfig = PayoutConfig::where('tenant_id', $tenantId)->first();
        if (!$payoutConfig || empty($payoutConfig->account_number)) {
            return response()->json(['message' => 'Silakan atur rekening pencairan terlebih dahulu.'], 400);
        }

        PayoutRequest::create([
            'id' => Str::uuid(),
            'tenant_id' => $tenantId,
            'amount' => $requestedAmount,
            'bank_name' => $payoutConfig->bank_name,
            'account_number' => $payoutConfig->account_number,
            'account_holder' => $payoutConfig->account_holder,
            'status' => 'pending'
        ]);

        return response()->json(['success' => true, 'message' => 'Permintaan penarikan dana berhasil diajukan!']);
    }
}