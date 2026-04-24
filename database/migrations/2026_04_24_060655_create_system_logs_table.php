<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('system_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('level'); // info, warning, error, critical
            $table->string('service'); // whatsapp, payment, system, database
            $table->text('message'); // Pesan log (Contoh: "Webhook Pakasir Gagal")
            $table->json('context')->nullable(); // Simpan detail error / payload json
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('system_logs');
    }
};