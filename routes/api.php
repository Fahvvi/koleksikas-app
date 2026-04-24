<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Admin\GroupController;
use App\Http\Controllers\MitraRegisterController;
use App\Http\Controllers\SuperAdmin\MitraController as SuperAdminMitraController;
use App\Http\Controllers\SuperAdmin\LicenseTierController as LicenseTierController;
use App\Http\Controllers\SuperAdmin\SystemHealthController as SystemHealthController;
use App\Http\Controllers\SuperAdmin\GlobalSettingController;
use App\Http\Controllers\SuperAdmin\DashboardController;

Route::prefix('v1')->group(function () {
    
    // PUBLIC ROUTES
    Route::post('/auth/login', [AuthController::class, 'login']);
    
    
    // Alur Mitra Baru (Sesuai routes.md)
    Route::post('/mitra/register', [MitraRegisterController::class, 'register']);
    Route::post('/mitra/activate', [MitraRegisterController::class, 'activate']);
    
    // OPEN PLAY ROUTES
    Route::post('/sessions/{sessionId}/register', [\App\Http\Controllers\Public\SessionRegistrationController::class, 'register']);

    // WEBHOOKS ROUTES
    Route::post('/webhook/{provider}', [\App\Http\Controllers\Webhook\PaymentWebhookController::class, 'handle']);


    // PROTECTED ROUTES
    Route::middleware('auth:sanctum')->group(function () {
        
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);

        // SUPER ADMIN ROUTES
        // Menggunakan role middleware yang sudah kita buat sebelumnya
        Route::prefix('super-admin')->middleware('role:super_admin')->group(function () {
            Route::get('/overview', [DashboardController::class, 'index']);
            Route::get('/mitras', [SuperAdminMitraController::class, 'index']);
            Route::get('/mitras/pending', [SuperAdminMitraController::class, 'getPending']);
            Route::put('/mitras/{id}/approve', [SuperAdminMitraController::class, 'approve']);
            Route::put('/mitras/{id}/suspend', [SuperAdminMitraController::class, 'suspend']);


            // --- MANAJEMEN LICENSE TIERS ---
            Route::get('/license-tiers', [LicenseTierController::class, 'index']);      // List
            Route::post('/license-tiers', [LicenseTierController::class, 'store']);     // Tambah (POST)
            Route::get('/license-tiers/{id}', [LicenseTierController::class, 'show']);  // Detail
            Route::put('/license-tiers/{id}', [LicenseTierController::class, 'update']); // Update (PUT)
            Route::put('/license-tiers/{id}/toggle', [LicenseTierController::class, 'toggleStatus']); // Aktif/Nonaktif
            Route::delete('/license-tiers/{id}', [LicenseTierController::class, 'destroy']); // Hapus (DELETE)
        
            // --- SYSTEM HEALTH & LOGS ---
            Route::get('/system-logs', [SystemHealthController::class, 'index']);
            

            // --- GLOBAL SETTINGS ---
            Route::get('/settings', [GlobalSettingController::class, 'index']);
            Route::put('/settings', [GlobalSettingController::class, 'update']);
            });

        // TENANT ADMIN ROUTES...

        Route::prefix('admin')->middleware(['tenant', 'role:admin'])->group(function () {
            
            Route::get('/groups', [GroupController::class, 'index']);        // Untuk list tabel
            Route::post('/groups', [GroupController::class, 'store']);       // Untuk tambah (Modal Add)
            Route::get('/groups/{id}', [GroupController::class, 'show']);    // Untuk halaman detail
            Route::put('/groups/{id}', [GroupController::class, 'update']);  // <-- INI YANG BIKIN ERROR 405 TADI
         Route::delete('/groups/{id}', [GroupController::class, 'destroy']);
            
        });
        
        // USER / MEMBER ROUTES...
    });
});

use Illuminate\Support\Facades\DB;

Route::get('/setup-rahasia', function () {
    return DB::transaction(function () {
        $tier = App\Models\LicenseTier::firstOrCreate(['slug' => 'pro'], ['id' => \Illuminate\Support\Str::uuid(), 'name' => 'Pro Tier', 'price' => 0, 'max_groups' => 5, 'max_members_per_group' => 100, 'max_sessions_per_month' => 50, 'features' => []]);
        $mitra = App\Models\Mitra::create(['id' => \Illuminate\Support\Str::uuid(), 'name' => 'Budi', 'email' => 'budi_'.time().'@futsal.com', 'phone' => '0812', 'company_name' => 'PT Budi', 'status' => 'active']);
        $license = App\Models\MitraLicense::create(['id' => \Illuminate\Support\Str::uuid(), 'mitra_id' => $mitra->id, 'license_tier_id' => $tier->id, 'license_key' => 'KEY-'.time(), 'status' => 'active']);
        $tenant = App\Models\Tenant::create(['id' => \Illuminate\Support\Str::uuid(), 'mitra_id' => $mitra->id, 'mitra_license_id' => $license->id, 'name' => 'Futsal Budi', 'slug' => 'futsal-budi-'.time(), 'status' => 'active']);
        $admin = App\Models\User::create(['id' => \Illuminate\Support\Str::uuid(), 'tenant_id' => $tenant->id, 'name' => 'Admin Budi', 'email' => 'admin_'.time().'@futsal.com', 'password' => bcrypt('password'), 'role' => 'admin']);
        $group = App\Models\Group::create(['id' => \Illuminate\Support\Str::uuid(), 'tenant_id' => $tenant->id, 'name' => 'Tim Futsal Inti', 'admin_user_id' => $admin->id]);
        App\Models\PaymentConfig::create(['id' => \Illuminate\Support\Str::uuid(), 'tenant_id' => $tenant->id, 'provider' => 'pakasir', 'payload' => json_encode(['secret_key' => 'rahasia123'])]);
        App\Models\WhatsappConfig::create(['id' => \Illuminate\Support\Str::uuid(), 'tenant_id' => $tenant->id, 'provider' => 'waha', 'api_token' => 'RahasiaKoleksiKas123!']);
        
        $idSesiSakti = \Illuminate\Support\Str::uuid()->toString();
        
        App\Models\Session::create(['id' => $idSesiSakti, 'group_id' => $group->id, 'name' => 'Minisoccer Akhir Pekan', 'scheduled_at' => now()->addDays(2)->setTime(19, 0), 'end_time' => '21:00', 'location' => 'Pitch 98', 'maps_url' => 'https://maps.google.com', 'price' => 50000, 'created_by' => $admin->id]);
        App\Models\Bill::create(['id' => \Illuminate\Support\Str::uuid(), 'tenant_id' => $tenant->id, 'group_id' => $group->id, 'session_id' => $idSesiSakti, 'name' => 'Iuran Minisoccer', 'amount' => 50000, 'due_date' => now()->addDays(2), 'created_by' => $admin->id]);
        
        return response()->json([
            'status' => 'SUPER BERHASIL!',
            'ID_SESI_UNTUK_ANDI' => $idSesiSakti
        ]);
    });
});