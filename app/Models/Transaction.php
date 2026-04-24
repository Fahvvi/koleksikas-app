<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    use HasUuids;

    // Tambahkan properti ini agar ID UUID bisa masuk
    public $incrementing = false;
    protected $keyType = 'string';

    // Tambahkan [id] dan kolom lainnya ke dalam fillable
    protected $fillable = [
        'id', 
        'tenant_id', 
        'bill_item_id', 
        'user_id', 
        'amount', 
        'payment_url', 
        'qr_code_url', 
        'status',
        'payload'
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function billItem()
    {
        return $this->belongsTo(BillItem::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}