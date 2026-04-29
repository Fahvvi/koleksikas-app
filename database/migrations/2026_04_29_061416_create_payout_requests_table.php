<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('payout_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id');
            $table->decimal('amount', 15, 2); // Jumlah yang ditarik
            $table->string('bank_name');
            $table->string('account_number');
            $table->string('account_holder');
            $table->enum('status', ['pending', 'processing', 'completed', 'rejected'])->default('pending');
            $table->text('notes')->nullable(); // Catatan penolakan dari Superadmin jika ada
            $table->timestamp('processed_at')->nullable(); // Kapan dana ditransfer
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('payout_requests');
    }
};