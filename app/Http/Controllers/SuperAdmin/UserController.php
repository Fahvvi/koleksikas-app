<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\GroupMember;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index()
    {
        // 1. Ambil semua user biasa (bukan superadmin/mitra)
        $users = User::where('role', 'user')->latest()->get();

        // 2. Ambil semua relasi grup agar tahu user ini ikut komunitas apa saja
        $groupMembers = GroupMember::with('group')
            ->whereIn('user_id', $users->pluck('id'))
            ->get()
            ->groupBy('user_id');

        // 3. Mapping data
        $data = $users->map(function($user) use ($groupMembers) {
            $userGroups = $groupMembers->get($user->id);
            $groupNames = $userGroups ? $userGroups->pluck('group.name')->filter()->values() : collect();

            return [
                'id' => $user->id,
                'name' => $user->name,
                'phone_wa' => $user->phone_wa,
                'created_at' => $user->created_at,
                'groups' => $groupNames,
                'is_active' => $groupNames->count() > 0 // Status: Aktif jika punya grup
            ];
        });

        // 4. Kalkulasi Statistik
        $stats = [
            'total_users' => $data->count(),
            'active_users' => $data->where('is_active', true)->count(),
            'idle_users' => $data->where('is_active', false)->count(),
        ];

        return response()->json([
            'success' => true,
            'stats' => $stats,
            'data' => $data->values()
        ]);
    }
}