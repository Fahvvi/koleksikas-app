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
    Schema::create('payment_configs', function (Blueprint $table) {
        $table->uuid('id')->primary();
        $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
        $table->enum('provider', ['koleksikas','pakasir', 'midtrans', 'xendit', 'static_qris'])->default('koleksikas');
        
        // Simpan API Key dalam bentuk JSON terenkripsi
        $table->text('payload'); // Berisi server_key, client_key, atau api_token
        $table->boolean('is_active')->default(true);
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_configs');
    }
};
