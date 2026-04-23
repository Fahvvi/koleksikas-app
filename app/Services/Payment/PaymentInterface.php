<?php

namespace App\Services\Payment;

interface PaymentInterface
{
    public function createCharge(array $params): array;
    public function verifyWebhook(array $payload, string $signature): bool;
}