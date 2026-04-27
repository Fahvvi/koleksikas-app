<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\OtpCode;
use App\Models\SystemLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class ProfileController extends Controller
{
    // 1. Ambil Data Profil Saat Ini
    public function show(Request $request)
    {
        return response()->json(['success' => true, 'data' => $request->user()]);
    }

    // 2. Update Data Non-Sensitif (Nama)
    public function updateBasic(Request $request)
    {
        $request->validate(['name' => 'required|string|max:255']);
        
        $user = $request->user();
        $user->name = $request->name;
        $user->save();

        return response()->json(['success' => true, 'message' => 'Nama berhasil diperbarui.']);
    }

    // 3. Minta Kode OTP (Untuk Data Sensitif)
    public function requestOtp(Request $request)
    {
        $request->validate(['type' => 'required|string']); // 'change_email', 'change_phone', 'change_password'
        $user = $request->user();

        // Bersihkan OTP lama yang belum terpakai agar tabel tidak penuh
        OtpCode::where('user_id', $user->id)->where('type', $request->type)->where('is_used', false)->delete();

        // Generate 6 digit angka acak
        $code = (string) rand(100000, 999999);

        // Simpan ke database
        OtpCode::create([
            'id' => (string) Str::uuid(),
            'user_id' => $user->id,
            'identifier' => $user->phone_wa ?? $user->email,
            'code' => $code,
            'type' => $request->type,
            'expires_at' => now()->addMinutes(5) // Berlaku 5 menit
        ]);

        // TODO: Nanti kita masukkan script kirim WhatsApp (Waha) di sini
        // \App\Jobs\WA\SendOtpJob::dispatch($user->phone_wa, $code);

        SystemLog::create([
            'level' => 'info',
            'service' => 'system',
            'message' => "User ID {$user->id} meminta OTP untuk {$request->type}",
        ]);

        // Untuk mode development, kita kirim balik kode OTP-nya di response agar gampang di-test
        $debugCode = env('APP_ENV') === 'local' ? $code : null;

        return response()->json([
            'success' => true, 
            'message' => 'OTP berhasil dikirim!',
            'debug_code' => $debugCode 
        ]);
    }

    // 4. Verifikasi OTP dan Simpan Data Baru
    public function verifyOtp(Request $request)
    {
        $request->validate([
            'type' => 'required|string',
            'code' => 'required|string|size:6',
            'new_data' => 'required' // Isinya bisa email baru, WA baru, atau password baru
        ]);

        $user = $request->user();

        // Cari OTP yang cocok, belum dipakai, dan belum expired
        $otp = OtpCode::where('user_id', $user->id)
            ->where('type', $request->type)
            ->where('code', $request->code)
            ->where('is_used', false)
            ->where('expires_at', '>', now())
            ->first();

        if (!$otp) {
            return response()->json(['message' => 'Kode OTP salah atau sudah kadaluarsa.'], 400);
        }

        // Eksekusi perubahan berdasarkan tipe
        if ($request->type === 'change_email') {
            $user->email = $request->new_data;
        } elseif ($request->type === 'change_phone') {
            // Bersihkan nomor WA sebelum disimpan
            $phone = preg_replace('/[^0-9]/', '', $request->new_data);
            if (str_starts_with($phone, '08')) { $phone = '628' . substr($phone, 2); }
            $user->phone_wa = $phone;
        } elseif ($request->type === 'change_password') {
            $user->password = Hash::make($request->new_data);
        }

        $user->save();

        // Tandai OTP sudah terpakai (Mencegah Replay Attack)
        $otp->is_used = true;
        $otp->save();

        SystemLog::create([
            'level' => 'info',
            'service' => 'system',
            'message' => "User ID {$user->id} berhasil mengubah {$request->type} via OTP.",
        ]);

        return response()->json(['success' => true, 'message' => 'Data berhasil diubah secara aman!']);
    }
}