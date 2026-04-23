<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Mitra extends Model
{
    use HasUuids;

    protected $fillable = ['name', 'email', 'phone', 'company_name', 'status'];

    public function licenses()
    {
        return $this->hasMany(MitraLicense::class);
    }

    public function tenants()
    {
        return $this->hasMany(Tenant::class);
    }
}