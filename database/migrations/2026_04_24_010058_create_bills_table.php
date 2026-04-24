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
        Schema::create('bills', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('group_id')->constrained('groups')->cascadeOnDelete();
            $table->foreignUuid('session_id')->nullable()->constrained('play_sessions')->cascadeOnDelete();
            $table->string('name'); // Contoh: "Iuran Futsal 25 April"
            $table->integer('amount'); // Nominal per orang: 50000
            $table->dateTime('due_date'); // Jatuh tempo penagihan
            $table->enum('type', ['per_session', 'recurring', 'one_time'])->default('one_time');
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
        Schema::dropIfExists('bills');
    }
};
