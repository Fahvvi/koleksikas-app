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
    Schema::create('groups', function (Blueprint $table) {
        $table->uuid('id')->primary();
        $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
        $table->string('name'); // Contoh: Futsal Sabtu Pagi
        $table->text('description')->nullable();
        $table->string('sport_type')->nullable(); // minisoccer, futsal, badminton
        $table->string('avatar_url')->nullable();
        $table->foreignUuid('admin_user_id')->constrained('users')->cascadeOnDelete();
        
        // Integrasi WA Group
        $table->string('wa_group_id')->nullable(); 
        $table->string('wa_group_name')->nullable();
        $table->boolean('wa_notify_enabled')->default(true);
        
        $table->jsonb('settings')->nullable();
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('groups');
    }
};
