<?php

namespace App\Services\Payment;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PakasirService implements PaymentInterface
{
    protected $config;

    public function __construct($config) {
        // Konversi string JSON ke Object
        $this->config = is_string($config) ? json_decode($config) : (object) $config; 
    }

   public function createCharge(array $params): array {
        $config = is_string($this->config) ? json_decode($this->config) : (object) $this->config;
        
        $projectSlug = $config->project ?? '';
        $apiKey = $config->api_key ?? ''; // Kita butuh API Key untuk metode POST
        
        $orderId = $params['transaction_id'];
        $amount = (int) $params['amount'];

        // Tembak API Pakasir (Opsi C - Transaction Create API)
        $response = Http::post('https://app.pakasir.com/api/transactioncreate/qris', [
            'project' => $projectSlug,
            'order_id' => $orderId,
            'amount' => $amount,
            'api_key' => $apiKey
        ]);

        if ($response->failed()) {
            throw new \Exception("Gagal mengambil QRIS dari Pakasir.");
        }

        $data = $response->json();

        return [
            'transaction_id' => $orderId,
            'payment_url' => '', // Kita tidak butuh redirect URL lagi
            'qr_code' => $data['payment']['payment_number'] ?? '' // INI ADALAH STRING QRIS MENTAH!
        ];
    }

    // Untuk fungsi Webhook, Pakasir tidak memakai Signature. 
    // Jadi kita verifikasi dengan menembak balik API mereka (Opsi E)
    public function verifyWebhook(array $payload, ?string $signature): bool 
    {
        $projectSlug = $this->config->project ?? '';
        $apiKey = $this->config->api_key ?? '';
        
        $orderId = $payload['order_id'] ?? '';
        $amount = $payload['amount'] ?? '';

        if (!$orderId || !$amount) return false;

        try {
            // Tanya ke server Pakasir: "Apakah transaksi ini beneran lunas?"
            $response = Http::get("https://app.pakasir.com/api/transactiondetail", [
                'project' => $projectSlug,
                'amount' => $amount,
                'order_id' => $orderId,
                'api_key' => $apiKey
            ]);

            if ($response->successful()) {
                $data = $response->json();
                // Validasi jika statusnya benar-benar completed
                return isset($data['transaction']['status']) && $data['transaction']['status'] === 'completed';
            }
        } catch (\Exception $e) {
            Log::error("Pakasir Webhook Verification Error: " . $e->getMessage());
        }

        return false;
    }
}