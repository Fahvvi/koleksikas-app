<?php

namespace App\Http\Controllers\Auth;

use App\Models\User;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $loginField = $request->has('email') ? 'email' : 'phone_wa';
        $loginValue = $request->input($loginField);
        
        // Parameter role dikirim dari Frontend (React) untuk membedakan pintu masuk
        $requestedRole = $request->input('role'); 

        if (!$loginValue) {
            return response()->json(['message' => 'Email atau Nomor WA wajib diisi!'], 400);
        }
        
        $request->validate(['password' => 'required']);

        // Format ulang nomor WA jika login menggunakan phone_wa
        if ($loginField === 'phone_wa') {
            $loginValue = preg_replace('/[^0-9]/', '', $loginValue);
            if (substr($loginValue, 0, 1) === '0') {
                $loginValue = '62' . substr($loginValue, 1);
            }
        }

        $user = User::where($loginField, $loginValue)->first();

        // 1. Verifikasi Eksistensi User & Password
        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Kredensial tidak valid. Pastikan Email/Nomor WA dan Password benar.'
            ], 401);
        }

        // 2. PROTEKSI TUMPANG TINDIH ROLE (Role Guard)
        // Jika frontend meminta role tertentu, pastikan user memiliki role tersebut
        if ($requestedRole && $user->role !== $requestedRole) {
            return response()->json([
                'message' => "Akses Ditolak! Akun Anda terdaftar sebagai '{$user->role}', bukan '{$requestedRole}'."
            ], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'user' => $user
        ]);
    }

    // =======================================================
    // REQUEST OTP (Khusus User/Member)
    // =======================================================
    // =======================================================
    // REQUEST OTP (Bisa untuk Register atau Forgot Password)
    // =======================================================
    public function requestOtp(\Illuminate\Http\Request $request)
    {
        $request->validate([
            'phone_wa' => 'required|string',
            'type' => 'required|in:register,forgot' // Tipe OTP
        ]);
        
        $phone = preg_replace('/[^0-9]/', '', $request->phone_wa);
        if (substr($phone, 0, 1) === '0') $phone = '62' . substr($phone, 1);

        $user = \App\Models\User::where('phone_wa', $phone)->first();
        
        // Logika Pintar: Cek Bentrok Jalur
        if ($request->type === 'forgot') {
            if (!$user || $user->role !== 'user') {
                return response()->json(['message' => 'Nomor WhatsApp belum terdaftar. Silakan pilih menu Daftar Akun.'], 404);
            }
        } else { // Jalur Register
            if ($user) {
                return response()->json(['message' => 'Nomor WhatsApp sudah terdaftar! Silakan langsung Login atau gunakan Lupa Password.'], 400);
            }
        }

        // Generate 8 Digit OTP
        $otp = (string) mt_rand(10000000, 99999999);
        \Illuminate\Support\Facades\Cache::put('otp_' . $phone, $otp, now()->addMinutes(5));

        try {
            $waha = new \App\Services\WhatsApp\WahaService();
            $jenis = $request->type === 'register' ? 'PENDAFTARAN AKUN' : 'PEMULIHAN PASSWORD';
            $pesan = "🔒 *KODE OTP KOLEKSIKAS*\n\n"
                   . "Halo,\n"
                   . "Ini adalah kode rahasia untuk {$jenis} Anda:\n\n"
                   . "👉 *{$otp}*\n\n"
                   . "_Kode ini berlaku selama 5 menit. Jangan berikan kode ini kepada siapapun!_";
            $waha->send($phone, $pesan);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Gagal mengirim OTP via WhatsApp. Pastikan bot aktif.'], 500);
        }

        return response()->json(['success' => true, 'message' => 'OTP berhasil dikirim ke WhatsApp Anda.']);
    }

    // =======================================================
    // VERIFIKASI OTP (Mengeksekusi Register atau Reset Password)
    // =======================================================
    public function verifyOtp(\Illuminate\Http\Request $request)
    {
        $request->validate([
            'phone_wa' => 'required|string',
            'otp' => 'required|string',
            'password' => 'required|string|min:6',
            'type' => 'required|in:register,forgot',
            'name' => 'required_if:type,register|string' // Nama hanya wajib jika register
        ]);

        $phone = preg_replace('/[^0-9]/', '', $request->phone_wa);
        if (substr($phone, 0, 1) === '0') $phone = '62' . substr($phone, 1);

        // Cek Cache OTP
        $cachedOtp = \Illuminate\Support\Facades\Cache::get('otp_' . $phone);
        if (!$cachedOtp || $cachedOtp != $request->otp) {
            return response()->json(['message' => 'Kode OTP tidak valid atau sudah kedaluwarsa.'], 400);
        }

        // EKSEKUSI BERDASARKAN TIPE
        if ($request->type === 'register') {
            $userId = (string) \Illuminate\Support\Str::uuid();
            // Bypass Double Hash & Email Null Error menggunakan Raw Query
            \Illuminate\Support\Facades\DB::table('users')->insert([
                'id' => $userId,
                'name' => $request->name,
                'email' => $phone . '@member.koleksikas', // Dummy email agar aman dari unique constraint
                'phone_wa' => $phone,
                'password' => \Illuminate\Support\Facades\Hash::make($request->password),
                'role' => 'user',
                'created_at' => now(),
                'updated_at' => now()
            ]);
            $user = \App\Models\User::find($userId);
        } else {
            $user = \App\Models\User::where('phone_wa', $phone)->first();
            if (!$user) return response()->json(['message' => 'User tidak ditemukan.'], 404);
            
            \Illuminate\Support\Facades\DB::table('users')->where('id', $user->id)->update([
                'password' => \Illuminate\Support\Facades\Hash::make($request->password)
            ]);
            $user = \App\Models\User::find($user->id);
        }
        
        \Illuminate\Support\Facades\Cache::forget('otp_' . $phone);
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'user' => $user,
            'message' => $request->type === 'register' ? 'Pendaftaran berhasil!' : 'Password berhasil diubah!'
        ]);
    }

    public function me(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => $request->user()
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Berhasil logout'
        ]);
    }
}