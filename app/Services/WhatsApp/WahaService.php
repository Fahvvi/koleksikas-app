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
        // PENTING: Jangan paksa tambah @c.us jika tujuannya adalah @lid atau grup (@g.us)
        if (str_contains($to, '@lid') || str_contains($to, '@g.us') || str_contains($to, '@c.us')) {
            $chatId = $to; // Gunakan ID aslinya (Contoh: 155254964404264@lid)
        } else {
            $cleanNumber = preg_replace('/[^0-9]/', '', $to);
            $chatId = "{$cleanNumber}@c.us";
        }

        $response = Http::withHeaders([
            'X-Api-Key' => $this->apiKey,
            'Content-Type' => 'application/json',
        ])->post("{$this->baseUrl}/api/sendText", [
            'chatId' => $chatId,
            'text' => $message,
            'session' => $session,
        ]);

        if ($response->failed()) {
            throw new Exception("WAHA Error: " . $response->body());
        }
        return $response->json();
    }
}