<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') {
            URL::forceScheme('https');
        }

        // Limit Konfirmasi Bayar: 3x per jam per ID Transaksi
        RateLimiter::for('mark-paid', function (Request $request) {
            return Limit::perHour(3)->by($request->route('id'));
        });

        // Limit Request OTP: 3x per 5 menit per Nomor WA
        RateLimiter::for('otp-request', function (Request $request) {
            return Limit::perMinutes(5, 3)->by($request->input('phone_wa') ?: $request->ip());
        });

        // Limit Login: 5x per menit per IP
        RateLimiter::for('login', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });
    }
}
