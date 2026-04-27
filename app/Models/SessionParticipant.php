<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class SessionParticipant extends Model
{
    use HasUuids;

    // Tidak perlu mendefinisikan $table karena Laravel otomatis mencari 'session_participants'

    protected $fillable = [
        'id', 
        'session_id', 
        'user_id', 
        'status', 
        'joined_at'
    ];

    public $timestamps = true;

    // --- RELASI ---
    public function session()
    {
        return $this->belongsTo(Session::class, 'session_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}