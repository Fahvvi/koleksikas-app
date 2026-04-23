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
            'password' => Hash::make('password123'), // Ganti dengan password yang lebih aman nanti
            'role' => 'super_admin',
            'email_verified_at' => now(),
        ]);
    }
}