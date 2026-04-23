<?php

namespace App\Services\WhatsApp;

use Illuminate\Support\Facades\Http;
use Exception;

class WahaService
{
    protected string $baseUrl;
    protected string $apiKey;

    public function __construct()
    {
        $this->baseUrl = config('services.waha.base_url', env('WAHA_BASE_URL'));
        $this->apiKey = config('services.waha.api_key', env('WAHA_API_KEY'));
    }

    public function send(string $to, string $message, string $session = 'default'): array
    {
        // WAHA membutuhkan format nomor internasional tanpa '+' (misal: 62812...)
        $cleanNumber = preg_replace('/[^0-9]/', '', $to);

        $response = Http::withHeaders([
            'X-Api-Key' => $this->apiKey,
            'Content-Type' => 'application/json',
        ])->post("{$this->baseUrl}/api/sendText", [
            'chatId' => "{$cleanNumber}@c.us",
            'text' => $message,
            'session' => $session, // Nama session yang kamu buat di Dashboard WAHA
        ]);

        if ($response->failed()) {
            throw new Exception("WAHA Error: " . $response->body());
        }

        return $response->json();
    }
}