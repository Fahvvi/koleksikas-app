<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\OtpCode;
use App\Models\SystemLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Services\WhatsApp\WahaService;
// use Illuminate\Support\Facades\Mail; // Siap diaktifkan nanti

class ProfileController extends Controller
{
    public function show(Request $request)
    {
        return response()->json(['success' => true, 'data' => $request->user()]);
    }

    public function updateBasic(Request $request)
    {
        $request->validate(['name' => 'required|string|max:255']);
        
        $user = $request->user();
        $user->name = $request->name;
        $user->save();

        return response()->json(['success' => true, 'message' => 'Nama berhasil diperbarui.']);
    }

    public function requestOtp(Request $request)
    {
        $request->validate([
            'type' => 'required|string|in:change_email,change_phone,change_password',
            'channel' => 'nullable|string|in:email,wa' // Opsional untuk change_password
        ]); 
        
        $user = $request->user();

        // --- LOGIKA SILANG (CROSS-CHANNEL) ---
        $sendMethod = 'wa'; // Default
        $targetIdentifier = null;

        if ($request->type === 'change_phone') {
            // Ganti WA -> Kirim ke Email
            $targetIdentifier = $user->email;
            $sendMethod = 'email';
        } elseif ($request->type === 'change_email') {
            // Ganti Email -> Kirim ke WA
            $targetIdentifier = $user->phone_wa;
            $sendMethod = 'wa';
        } elseif ($request->type === 'change_password') {
            // Ganti Password -> Sesuai Pilihan User (Default WA jika kosong)
            $sendMethod = $request->channel === 'email' ? 'email' : 'wa';
            $targetIdentifier = $sendMethod === 'email' ? $user->email : $user->phone_wa;
        }

        // Validasi: Tolak jika email/WA tujuan ternyata kosong di database
        if (empty($targetIdentifier)) {
            return response()->json([
                'message' => 'Kontak tujuan (' . strtoupper($sendMethod) . ') tidak tersedia. Silakan hubungi Super Admin.'
            ], 400);
        }

        OtpCode::where('user_id', $user->id)->where('type', $request->type)->where('is_used', false)->delete();
        $code = (string) rand(100000, 999999);

        OtpCode::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'user_id' => $user->id,
            'identifier' => $targetIdentifier,
            'code' => $code, // 👈 Sesuai kolom fillable!
            'type' => $request->type,
            'expires_at' => now()->addMinutes(10)
        ]);

        try {
            if ($sendMethod === 'email') {
                // 👇 EMAIL OTP (Buka komen ini jika SMTP sudah jalan) 👇
                /*
                \Illuminate\Support\Facades\Mail::raw("Kode OTP Anda: {$code}", function ($message) use ($targetIdentifier) {
                    $message->to($targetIdentifier)->subject('Kode Verifikasi Profil KoleksiKAS');
                });
                */
            } else {
                // 👇 WHATSAPP OTP 👇
                $waha = new \App\Services\WhatsApp\WahaService();
                $pesan = "🔒 *VERIFIKASI KEAMANAN*\n\n"
                       . "Seseorang sedang mencoba mengubah profil Anda. Masukkan 6 digit kode OTP ini:\n\n"
                       . "👉 *{$code}*\n\n"
                       . "_Berlaku 10 menit. Abaikan jika ini bukan Anda._";
                $waha->send($targetIdentifier, $pesan);
            }
        } catch (\Exception $e) {
            \App\Models\SystemLog::create(['level' => 'error', 'service' => 'system', 'message' => "Gagal kirim OTP profil: " . $e->getMessage()]);
        }

        $debugCode = app()->environment('local') ? $code : null;

        return response()->json([
            'success' => true, 
            'message' => 'OTP berhasil dikirim ke ' . strtoupper($sendMethod) . ' Anda!',
            'debug_code' => $debugCode 
        ]);
    }

    public function verifyOtp(Request $request)
    {
        $request->validate([
            'type' => 'required|string',
            'code' => 'required|string|size:6',
            'new_data' => 'required' 
        ]);

        $user = $request->user();

        // Cari OTP berdasarkan "code" dan "type"
        $otp = OtpCode::where('user_id', $user->id)
            ->where('type', $request->type)
            ->where('code', $request->code)
            ->where('is_used', false)
            ->where('expires_at', '>', now())
            ->first();

        if (!$otp) {
            return response()->json(['message' => 'Kode OTP salah atau sudah kadaluarsa.'], 400);
        }

        if ($request->type === 'change_email') {
            $user->email = $request->new_data;
        } elseif ($request->type === 'change_phone') {
            $phone = preg_replace('/[^0-9]/', '', $request->new_data);
            if (str_starts_with($phone, '08')) { $phone = '628' . substr($phone, 2); }
            $user->phone_wa = $phone;
        } elseif ($request->type === 'change_password') {
            $user->password = Hash::make($request->new_data);
        }

        $user->save();

        $otp->is_used = true;
        $otp->save();

        SystemLog::create([
            'level' => 'info', 'service' => 'system',
            'message' => "User ID {$user->id} berhasil mengubah {$request->type} via OTP.",
        ]);

        return response()->json(['success' => true, 'message' => 'Data berhasil diubah secara aman!']);
    }
}