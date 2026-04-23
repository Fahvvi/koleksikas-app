<?php

namespace App\Traits;

use App\Scopes\TenantScope;
use App\Models\Tenant;

trait BelongsToTenant
{
    /**
     * Boot the BelongsToTenant trait for a model.
     */
    protected static function bootBelongsToTenant(): void
    {
        // 1. Otomatis terapkan Global Scope
        static::addGlobalScope(new TenantScope);

        // 2. Otomatis isi kolom tenant_id saat proses Create
        static::creating(function ($model) {
            if (app()->bound('tenant') && empty($model->tenant_id)) {
                $model->tenant_id = app('tenant')->id;
            }
        });
    }

    /**
     * Relasi balik ke Tenant
     */
    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
}