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
            
            // --- Info Dasar ---
            $table->string('name'); // Contoh: "Open Play Minisoccer Jumat"
            $table->text('description')->nullable(); // Contoh: "Wajib bawa sepatu turf. Free air mineral."
            $table->dateTime('scheduled_at'); // Tanggal & Jam Mulai
            $table->time('end_time')->nullable(); // Jam Selesai
            
            // --- Lokasi ---
            $table->text('location'); // Nama Lapangan (misal: Pitch 98)
            $table->string('maps_url')->nullable(); // Link Google Maps
            
            // --- Kuota & Harga ---
            $table->integer('max_participants')->default(30);
            $table->integer('price'); // Harga per slot (misal: 50000)
            
            // --- SETTING PUBLIK (Inovasi B2B2C) ---
            $table->boolean('is_public')->default(false); // true = Muncul di halaman publik
            $table->string('banner_url')->nullable(); // Gambar banner untuk halaman publik
            
            // --- Status & Tracking ---
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
