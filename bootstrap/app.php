<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use App\Models\SystemLog;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Illuminate\Validation\ValidationException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->alias([
        'tenant' => \App\Http\Middleware\EnsureTenantMiddleware::class,
        'role' => \App\Http\Middleware\RoleMiddleware::class, // Jika nanti role middleware dibuat
    ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
       $exceptions->reportable(function (\Throwable $e) {
            try {
                // 1. Abaikan error sepele agar database tidak penuh!
                // Jangan log 404 (Halaman tidak ditemukan) & Error form (Validation)
                if ($e instanceof NotFoundHttpException || $e instanceof ValidationException) {
                    return;
                }

                // 2. Deteksi Otomatis Service yang Error dari Nama File
                $service = 'system';
                $file = $e->getFile();
                if (str_contains(strtolower($file), 'waha') || str_contains(strtolower($file), 'whatsapp')) {
                    $service = 'whatsapp';
                } elseif (str_contains(strtolower($file), 'pakasir') || str_contains(strtolower($file), 'payment')) {
                    $service = 'payment';
                }

                // 3. Simpan ke Database
                SystemLog::create([
                    'level' => 'critical',
                    'service' => $service,
                    'message' => substr($e->getMessage(), 0, 250), // Batasi max 250 huruf
                    'context' => [
                        'file' => $file,
                        'line' => $e->getLine(),
                        'url' => request()->fullUrl(),
                        // PENTING: Jangan pernah melog password user!
                        'input' => request()->except(['password', 'password_confirmation']), 
                    ]
                ]);
            } catch (\Throwable $loggingError) {
                // Jika database mati, tulis ke file log biasa agar tidak infinite loop
                Log::error('GAGAL MENCATAT SYSTEM LOG: ' . $loggingError->getMessage());
            }
        });
    })->create();
