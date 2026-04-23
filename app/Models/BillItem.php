<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class BillItem extends Model
{
    use HasUuids;

    protected $fillable = [
        'id', 
        'bill_id', 
        'user_id', 
        'amount', 
        'status', 
        'paid_at', 
        'notes'
    ];

    protected $casts = [
        'paid_at' => 'datetime',
    ];

    // --- Relasi ---
    public function bill()
    {
        return $this->belongsTo(Bill::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}