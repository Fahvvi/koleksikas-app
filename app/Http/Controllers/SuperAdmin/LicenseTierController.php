<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Models\LicenseTier;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Http\Controllers\Controller;

class LicenseTierController extends Controller
{
    public function index()
    {
        $tiers = LicenseTier::all();
        return response()->json([
            'success' => true,
            'data' => $tiers
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'slug' => 'required|unique:license_tiers,slug',
            'price' => 'required|numeric',
            'max_groups' => 'required|integer',
            'max_members_per_group' => 'required|integer',
            'max_sessions_per_month' => 'required|integer',
        ]);

        $tier = LicenseTier::create([
            'id' => Str::uuid(),
            'name' => $request->name,
            'slug' => $request->slug,
            'price' => $request->price,
            'max_groups' => $request->max_groups,
            'max_members_per_group' => $request->max_members_per_group,
            'max_sessions_per_month' => $request->max_sessions_per_month,
            'features' => is_array($request->features) ? json_encode($request->features) : $request->features,
            'is_active' => true
        ]);

        return response()->json(['success' => true, 'data' => $tier], 201);
    }

    public function update(Request $request, $id)
    {
        $tier = LicenseTier::findOrFail($id);
        
        $data = $request->all();
        // 👇 Pastikan features dienkode menjadi JSON sebelum disimpan ke database
        if (isset($data['features']) && is_array($data['features'])) {
            $data['features'] = json_encode($data['features']);
        }

        $tier->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Paket berhasil diperbarui',
            'data' => $tier
        ]);
    }

    public function toggleStatus($id)
    {
        $tier = LicenseTier::findOrFail($id);
        $tier->is_active = !$tier->is_active;
        $tier->save();

        return response()->json([
            'success' => true,
            'message' => 'Status paket diperbarui'
        ]);
    }

    public function destroy($id)
    {
        $tier = LicenseTier::findOrFail($id);
        $tier->delete();

        return response()->json([
            'success' => true,
            'message' => 'Paket berhasil dihapus'
        ]);
    }
}