<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('payout_configs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id'); // Relasi ke tenant/mitra
            $table->string('bank_name')->nullable();
            $table->string('account_number')->nullable();
            $table->string('account_holder')->nullable();
            $table->timestamps();

            // Foreign key jika tenant dihapus, rekeningnya juga terhapus
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('payout_configs');
    }
};