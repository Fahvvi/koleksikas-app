import axios from 'axios';
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
window.axios.defaults.headers.common['Accept'] = 'application/json'; // <-- Tambahkan ini
window.axios.defaults.headers.common['ngrok-skip-browser-warning'] = 'true';
window.axios.defaults.withCredentials = true; 
window.axios.defaults.withXSRFToken = true;

axios.interceptors.request.use(function (config) {

    
    window.axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Hapus sisa remah-remah identitas
            localStorage.removeItem('user');
            
            if (window.location.pathname !== '/auth/login' && window.location.pathname !== '/user/login') {
                window.location.href = '/auth/login?session_expired=true';
            }
        }
        return Promise.reject(error);
    }
);

    window.axios.interceptors.response.use(
    (response) => response, // Biarkan jika response sukses (200)
    (error) => {
        // Jika Backend menolak karena Token Kedaluwarsa/Tidak Valid (401 Unauthorized)
            if (error.response && error.response.status === 401) {
                
                // 1. Hapus data sensitif dari penyimpanan browser
                localStorage.removeItem('user');
                localStorage.removeItem('token'); // Sesuaikan nama key-nya
                
                // 2. Usir kembali ke halaman login (Kecuali jika memang sedang di halaman login)
                if (window.location.pathname !== '/auth/login' && window.location.pathname !== '/user/login') {
                    window.location.href = '/auth/login?session_expired=true';
                }
            }
            return Promise.reject(error);
        }
    );

    // 2. Ambil slug tenant (wajib untuk routes Mitra)
    const tenantSlug = localStorage.getItem('tenant_slug');
    if (tenantSlug) {
        config.headers['X-Tenant'] = tenantSlug;
    }

    return config;
    
}, function (error) {
    return Promise.reject(error);
});

/**
 * Echo exposes an expressive API for subscribing to channels and listening
 * for events that are broadcast by Laravel. Echo and event broadcasting
 * allow your team to quickly build robust real-time web applications.
 */

import './echo';
