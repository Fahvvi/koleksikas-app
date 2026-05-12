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
    Schema::create('transactions', function (Blueprint $table) {
        $table->uuid('id')->primary();
        $table->foreignUuid('tenant_id')->nullable()->constrained('tenants')->cascadeOnDelete();
        $table->foreignUuid('bill_item_id')->nullable()->constrained('bill_items')->cascadeOnDelete();
        $table->foreignUuid('user_id')->nullable()->constrained('users')->cascadeOnDelete();    
        $table->decimal('amount', 15, 2);
        $table->string('payment_method')->default('qris');
        $table->string('gateway_transaction_id')->nullable(); // ID dari Midtrans
        $table->enum('status', ['pending', 'success', 'failed', 'expired', 'confirmation_requested'])->default('pending');
        $table->text('payment_url')->nullable(); // Link bayar Midtrans
        $table->text('qr_code_url')->nullable(); 
        $table->json('payload')->nullable();
        $table->timestamp('paid_at')->nullable();
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
