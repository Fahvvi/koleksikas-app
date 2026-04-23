<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class SessionParticipant extends Model
{
    use HasUuids;

    protected $fillable = [
        'id', 
        'session_id', 
        'user_id', 
        'status', 
        'joined_at'
    ];

    // --- Relasi ---
    public function session()
    {
        return $this->belongsTo(Session::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}