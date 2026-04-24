<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class WhatsappConfig extends Model
{
    use HasUuids;

    // TAMBAHKAN BARIS INI
    protected $fillable = [
        'id', 'tenant_id', 'provider', 'api_token', 'device_number', 'is_active', 'daily_limit'
    ];
}
