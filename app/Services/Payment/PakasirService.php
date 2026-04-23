<?php

namespace App\Services\Payment;

use Illuminate\Support\Facades\Http;

class PakasirService implements PaymentInterface
{
    protected $config;

    public function __construct($config) {
        $this->config = $config; // Data dari tabel payment_configs
    }

    public function createCharge(array $params): array {
        // Logika hit API Pakasir untuk generate QRIS
        // Return format yang seragam: [payment_url, qr_code, transaction_id]
        return [
            'transaction_id' => 'PKSR-' . uniqid(),
            'payment_url' => '...', 
            'qr_code' => '...'
        ];
    }

    public function verifyWebhook(array $payload, ?string $signature): bool 
    {
        if (!$signature) return false;

        // Ambil secret key milik admin yang tersimpan di DB
        $secretKey = json_decode($this->config)->secret_key; 
        
        // Buat string dari payload sesuai aturan Pakasir (misal: JSON stringified)
        $payloadString = json_encode($payload);

        // Hasilkan hash dan bandingkan
        $expectedSignature = hash_hmac('sha256', $payloadString, $secretKey);

        return hash_equals($expectedSignature, $signature);
    }
}