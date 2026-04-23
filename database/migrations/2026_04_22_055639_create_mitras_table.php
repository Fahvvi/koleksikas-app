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
    Schema::create('mitras', function (Blueprint $table) {
        $table->uuid('id')->primary();
        $table->string('name');
        $table->string('email')->unique();
        $table->string('phone')->nullable();
        $table->string('company_name')->nullable();
        $table->enum('status', ['pending', 'active', 'suspended'])->default('pending');
        $table->text('notes')->nullable();
        $table->timestamp('approved_at')->nullable();
        // $table->foreignUuid('approved_by')->nullable()->constrained('users'); // Diaktifkan nanti jika tabel user sudah siap
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mitras');
    }
};
