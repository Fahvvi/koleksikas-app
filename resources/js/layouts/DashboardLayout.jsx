import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function DashboardLayout() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    
    // 1. TAMBAH PROPERTI 'role' DI SINI
    const [userData, setUserData] = useState({ name: 'Memuat...', initials: '?', role: null });
    
    const location = useLocation();
    const navigate = useNavigate();

    // 2. AMBIL ROLE DARI DATABASE
    useEffect(() => {
        axios.get('/api/v1/user/profile')
            .then(res => {
                if(res.data && res.data.data) {
                    const { name, role } = res.data.data; // Ekstrak role juga
                    const initials = name.substring(0, 2).toUpperCase(); 
                    setUserData({ name, initials, role }); // Simpan role ke state
                }
            })
            .catch(err => console.error("Gagal mengambil data user", err));
    }, []);

    // 3. DETEKSI LOGIKA SUPER ADMIN YANG LEBIH CERDAS
    // Cek dari URL (biar instan pindah halaman) ATAU cek dari database (untuk halaman global seperti /profile)
    const isSuperAdmin = location.pathname.includes('/super-admin') || userData.role === 'super_admin';

    // Menu dinamis berdasarkan role
    const menus = isSuperAdmin ? [
        { name: 'Overview', path: '/super-admin/dashboard'}, //, icon: '📊' 
        { name: 'Mitra List', path: '/super-admin/mitras'}, //, icon: '🏢' 
        { name: 'License Tiers', path: '/super-admin/license-tiers'}, //, icon: '🔑' 
        { name: 'System Logs', path: '/super-admin/system-logs'}, //, icon: '📝' 
        { name: 'Global Settings', path: '/super-admin/global-settings'}, //, icon: '⚙️'
    ] : [
        { name: 'Dashboard', path: '/admin/dashboard' }, //, icon: '🏠'
        { name: 'Sesi', path: '/admin/sessions'},
        { name: 'Tagihan (Bills)', path: '/admin/billing' }, //, icon: '💸'
        { name: 'Member Group', path: '/admin/groups' }, //, icon: '👥'
        { name: 'Pengaturan', path: '/admin/settings'}, //, icon: '🤖' 
    ];

    // Fungsi Logout
    const handleLogout = async () => {
        try {
            await axios.post('/api/v1/auth/logout');
        } catch (e) {
            console.error(e);
        } finally {
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
            navigate('/auth/login');
        }
    };

    return (
        <div className="min-h-screen bg-kas-bg font-sans text-kas-dark flex">
            
            {/* SIDEBAR */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-kas-dark text-white transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:block flex flex-col`}>
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <Link to="/" className="text-2xl font-extrabold tracking-tight text-kas-accent">
                        Koleksi<span className="text-white">Kas.</span>
                    </Link>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden text-white/70 hover:text-white text-xl">✕</button>
                </div>
                
                <div className="p-4 flex-1 overflow-y-auto">
                    <div className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4 px-3">
                        {isSuperAdmin ? 'Super Admin Panel' : 'Tenant Menu'}
                    </div>
                    <nav className="space-y-1">
                        {menus.map((menu, index) => (
                            <Link 
                                key={index} to={menu.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${location.pathname.startsWith(menu.path) && menu.path !== '#' ? 'bg-kas-primary text-white font-bold' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
                            >
                                <span className="text-lg">{menu.icon}</span>
                                {menu.name}
                            </Link>
                        ))}
                    </nav>
                </div>
            </aside>

            {/* OVERLAY UNTUK MOBILE */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>
            )}

            {/* AREA KONTEN UTAMA */}
            <div className="flex-1 flex flex-col min-h-screen w-full lg:w-[calc(100%-16rem)]">
                
                {/* HEADER */}
                <header className="bg-white border-b border-kas-accent/30 p-4 lg:px-8 flex items-center justify-between sticky top-0 z-30">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden text-kas-dark p-1">
                            ☰
                        </button>
                        <h2 className="text-xl font-bold hidden sm:block">
                            {isSuperAdmin ? 'Dashboard Super Admin' : 'Dashboard Mitra'}
                        </h2>
                    </div>
                    
                    {/* TOPBAR KANAN: PROFIL DROPDOWN */}
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <button 
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="flex items-center gap-3 p-1 pr-3 bg-white rounded-full border border-gray-200 hover:border-kas-primary hover:shadow-sm transition-all outline-none"
                            >
                                <div className="w-10 h-10 rounded-full bg-kas-primary text-white flex items-center justify-center font-bold">
                                    {userData.initials}
                                </div>
                                <div className="text-left hidden sm:block">
                                    <p className="text-sm font-bold text-kas-dark leading-tight">{userData.name}</p>
                                    <p className="text-[10px] text-kas-soft font-bold uppercase tracking-wider">
                                        {isSuperAdmin ? 'System Admin' : 'Mitra Pengelola'}
                                    </p>
                                </div>
                                <span className="text-gray-400 text-xs ml-2 hidden sm:block">▼</span>
                            </button>

                            {/* Dropdown Menu */}
                            {isProfileOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-fade-in">
                                    <Link 
                                        to="/profile" 
                                        onClick={() => setIsProfileOpen(false)}
                                        className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-gray-700 hover:bg-kas-bg/50 hover:text-kas-primary transition-colors"
                                    >
                                        ⚙️ Pengaturan Profil
                                    </Link>
                                    <div className="border-t border-gray-100 my-1"></div>
                                    <button 
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 text-left px-5 py-3 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
                                    >
                                        🚪 Keluar (Logout)
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* KONTEN DINAMIS */}
                <main className="p-4 lg:p-8 flex-1 overflow-y-auto">
                    <Outlet /> 
                </main>

            </div>
        </div>
    );
}