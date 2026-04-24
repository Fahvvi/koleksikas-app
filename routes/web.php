<?php

use Illuminate\Support\Facades\Route;

// Semua request ke API tetap diurus oleh routes/api.php
// Tapi untuk request web biasa, lemparkan ke file index Vue (biasanya welcome.blade.php)
Route::get('/{any}', function () {
    return view('welcome'); // Pastikan di welcome.blade.php kamu sudah memuat file app.js (Vue)
})->where('any', '.*');