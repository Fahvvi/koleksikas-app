<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class SecurityHeaders
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        if (method_exists($response, 'header')) {
            $response->header('X-Frame-Options', 'SAMEORIGIN'); 
            $response->header('X-Content-Type-Options', 'nosniff'); 
            $response->header('X-XSS-Protection', '1; mode=block'); 
            $response->header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains'); 
            
            // 👇 FIX: CSP Dinamis (Longgar di Local/Ngrok, Ketat di Production) 👇
            $isLocal = app()->environment('local'); // Cek apakah di .env tertulis APP_ENV=local

            if ($isLocal) {
                // CSP LONGGAR UNTUK DEVELOPMENT (Mengizinkan Vite localhost & ngrok)
                $csp = "default-src 'self' 'unsafe-inline' 'unsafe-eval' http: https: data: ws: wss:; " .
                       "script-src 'self' 'unsafe-inline' 'unsafe-eval' http: https:; " . 
                       "style-src 'self' 'unsafe-inline' http: https:; " .
                       "font-src 'self' http: https: data:; " .
                       "img-src 'self' data: http: https:; " .
                       "connect-src 'self' http: https: ws: wss:;";
            } else {
                // CSP KETAT UNTUK PRODUCTION (Hanya Domain Sendiri)
                $csp = "default-src 'self'; " .
                       "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " . 
                       "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " .
                       "font-src 'self' https://fonts.gstatic.com; " .
                       "img-src 'self' data: https:; " .
                       "connect-src 'self'; " .
                       "frame-src 'self';";
            }

            $response->header('Content-Security-Policy', $csp);
        }

        return $response;
    }
}