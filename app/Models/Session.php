<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Session extends Model
{
    protected $table = 'play_sessions';
    
    protected $fillable = [
    'id', 'group_id', 'name', 'scheduled_at', 'end_time', 
    'location', 'maps_url', 'max_participants', 'price', 'status', 'created_by'
];

    protected $casts = [
        'scheduled_at' => 'datetime',
];
}
