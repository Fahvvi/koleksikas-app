<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\MitraRegisterController;
use App\Http\Controllers\SuperAdmin\MitraController as SuperAdminMitraController;

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
            Route::get('/mitras/pending', [SuperAdminMitraController::class, 'getPending']);
            Route::put('/mitras/{id}/approve', [SuperAdminMitraController::class, 'approve']);
        });

        // TENANT ADMIN ROUTES...

        Route::prefix('admin')->middleware(['tenant', 'role:admin'])->group(function () {
            
            Route::get('/groups', [\App\Http\Controllers\Admin\GroupController::class, 'index']);
            Route::post('/groups', [\App\Http\Controllers\Admin\GroupController::class, 'store']);
            
        });
        
        // USER / MEMBER ROUTES...
    });
});