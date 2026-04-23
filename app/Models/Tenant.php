<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Tenant extends Model
{
    use HasUuids;

    // Daftarkan kolom apa saja yang boleh diisi melalui fungsi create()
    protected $fillable = [
        'id', 
        'mitra_id', 
        'mitra_license_id', 
        'name', 
        'slug', 
        'status', 
        'settings'
    ];

    protected $casts = [
        'settings' => 'array',
    ];

    // --- Relasi ---

    public function mitra()
    {
        return $this->belongsTo(Mitra::class);
    }

    public function mitraLicense()
    {
        return $this->belongsTo(MitraLicense::class);
    }

    public function groups()
    {
        return $this->hasMany(Group::class);
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }
}