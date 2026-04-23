<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Bill extends Model
{
    use HasUuids, BelongsToTenant;

    protected $fillable = [
        'id', 
        'tenant_id', 
        'group_id', 
        // 'session_id', // Buka ini nanti setelah tabel sesi dibuat
        'name', 
        'amount', 
        'due_date', 
        'type', 
        'status', 
        'created_by'
    ];

    protected $casts = [
        'due_date' => 'datetime',
    ];

    // --- Relasi ---
    public function group()
    {
        return $this->belongsTo(Group::class);
    }

    public function items()
    {
        return $this->hasMany(BillItem::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}