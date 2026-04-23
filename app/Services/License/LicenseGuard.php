<?php

namespace App\Services\License;

use App\Models\Tenant;
use Exception;

class LicenseGuard
{
    public static function check(Tenant $tenant, string $resource, $context = null): void
    {
        $capacity = app(LicenseService::class)->getCapacity($tenant);

        match ($resource) {
            'groups' => throw_if(
                $capacity['used_groups'] >= $capacity['max_groups'],
                new Exception('LICENSE_CAPACITY_EXCEEDED: Kapasitas grup penuh. Silakan upgrade lisensi.', 403)
            ),
            'members_per_group' => throw_if(
                $context && $context->members()->count() >= $capacity['max_members'],
                new Exception('LICENSE_CAPACITY_EXCEEDED: Kapasitas member untuk grup ini penuh.', 403)
            ),
            default => null,
        };
    }
}