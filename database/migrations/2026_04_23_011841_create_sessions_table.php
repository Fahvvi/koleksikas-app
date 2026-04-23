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
    Schema::create('play_sessions', function (Blueprint $table) {
        $table->uuid('id')->primary();
        $table->foreignUuid('group_id')->constrained('groups')->cascadeOnDelete();
        $table->string('name'); // Contoh: "Open Play Minisoccer"
        $table->dateTime('scheduled_at'); // Tanggal & Jam Mulai
        $table->time('end_time')->nullable(); // Jam Selesai
        $table->text('location'); // Nama Lapangan (misal: Pitch 98)
        $table->string('maps_url')->nullable(); // Link Google Maps
        $table->integer('max_participants')->default(30);
        $table->integer('price'); // Harga per slot (misal: 50000)
        $table->enum('status', ['draft', 'active', 'completed', 'cancelled'])->default('active');
        $table->foreignUuid('created_by')->constrained('users');
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('play_sessions');
    }
};
