<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class GroupMember extends Model
{
    use HasUuids;

    protected $fillable = [
        'id', 
        'group_id', 
        'user_id', 
        'role', 
        'joined_at', 
        'status'
    ];

    // --- Relasi ---
    public function group()
    {
        return $this->belongsTo(Group::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}