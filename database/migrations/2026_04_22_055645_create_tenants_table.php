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
    Schema::create('tenants', function (Blueprint $table) {
        $table->uuid('id')->primary();
        $table->foreignUuid('mitra_id')->constrained('mitras')->cascadeOnDelete();
        $table->foreignUuid('mitra_license_id')->nullable(); // Kita siapkan kolomnya dulu
        $table->string('name');
        $table->string('slug')->unique(); // Ini untuk subdomain, misal: futsal-jakarta
        $table->enum('status', ['active', 'suspended', 'over_capacity'])->default('active');
        $table->jsonb('settings')->nullable();
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tenants');
    }
};
