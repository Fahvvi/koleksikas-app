<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class PaymentConfig extends Model
{
    use HasUuids;

    // TAMBAHKAN BARIS INI
    protected $fillable = [
        'id', 'tenant_id', 'provider', 'payload', 'is_active'
    ];
}
