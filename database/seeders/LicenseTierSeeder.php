<?php

namespace Database\Seeders;

use App\Models\LicenseTier;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class LicenseTierSeeder extends Seeder
{
    public function run(): void
    {
        $tiers = [
            [
                'name' => 'Starter',
                'price' => 299000,
                'max_groups' => 2,
                'max_members_per_group' => 30,
                'max_sessions_per_month' => 10,
                'features' => json_encode(['qris' => true, 'wa_personal' => true, 'basic_report' => true]),
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'name' => 'Pro',
                'price' => 599000,
                'max_groups' => 10,
                'max_members_per_group' => 100,
                'max_sessions_per_month' => 50,
                'features' => json_encode(['qris' => true, 'wa_personal' => true, 'wa_group' => true, 'multi_admin' => true, 'export' => true]),
                'is_active' => true,
                'sort_order' => 2,
            ],
            [
                'name' => 'Business',
                'price' => 1199000,
                'max_groups' => 30,
                'max_members_per_group' => 300,
                'max_sessions_per_month' => 999999, // unlimited representation
                'features' => json_encode(['qris' => true, 'wa_personal' => true, 'wa_group' => true, 'multi_admin' => true, 'export' => true, 'custom_wa_template' => true, 'auto_recap' => true]),
                'is_active' => true,
                'sort_order' => 3,
            ],
        ];

        foreach ($tiers as $tier) {
            LicenseTier::create(array_merge($tier, [
                'id' => Str::uuid(),
                'slug' => Str::slug($tier['name'])
            ]));
        }
    }
}