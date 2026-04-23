<?php

namespace App\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class TenantScope implements Scope
{
    /**
     * Apply the scope to a given Eloquent query builder.
     */
    public function apply(Builder $builder, Model $model): void
    {
        // Cek apakah ada instance 'tenant' yang sedang aktif di Service Container
        // Instance ini nantinya di-set oleh EnsureTenantMiddleware dari subdomain
        if (app()->bound('tenant')) {
            $tenantId = app('tenant')->id;
            
            // Format tabel.tenant_id untuk mencegah ambiguous column issue saat melakukan JOIN
            $builder->where($model->getTable() . '.tenant_id', $tenantId);
        }
    }
}