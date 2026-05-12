<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\MitraRegisterController;
use App\Http\Controllers\SuperAdmin\MitraController as SuperAdminMitraController;
use App\Http\Controllers\SuperAdmin\LicenseTierController;
use App\Http\Controllers\SuperAdmin\SystemHealthController;
use App\Http\Controllers\SuperAdmin\GlobalSettingController;
use App\Http\Controllers\SuperAdmin\DashboardController;
use App\Http\Controllers\SuperAdmin\UserController as SuperAdminUserController; // 👈 Tambahan Controller
use App\Http\Controllers\Auth\ProfileController;
use App\Http\Controllers\Admin\SessionController;
use App\Http\Middleware\EnsureTenantMiddleware;
use App\Http\Controllers\Admin\SettingController;
use App\Http\Controllers\Admin\FinanceController;
use App\Http\Controllers\Admin\BillController;
use App\Http\Controllers\Admin\GroupController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Public\SessionRegistrationController;
use App\Http\Controllers\Webhook\WahaWebhookController;
use App\Http\Controllers\Webhook\PaymentWebhookController;

Route::prefix('v1')->group(function () {
    
    // ==========================================
    // PUBLIC ROUTES
    // ==========================================
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/request-otp', [AuthController::class, 'requestOtp']);
    Route::post('/auth/verify-otp', [AuthController::class, 'verifyOtp']);
    Route::post('/auth/set-password', [AuthController::class, 'setPassword']);
    
    // 👇 FIX #2: Keamanan Link Pembayaran (Magic Link Checkout) 👇
    // Kita gunakan middleware 'signed' bawaan Laravel. Link ini HANYA akan bisa dibuka
    // jika memiliki URL signature (HMAC) yang valid dan tidak diubah-ubah karakternya.
    Route::get('/sessions/{session}/join/{user}', [SessionController::class, 'joinAndPay'])
        ->middleware('signed')
        ->name('checkout.magiclink');

    Route::get('/sessions/{sessionId}/qris', [SessionRegistrationController::class, 'getQris']);
    Route::post('/public/transactions/{id}/mark-paid', [SessionRegistrationController::class, 'markAsPaid']);
    Route::get('/public/sessions', [SessionRegistrationController::class, 'getPublicSessions']); 

    // Alur Mitra Baru
    Route::post('/mitra/register', [MitraRegisterController::class, 'register']);
    Route::post('/mitra/activate', [MitraRegisterController::class, 'activate']);
    Route::get('/public/license-tiers', [LicenseTierController::class, 'index']);
    Route::get('/public/mitra/{id}/status', [MitraRegisterController::class, 'checkStatus']);
    
    // OPEN PLAY ROUTES
    Route::post('/sessions/{sessionId}/register', [SessionRegistrationController::class, 'register']);

    // WEBHOOKS ROUTES (Nanti akan kita amankan dengan Signature Verification)
    Route::post('/webhook/waha-receive', [WahaWebhookController::class, 'handle']);
    Route::post('/webhook/{provider}', [PaymentWebhookController::class, 'handle']);


    // ==========================================
    // PROTECTED ROUTES (Harus Login)
    // ==========================================
    Route::middleware('auth:sanctum')->group(function () {
        
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);

        // Rute Profil Umum
        Route::get('/user/profile', [ProfileController::class, 'show']);
        Route::put('/user/profile/basic', [ProfileController::class, 'updateBasic']);
        Route::post('/user/otp/request', [ProfileController::class, 'requestOtp']);
        Route::post('/user/otp/verify', [ProfileController::class, 'verifyOtp']);
        
        // Notifikasi
        Route::get('/notifications', function (\Illuminate\Http\Request $request) {
            return response()->json([
                'unread_count' => $request->user()->unreadNotifications->count(),
                'notifications' => $request->user()->notifications()->limit(10)->get()
            ]);
        });
        Route::post('/notifications/mark-read', function (\Illuminate\Http\Request $request) {
            $request->user()->unreadNotifications->markAsRead();
            return response()->json(['success' => true]);
        });
        
        
        // ------------------------------------------
        // SUPER ADMIN ROUTES
        // ------------------------------------------
        Route::prefix('super-admin')->middleware('role:super_admin')->group(function () {
            Route::get('/overview', [DashboardController::class, 'index']);
            
            // 👇 FIX #1: Route Management User Ditambahkan 👇
            Route::get('/users', [SuperAdminUserController::class, 'index']);
            
            Route::get('/mitras', [SuperAdminMitraController::class, 'index']);
            Route::get('/mitras/pending', [SuperAdminMitraController::class, 'getPending']);
            Route::post('/mitras', [SuperAdminMitraController::class, 'store']);
            Route::put('/mitras/{id}/approve', [SuperAdminMitraController::class, 'approve']);
            Route::put('/mitras/{id}/suspend', [SuperAdminMitraController::class, 'suspend']);
            Route::put('/mitras/{id}/unblock', [SuperAdminMitraController::class, 'unblock']);

            // MANAJEMEN PROFILE VIA SUPER ADMIN
            Route::get('/mitras/{id}/manage', [SuperAdminMitraController::class, 'getManageData']);
            Route::put('/mitras/{id}/change-license', [SuperAdminMitraController::class, 'changeLicense']);
            Route::put('/users/{id}/force-update', [SuperAdminMitraController::class, 'forceUpdateProfile']);
            
            // MANAJEMEN LICENSE TIERS
            Route::get('/license-tiers', [LicenseTierController::class, 'index']);
            Route::post('/license-tiers', [LicenseTierController::class, 'store']);
            Route::get('/license-tiers/{id}', [LicenseTierController::class, 'show']);
            Route::put('/license-tiers/{id}', [LicenseTierController::class, 'update']);
            Route::put('/license-tiers/{id}/toggle', [LicenseTierController::class, 'toggleStatus']);
            Route::delete('/license-tiers/{id}', [LicenseTierController::class, 'destroy']);

            // MANAJEMEN PENCAIRAN DANA
            Route::get('/payouts', [\App\Http\Controllers\SuperAdmin\PayoutController::class, 'index']);
            Route::put('/payouts/{id}/process', [\App\Http\Controllers\SuperAdmin\PayoutController::class, 'process']);
            Route::put('/payouts/{id}/complete', [\App\Http\Controllers\SuperAdmin\PayoutController::class, 'complete']);
            Route::put('/payouts/{id}/reject', [\App\Http\Controllers\SuperAdmin\PayoutController::class, 'reject']);

            // SYSTEM HEALTH & LOGS
            Route::get('/system-logs', [SystemHealthController::class, 'index']);
            
            // GLOBAL SETTINGS
            Route::get('/settings', [GlobalSettingController::class, 'index']);
            Route::put('/settings', [GlobalSettingController::class, 'update']);
        });

            
        // ------------------------------------------
        // TENANT ADMIN ROUTES (Admin Mitra)
        // ------------------------------------------
        Route::prefix('admin')->middleware(['auth:sanctum', 'role:admin', EnsureTenantMiddleware::class])->group(function () {
            
            Route::get('/overview', [AdminDashboardController::class, 'index']);
            
            // MANAJEMEN GRUP
            Route::get('/groups', [GroupController::class, 'index']);
            Route::post('/groups', [GroupController::class, 'store']);
            Route::get('/groups/{id}', [GroupController::class, 'show']);
            Route::put('/groups/{id}', [GroupController::class, 'update']);
            Route::delete('/groups/{id}', [GroupController::class, 'destroy']);

            // MANAJEMEN DETAIL GRUP (MEMBER)
            Route::get('/groups/{id}/members', [GroupController::class, 'getMembers']);
            Route::post('/groups/{id}/members', [GroupController::class, 'addMember']);
            Route::put('/groups/{groupId}/members/{userId}', [GroupController::class, 'updateMember']);
            Route::delete('/groups/{groupId}/members/{userId}', [GroupController::class, 'removeMember']);
            
            // MANAJEMEN SESI (EVENT MAKER)
            Route::get('/sessions', [SessionController::class, 'index']);
            Route::post('/sessions', [SessionController::class, 'store']);
            Route::get('/sessions/{id}', [SessionController::class, 'show']);
            Route::post('/sessions/{id}/broadcast', [SessionController::class, 'broadcast']);
            Route::delete('/sessions/{id}', [SessionController::class, 'destroy']);
            Route::post('/sessions/{session}/remind', [SessionController::class, 'remind']);
            Route::put('/sessions/{id}', [SessionController::class, 'update']);
            Route::get('/sessions/{id}/export', [SessionController::class, 'exportAttendance']);
            Route::post('sessions/{session}/confirm/{user}', [SessionController::class, 'confirmManualPayment']);

            // MANAJEMEN TAGIHAN
            Route::get('/bills', [BillController::class, 'index']);

            // PENGATURAN MITRA
            Route::get('/settings', [SettingController::class, 'index']);
            Route::post('/settings', [SettingController::class, 'update']);
            
            // KEUANGAN & PENCAIRAN
            Route::get('/finance', [FinanceController::class, 'index']);
            Route::post('/finance/payout', [FinanceController::class, 'requestPayout']);
        });
            
        // ------------------------------------------
        // USER / MEMBER ROUTES
        // ------------------------------------------
        Route::get('/user/history', [\App\Http\Controllers\User\MemberController::class, 'history']);
        Route::put('/user/profile', [\App\Http\Controllers\User\MemberController::class, 'updateProfile']);

    });
});

// 👇 FIX #3: Backdoor /setup-rahasia telah dihapus dan dimusnahkan 👇
// Ke depannya, gunakan class Seeder (misal: DatabaseSeeder.php) yang dijalankan via command:
// php artisan db:seed