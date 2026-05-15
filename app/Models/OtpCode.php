<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OtpCode extends Model
{
    use HasFactory;

    public $incrementing = false;
    protected $keyType = 'string';

    // 👇 INI KUNCINYA: Harus pakai 'identifier' dan 'code' 👇
    protected $fillable = [
        'id', 
        'user_id', 
        'identifier', 
        'code',       
        'type', 
        'is_used', 
        'expires_at'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}