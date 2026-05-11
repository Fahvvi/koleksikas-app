<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'id' => Str::uuid(),
            'name' => 'Super Admin',
            'email' => 'admin@koleksikas.app',
            'password' => 'password123', 
            'role' => 'super_admin',
            'email_verified_at' => now(),
        ]);
    }
}