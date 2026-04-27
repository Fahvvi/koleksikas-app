<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Group;
use App\Services\License\LicenseGuard;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class GroupController extends Controller
{
    // 1. Ambil semua grup (Telah difilter oleh BelongsToTenant)
    public function index()
    {
        // Tambahkan withCount('members') agar UI React bisa membaca members_count
        $groups = Group::with('admin:id,name,email')
            ->withCount('members') 
            ->latest()
            ->get();

        // Format ulang data agar sesuai ekspektasi frontend
        $data = $groups->map(function($group) {
            return [
                'id' => $group->id,
                'name' => $group->name,
                'sport_type' => $group->sport_type,
                'description' => $group->description,
                'members_count' => $group->members_count,
                'status' => 'Aktif', // Default karena tidak ada kolom status di migration grup
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }

    // 2. Membuat grup baru
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'sport_type' => 'nullable|string|max:100',
            'description' => 'nullable|string'
        ]);

        $tenant = app('tenant'); // Diambil dari EnsureTenantMiddleware

        // CEK KAPASITAS LISENSI
        try {
            LicenseGuard::check($tenant, 'groups');
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 403);
        }

        $group = Group::create([
            'id' => Str::uuid(),
            'name' => $request->name,
            'sport_type' => $request->sport_type,
            'description' => $request->description,
            'admin_user_id' => $request->user()->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Grup komunitas berhasil dibuat!',
            'data' => $group
        ], 201);
    }

    // 3. Detail Grup
    public function show($id)
    {
        // findOrFail otomatis ter-scope ke Tenant berkat Global Scope
        $group = Group::with('admin:id,name,email')
            ->withCount('members')
            ->findOrFail($id);

        return response()->json(['success' => true, 'data' => $group]);
    }

    // 4. Update Grup
    public function update(Request $request, $id)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'sport_type' => 'nullable|string|max:100',
            'description' => 'nullable|string'
        ]);

        $group = Group::findOrFail($id);
        
        $group->update([
            'name' => $request->name,
            'sport_type' => $request->sport_type,
            'description' => $request->description,
        ]);

        return response()->json(['success' => true, 'message' => 'Grup berhasil diperbarui!']);
    }

    // 5. Hapus Grup
    public function destroy($id)
    {
        $group = Group::findOrFail($id);
        $group->delete();

        return response()->json(['success' => true, 'message' => 'Grup berhasil dihapus!']);
    }

    // 6. Tambah Member ke Grup
    public function addMember(Request $request, $id)
    {
        $tenant = app('tenant');
        $group = Group::where('tenant_id', $tenant->id)->findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'phone_wa' => 'required|string|max:20',
        ]);

        // Format nomor WA
        $phone = preg_replace('/[^0-9]/', '', $request->phone_wa);
        if (str_starts_with($phone, '08')) { $phone = '628' . substr($phone, 2); }

        // Cari atau buat User berdasarkan WA di Tenant ini
        $user = \App\Models\User::firstOrCreate(
            ['phone_wa' => $phone, 'tenant_id' => $tenant->id],
            ['id' => Str::uuid(), 'name' => $request->name, 'role' => 'user']
        );

        // Cek apakah sudah gabung di grup ini
        $isMember = \App\Models\GroupMember::where('group_id', $group->id)->where('user_id', $user->id)->exists();
        if ($isMember) {
            return response()->json(['message' => 'Member dengan nomor WA ini sudah ada di grup.'], 400);
        }

        // Tambahkan ke GroupMember
        \App\Models\GroupMember::create([
            'id' => Str::uuid(),
            'group_id' => $group->id,
            'user_id' => $user->id,
            'role' => 'member',
            'status' => 'active'
        ]);

        return response()->json(['success' => true, 'message' => 'Member berhasil ditambahkan ke grup!']);
    }

    // 7. Ambil Daftar Member
    public function getMembers($id)
    {
        $tenant = app('tenant');
        $group = Group::where('tenant_id', $tenant->id)->findOrFail($id);

        $members = \App\Models\GroupMember::with('user:id,name,phone_wa,email')
            ->where('group_id', $group->id)
            ->latest('joined_at')
            ->get();

        return response()->json(['success' => true, 'data' => $members]);
    }

    // 8. Update Data Member (Nama & Nomor WA)
    public function updateMember(Request $request, $groupId, $userId)
    {
        $tenant = app('tenant');
        $group = Group::where('tenant_id', $tenant->id)->findOrFail($groupId);

        $request->validate([
            'name' => 'required|string|max:255',
            'phone_wa' => 'required|string|max:20',
        ]);

        $phone = preg_replace('/[^0-9]/', '', $request->phone_wa);
        if (str_starts_with($phone, '08')) { $phone = '628' . substr($phone, 2); }

        // Pastikan member ini ada di grup
        $member = \App\Models\GroupMember::where('group_id', $group->id)->where('user_id', $userId)->firstOrFail();
        $user = \App\Models\User::where('tenant_id', $tenant->id)->findOrFail($userId);

        // Cek duplikasi nomor WA pada tenant ini (kecuali milik user ini sendiri)
        $existingUser = \App\Models\User::where('tenant_id', $tenant->id)
            ->where('phone_wa', $phone)
            ->where('id', '!=', $user->id)
            ->first();

        if ($existingUser) {
            return response()->json(['message' => 'Nomor WA ini sudah terdaftar pada user lain.'], 400);
        }

        // Update data
        $user->name = $request->name;
        $user->phone_wa = $phone;
        $user->save();

        return response()->json(['success' => true, 'message' => 'Data member berhasil diupdate!']);
    }

    // 9. Keluarkan Member dari Grup
    public function removeMember($groupId, $userId)
    {
        $tenant = app('tenant');
        $group = Group::where('tenant_id', $tenant->id)->findOrFail($groupId);

        $member = \App\Models\GroupMember::where('group_id', $group->id)->where('user_id', $userId)->firstOrFail();
        
        // Mencegah admin (pembuat grup) dihapus dari grupnya sendiri
        if ($group->admin_user_id === $userId) {
            return response()->json(['message' => 'Tidak dapat menghapus Admin Utama dari grup.'], 400);
        }

        $member->delete();

        return response()->json(['success' => true, 'message' => 'Member berhasil dihapus dari grup.']);
    }
    
}