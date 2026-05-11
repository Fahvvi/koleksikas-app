<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\BillItem;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class MemberController extends Controller
{
    // 1. Ambil Riwayat Tagihan Member
    public function history(Request $request)
    {
        $userId = $request->user()->id;

        $histories = BillItem::with(['bill.session.group'])
            ->where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'amount' => $item->amount,
                    'status' => $item->status,
                    'paid_at' => $item->paid_at,
                    'session_id' => $item->bill->session->id ?? null,
                    'session_name' => $item->bill->name ?? 'Tagihan Sistem',
                    'session_type' => $item->bill->session->type ?? 'Lainnya',
                    'group_name' => $item->bill->session->group->name ?? 'Komunitas',
                    'due_date' => $item->bill->due_date,
                    'created_at' => $item->created_at,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $histories
        ]);
    }

    // 2. Update Profil Member
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'name' => 'required|string|max:255',
            'phone_wa' => ['required', 'string', Rule::unique('users')->ignore($user->id)],
            'password' => 'nullable|string|min:6'
        ]);

        // Format Nomor WA
        $phone = preg_replace('/[^0-9]/', '', $request->phone_wa);
        if (substr($phone, 0, 1) === '0') $phone = '62' . substr($phone, 1);

        $user->name = $request->name;
        $user->phone_wa = $phone;

        if ($request->filled('password')) {
            $user->password = Hash::make($request->password);
        }

        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Profil berhasil diperbarui!',
            'data' => $user
        ]);
    }
}