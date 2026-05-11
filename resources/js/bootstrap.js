import axios from 'axios';
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
window.axios.defaults.headers.common['Accept'] = 'application/json'; // <-- Tambahkan ini
window.axios.defaults.headers.common['ngrok-skip-browser-warning'] = 'true';


axios.interceptors.request.use(function (config) {
    // 1. Ambil token dari Local Storage (brankas browser)
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

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
