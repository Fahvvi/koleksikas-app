import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

// ========================================================
// 1. KOMPONEN NOTIFIKASI (Ditambahkan di file yang sama)
// ========================================================
const NotificationBell = () => {
    const [notifs, setNotifs] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    const fetchNotifs = async () => {
        try {
            const res = await axios.get('/api/v1/notifications');
            setNotifs(res.data.notifications || []);
            setUnreadCount(res.data.unread_count || 0);
        } catch (e) {
            console.error("Gagal mengambil notifikasi", e);
        }
    };

    useEffect(() => {
        fetchNotifs();
        // Cek notifikasi baru setiap 30 detik secara otomatis
        const interval = setInterval(fetchNotifs, 30000);
        return () => clearInterval(interval);
    }, []);

    const markRead = async () => {
        setIsOpen(!isOpen);
        // Jika dibuka dan ada yang belum dibaca, tandai sudah dibaca di database
        if (unreadCount > 0 && !isOpen) {
            try {
                await axios.post('/api/v1/notifications/mark-read');
                setUnreadCount(0);
            } catch (e) {
                console.error("Gagal menandai notifikasi", e);
            }
        }
    };

    return (
        <div className="relative">
            <button 
                onClick={markRead} 
                className="p-2 w-10 h-10 bg-white rounded-full relative hover:bg-gray-50 transition-all outline-none border border-gray-200 flex items-center justify-center shadow-sm"
            >
                <span className="text-xl leading-none">🔔</span>
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-bounce shadow-sm">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-[2rem] shadow-2xl border border-gray-100 z-[100] overflow-hidden animate-slide-up origin-top-right">
                    <div className="p-5 border-b border-gray-50 flex justify-between items-center bg-kas-bg/80 backdrop-blur-md">
                        <h4 className="font-black text-kas-dark text-sm">Notifikasi</h4>
                        {unreadCount > 0 && (
                            <span className="text-[10px] font-bold text-kas-primary bg-kas-primary/10 px-2 py-1 rounded-lg">Baru</span>
                        )}
                    </div>
                    <div className="max-h-[25rem] overflow-y-auto divide-y divide-gray-50">
                        {notifs.length > 0 ? notifs.map(n => (
                            <div key={n.id} className={`p-5 hover:bg-gray-50 transition-colors ${!n.read_at ? 'bg-blue-50/40' : ''}`}>
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-white shadow-sm border border-gray-100 flex flex-shrink-0 items-center justify-center text-xl">
                                        {n.data?.icon || '📩'}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-800">{n.data?.title || 'Pemberitahuan Sistem'}</p>
                                        <p className="text-[11px] text-gray-500 leading-relaxed mt-1.5">{n.data?.message || 'Ada pembaruan untuk Anda.'}</p>
                                        <p className="text-[9px] text-gray-400 mt-2 font-bold uppercase tracking-wider">
                                            {new Date(n.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="p-10 text-center flex flex-col items-center justify-center gap-2">
                                <span className="text-4xl opacity-30">📭</span>
                                <p className="text-gray-400 text-xs font-bold">Belum ada notifikasi.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// ========================================================
// 2. LAYOUT UTAMA DASHBOARD
// ========================================================
export default function DashboardLayout() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    
    const [userData, setUserData] = useState({ name: 'Memuat...', initials: '?', role: null });
    
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        axios.get('/api/v1/user/profile')
            .then(res => {
                if(res.data && res.data.data) {
                    const { name, role } = res.data.data;
                    const initials = name.substring(0, 2).toUpperCase(); 
                    setUserData({ name, initials, role });
                }
            })
            .catch(err => console.error("Gagal mengambil data user", err));
    }, []);

    const isSuperAdmin = location.pathname.includes('/super-admin') || userData.role === 'super_admin';

    const menus = isSuperAdmin ? [
        { name: 'Overview', path: '/super-admin/dashboard'},
        { name: 'Mitra List', path: '/super-admin/mitras'},
        { name: 'License Tiers', path: '/super-admin/license-tiers'},
        { name: 'Payouts', path: '/super-admin/payout'},
        { name: 'System Logs', path: '/super-admin/system-logs'},
        { name: 'Global Settings', path: '/super-admin/global-settings'},
    ] : [
        { name: 'Dashboard', path: '/admin/dashboard' },
        { name: 'Sesi', path: '/admin/sessions'},
        { name: 'Tagihan (Bills)', path: '/admin/billing' },
        { name: 'Member Group', path: '/admin/groups' },
        { name: 'Finance & Transaksi', path: '/admin/finance'},
        { name: 'Pengaturan', path: '/admin/settings'},
    ];

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
                    
                    {/* TOPBAR KANAN: NOTIFIKASI & PROFIL */}
                    <div className="flex items-center gap-3 md:gap-5">
                        
                        {/* 👇 TOMBOL LONCENG NOTIFIKASI DISINI 👇 */}
                        <NotificationBell />

                        <div className="relative">
                            <button 
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="flex items-center gap-3 p-1 pr-3 bg-white rounded-full border border-gray-200 hover:border-kas-primary hover:shadow-sm transition-all outline-none"
                            >
                                <div className="w-10 h-10 rounded-full bg-kas-primary text-white flex items-center justify-center font-bold shadow-inner">
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

                            {/* Dropdown Menu Profil */}
                            {isProfileOpen && (
                                <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-fade-in origin-top-right">
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
                <main className="p-4 lg:p-8 flex-1 overflow-y-auto bg-kas-bg/30">
                    <Outlet /> 
                </main>

            </div>
        </div>
    );
}