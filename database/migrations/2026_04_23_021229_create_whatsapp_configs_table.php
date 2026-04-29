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
    Schema::create('whatsapp_configs', function (Blueprint $table) {
        $table->uuid('id')->primary();
        $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
        $table->string('provider')->default('waha');
        $table->text('api_token')->nullable(); // Token Fonnte Admin
        $table->string('device_number')->nullable();
        $table->json('settings')->nullable();
        $table->boolean('is_active')->default(true);
        $table->integer('daily_limit')->default(200);
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('whatsapp_configs');
    }
};
