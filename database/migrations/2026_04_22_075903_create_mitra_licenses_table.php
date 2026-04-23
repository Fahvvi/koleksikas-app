<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mitra_licenses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('mitra_id')->constrained('mitras')->cascadeOnDelete();
            $table->foreignUuid('license_tier_id')->constrained('license_tiers');
            $table->string('license_key')->unique();
            $table->enum('status', ['pending_payment', 'pending_approval', 'active', 'suspended', 'expired'])->default('pending_approval');
            $table->timestamp('purchased_at')->nullable();
            $table->timestamp('activated_at')->nullable();
            $table->timestamp('maintenance_expires_at')->nullable();
            $table->jsonb('capacity_overrides')->nullable();
            $table->string('payment_transaction_id')->nullable();
            $table->integer('price_paid')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mitra_licenses');
    }
};