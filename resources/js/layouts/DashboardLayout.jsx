import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

export default function DashboardLayout() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation(); // Untuk mendeteksi halaman aktif
    
    // Simulasi deteksi role dari URL (di dunia nyata ambil dari state/context)
    const isSuperAdmin = location.pathname.includes('/super-admin');

    // Menu dinamis berdasarkan role
    const menus = isSuperAdmin ? [
        { name: 'Overview', path: '/super-admin/dashboard', icon: '📊' },
        { name: 'Mitra List', path: '/super-admin/mitras', icon: '🏢' },
        { name: 'License Tiers', path: '/super-admin/license-tiers', icon: '🔑' },
        { name: 'System Logs', path: '/super-admin/system-logs', icon: '📝' },
        { name: 'Global Settings', path: '/super-admin/global-settings', icon: '⚙️' },
    ] : [
        { name: 'Dashboard', path: '/admin/dashboard', icon: '🏠' },
        { name: 'Tagihan (Bills)', path: '#', icon: '💸' },
        { name: 'Member Group', path: '/admin/groups', icon: '👥' },
        { name: 'Pengaturan WA', path: '#', icon: '🤖' },
    ];

    return (
        <div className="min-h-screen bg-kas-bg font-sans text-kas-dark flex">
            
            {/* SIDEBAR (Desktop: fixed, Mobile: hidden atau absolute) */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-kas-dark text-white transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:block`}>
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <Link to="/" className="text-2xl font-extrabold tracking-tight text-kas-accent">
                        Koleksi<span className="text-white">Kas.</span>
                    </Link>
                    {/* Tombol tutup sidebar di mobile */}
                    <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden text-white/70 hover:text-white text-xl">✕</button>
                </div>
                
                <div className="p-4">
                    <div className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4 px-3">
                        {isSuperAdmin ? 'Super Admin Panel' : 'Tenant Menu'}
                    </div>
                    <nav className="space-y-1">
                        {menus.map((menu, index) => (
                            <Link 
                                key={index} to={menu.path}
                                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${location.pathname === menu.path ? 'bg-kas-primary text-white font-bold' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
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
                    
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-kas-dark">Budi Santoso</p>
                            <p className="text-xs text-kas-soft font-semibold">{isSuperAdmin ? 'System Admin' : 'Futsal Jakarta'}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-kas-primary text-white flex items-center justify-center font-bold">
                            BS
                        </div>
                    </div>
                </header>

                {/* KONTEN DINAMIS (Halaman akan di-render di sini) */}
                <main className="p-4 lg:p-8 flex-1 overflow-y-auto">
                    <Outlet /> {/* <-- Ini keajaiban React Router (Nested Routes) */}
                </main>

            </div>
        </div>
    );
}