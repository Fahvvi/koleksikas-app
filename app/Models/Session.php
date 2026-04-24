<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Session extends Model
{
    protected $table = 'play_sessions';
    
    protected $fillable = [
    'id', 'group_id', 'name', 'scheduled_at', 'end_time', 
    'location', 'maps_url', 'max_participants', 'price', 'status', 'created_by'
];

    public $incrementing = false;
    protected $keyType = 'string';

    protected $casts = [
        'scheduled_at' => 'datetime',
        'end_time' => 'string'
];

public function group()
    {
        return $this->belongsTo(Group::class);
    }

}
