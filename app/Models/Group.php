<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Group extends Model
{
    use HasUuids, BelongsToTenant; // <-- Trait sakti kita pasang di sini

    protected $fillable = [
        'id',
        'tenant_id',
        'name',
        'description',
        'sport_type',
        'avatar_url',
        'admin_user_id',
        'wa_group_id',
        'wa_group_name',
        'wa_notify_enabled',
        'settings'
    ];

    protected $casts = [
        'settings' => 'array',
        'wa_notify_enabled' => 'boolean',
    ];

    public function admin()
    {
        return $this->belongsTo(User::class, 'admin_user_id');
    }

    // --- Relasi ---
    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
    public function members()
    {
        return $this->hasMany(GroupMember::class, 'group_id');
    }
}