<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class MitraLicense extends Model
{
    use HasUuids;

    protected $fillable = [
        'mitra_id', 'license_tier_id', 'license_key', 
        'status', 'activated_at', 'capacity_overrides'
    ];

    protected $casts = [
        'capacity_overrides' => 'array',
        'activated_at' => 'datetime',
    ];

    public function tier()
    {
        return $this->belongsTo(LicenseTier::class, 'license_tier_id');
    }
}