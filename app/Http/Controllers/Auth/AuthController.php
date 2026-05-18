<?php

namespace App\Http\Controllers\Auth;

use App\Models\User;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter; // Memastikan import RateLimiter ada
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $loginField = $request->has('email') ? 'email' : 'phone_wa';
        $loginValue = $request->input($loginField);
        $requestedRole = $request->input('role'); 

        if (!$loginValue) {
            return response()->json(['message' => 'Email atau Nomor WA wajib diisi!'], 400);
        }
        
        $request->validate(['password' => 'required']);

        if ($loginField === 'phone_wa') {
            $phoneRaw = preg_replace('/[^0-9]/', '', $loginValue);
            $phone62 = (substr($phoneRaw, 0, 1) === '0') ? '62' . substr($phoneRaw, 1) : $phoneRaw;
            $loginValue = $phone62; // Menyamakan nilai pencarian
        }

        $userQuery = User::where($loginField, $loginValue);
        
        if ($requestedRole) {
            $userQuery->where('role', $requestedRole);
        }
        
        $user = $userQuery->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Kredensial tidak valid. Pastikan Email/Nomor WA dan Password benar.'
            ], 401);
        }

        if ($requestedRole && $user->role !== $requestedRole) {
            return response()->json([
                'message' => "Akses Ditolak! Akun Anda terdaftar sebagai '{$user->role}', bukan '{$requestedRole}'."
            ], 403);
        }

        if ($user->role === 'admin' && $user->tenant_id) {
            $tenant = \App\Models\Tenant::find($user->tenant_id);
            if ($tenant) {
                $mitra = \App\Models\Mitra::find($tenant->mitra_id);
                if ($mitra && $mitra->status === 'suspended') {
                    return response()->json([
                        'account_suspended' => true,
                        'message' => 'Akses Ditolak! Komunitas Anda sedang ditangguhkan/diblokir oleh Super Admin.'
                    ], 403);
                }
            }
        }

        Auth::guard('web')->login($user);
        $request->session()->regenerate();

        return response()->json([
            'success' => true,
            'user' => $user
        ]);
    }

    public function requestOtp(Request $request)
    {
        $request->validate([
            'phone_wa' => 'required|string',
            'type' => 'required|in:register,forgot'
        ]);
        
        $phoneRaw = preg_replace('/[^0-9]/', '', $request->phone_wa);
        $phone62 = (substr($phoneRaw, 0, 1) === '0') ? '62' . substr($phoneRaw, 1) : $phoneRaw;

        // Logika Single Identity (Hanya akan ada maksimal 1 user dengan nomor WA ini)
        $user = User::where('phone_wa', $phone62)->first();
        
        if ($request->type === 'forgot') {
            if (!$user) {
                return response()->json(['message' => 'Nomor WhatsApp belum terdaftar di sistem.'], 404);
            }
        } else {
            if ($user) {
                return response()->json(['message' => 'Nomor WhatsApp sudah terdaftar! Silakan langsung Login atau gunakan Lupa Password.'], 400);
            }
        }

        $otp = (string) mt_rand(10000000, 99999999);
        Cache::put('otp_' . $phone62, $otp, now()->addMinutes(5));

        try {
            $waha = new \App\Services\WhatsApp\WahaService();
            $jenis = $request->type === 'register' ? 'PENDAFTARAN AKUN' : 'PEMULIHAN PASSWORD';
            $pesan = "🔒 *KODE OTP KOLEKSIKAS*\n\n"
                   . "Halo,\n"
                   . "Ini adalah kode rahasia untuk {$jenis} Anda:\n\n"
                   . "👉 *{$otp}*\n\n"
                   . "_Kode ini berlaku selama 5 menit. Jangan berikan kode ini kepada siapapun!_";
            $waha->send($phone62, $pesan);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Gagal mengirim OTP via WhatsApp. Pastikan bot aktif.'], 500);
        }

        return response()->json(['success' => true, 'message' => 'OTP berhasil dikirim ke WhatsApp Anda.']);
    }

    public function verifyOtp(Request $request)
    {
        $request->validate([
            'phone_wa' => 'required|string',
            'otp' => 'required|string',
            'password' => 'required|string|min:6',
            'type' => 'required|in:register,forgot',
            'name' => 'required_if:type,register|string'
        ]);

        $phoneRaw = preg_replace('/[^0-9]/', '', $request->phone_wa);
        $phone62 = (substr($phoneRaw, 0, 1) === '0') ? '62' . substr($phoneRaw, 1) : $phoneRaw;

        $limiterKey = 'otp_attempts_' . $phone62;

        if (RateLimiter::tooManyAttempts($limiterKey, 5)) {
            $seconds = RateLimiter::availableIn($limiterKey);
            $minutes = ceil($seconds / 60);
            return response()->json([
                'message' => "Akses diblokir sementara karena terlalu banyak percobaan gagal. Coba lagi dalam {$minutes} menit."
            ], 429);
        }

        $cachedOtp = Cache::get('otp_' . $phone62);
        
        if (!$cachedOtp || $cachedOtp != $request->otp) {
            RateLimiter::hit($limiterKey, 900);
            $attemptsLeft = 5 - RateLimiter::attempts($limiterKey);
            return response()->json([
                'message' => "Kode OTP salah atau sudah kedaluwarsa. Sisa percobaan: {$attemptsLeft}x"
            ], 400);
        }

        RateLimiter::clear($limiterKey);

        if ($request->type === 'register') {
            $userId = (string) Str::uuid();
            $uniqueSuffix = substr($userId, 0, 6);
            
            DB::table('users')->insert([
                'id' => $userId,
                'name' => $request->name,
                'email' => "{$phone62}_{$uniqueSuffix}@member.koleksikas", 
                'phone_wa' => $phone62,
                'password' => Hash::make($request->password),
                'role' => 'user',
                'created_at' => now(),
                'updated_at' => now()
            ]);
            $user = User::find($userId);
        } else {
            // LUPA PASSWORD: Fokus pada 1 akun utama
            $user = User::where('phone_wa', $phone62)->first();
            if (!$user) return response()->json(['message' => 'User tidak ditemukan.'], 404);
            
            $user->update([
                'password' => Hash::make($request->password)
            ]);
        }
        
        Cache::forget('otp_' . $phone62);
        
        Auth::guard('web')->login($user);
        $request->session()->regenerate();

        return response()->json([
            'success' => true,
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
        Auth::guard('web')->logout();
        
        // Hancurkan session cookie secara total
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'success' => true,
            'message' => 'Berhasil logout'
        ]);
    }
}