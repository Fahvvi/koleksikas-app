<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\SystemLog;
use Illuminate\Http\Request;

class SystemHealthController extends Controller
{
    public function index(Request $request)
    {
        $query = SystemLog::query()->orderBy('created_at', 'desc');

        if ($request->has('level') && $request->level !== 'all') {
            $query->where('level', $request->level);
        }

        // Paginasi 20 data per halaman agar ringan
        $logs = $query->paginate(20);

        // Ambil statistik cepat untuk dashboard
        $stats = [
            'total_errors' => SystemLog::whereIn('level', ['error', 'critical'])->whereDate('created_at', today())->count(),
            'wa_status' => 'online', // Nanti bisa dikembangkan dengan nge-ping server WA
            'payment_webhook_status' => 'active'
        ];

        return response()->json([
            'success' => true,
            'data' => $logs->items(),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'total' => $logs->total()
            ],
            'stats' => $stats
        ]);
    }
}