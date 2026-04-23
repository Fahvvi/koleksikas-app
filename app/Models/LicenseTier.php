<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class LicenseTier extends Model
{
    use HasUuids;

    protected $fillable = [
        'name', 'slug', 'price', 'max_groups', 
        'max_members_per_group', 'max_sessions_per_month', 
        'features', 'is_active'
    ];

    protected $casts = [
        'features' => 'array',
        'is_active' => 'boolean',
    ];
}