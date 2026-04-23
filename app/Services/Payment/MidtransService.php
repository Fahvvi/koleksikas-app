<?php

namespace App\Services\Payment;

use Illuminate\Support\Facades\Http;

class MidtransService implements PaymentInterface
{
    protected $config;

    public function __construct($config) {
        $this->config = $config; // Data dari tabel payment_configs
    }

    public function createCharge(array $params): array {
        // Logika hit API Midtrans untuk generate QRIS
        // Return format yang seragam: [payment_url, qr_code, transaction_id]
        return [
            'transaction_id' => 'PKSR-' . uniqid(),
            'payment_url' => '...', 
            'qr_code' => '...'
        ];
    }

    public function verifyWebhook(array $payload, string $signature): bool {
        // Logika verifikasi signature Midtrans
        return true;
    }
}