<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('global_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique(); // Contoh: 'platform_fee', 'pakasir_secret_key'
            $table->text('value')->nullable(); // Nilainya
            $table->string('group')->default('general'); // Pengelompokan (general, payment, wa)
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('global_settings');
    }
};