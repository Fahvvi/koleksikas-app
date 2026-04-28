<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Session;
use App\Models\BillItem;
use Illuminate\Http\Request;

class BillController extends Controller
{
    public function index(Request $request)
    {
        $tenantId = $request->user()->tenant_id;

        // Ambil sesi mabar milik mitra ini
        $sessions = Session::whereHas('group', function ($q) use ($tenantId) {
                $q->where('tenant_id', $tenantId);
            })
            ->with(['group.members'])
            ->orderBy('scheduled_at', 'desc')
            ->get()
            ->map(function ($session) {
                // Ambil semua tagihan untuk sesi ini
                $billItems = BillItem::with('user:id,name,phone_wa')
                    ->whereHas('bill', function ($q) use ($session) {
                        $q->where('session_id', $session->id);
                    })->get();

                $totalGroupMembers = $session->group->members->count();
                $paidCount = $billItems->where('status', 'paid')->count();
                
                return [
                    'id' => $session->id,
                    'name' => $session->name,
                    'date' => $session->scheduled_at->format('d M Y, H:i'),
                    'paid_count' => $paidCount,
                    'total_members' => $totalGroupMembers,
                    'percentage' => $totalGroupMembers > 0 ? round(($paidCount / $totalGroupMembers) * 100, 1) : 0,
                    'total_collected' => $billItems->where('status', 'paid')->sum('amount'),
                    'details' => $billItems->map(fn($item) => [
                        'user_name' => $item->user->name ?? 'User Terhapus',
                        'phone' => $item->user->phone_wa,
                        'status' => $item->status,
                        'amount' => $item->amount,
                        'paid_at' => $item->paid_at ? $item->paid_at->format('d M, H:i') : '-'
                    ])
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $sessions
        ]);
    }
}