<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
{
    Schema::table('users', function (Blueprint $table) {
        // Mengubah ID bawaan Laravel menjadi UUID jika diperlukan (opsional, tapi disarankan untuk SaaS)
        // Pastikan migration create_users bawaan laravel juga sudah diset menggunakan uuid()
        
        $table->foreignUuid('tenant_id')->nullable()->constrained('tenants')->cascadeOnDelete();
        $table->string('phone_wa')->nullable();
        $table->enum('role', ['super_admin', 'admin', 'user'])->default('user');
        $table->string('avatar_url')->nullable();
        $table->boolean('wa_notify_enabled')->default(true);
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            //
        });
    }
};
