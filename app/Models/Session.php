<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Session extends Model
{
    use HasFactory, HasUuids;
    
    protected $table = 'play_sessions';
    
    protected $fillable = [
    'id', 'group_id', 'name', 'scheduled_at', 'end_time', 
    'location', 'maps_url', 'max_participants', 'price', 'status', 'created_by',
    'is_public', 'banner_url', 'description', 'type'
];

    public $incrementing = false;
    protected $keyType = 'string';

    protected $casts = [
        'scheduled_at' => 'datetime',
        'end_time' => 'string',
        'is_public' => 'boolean'
];

public function group()
    {
        return $this->belongsTo(Group::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function participants()
    {
        return $this->hasMany(SessionParticipant::class);
    }
}
