<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
{
    Schema::create('otp_codes', function (Blueprint $table) {
        $table->uuid('id')->primary();
        $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
        $table->string('identifier'); // email atau nomor WA
        $table->string('code');
        $table->string('type'); // profile_update, forgot_password, change_phone
        $table->boolean('is_used')->default(false);
        $table->timestamp('expires_at');
        $table->timestamps();
    });
}   

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('otp_codes');
    }
};
