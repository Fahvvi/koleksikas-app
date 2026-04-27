import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        current_tier: 'Memuat...',
        total_groups: 0,
        active_sessions: 0,
        revenue: 0,
        upcoming_sessions: []
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchOverview = async () => {
            try {
                const response = await axios.get('/api/v1/admin/overview');
                if (response.data && response.data.data) {
                    setStats(response.data.data);
                }
            } catch (error) {
                console.error("Gagal mengambil data dashboard admin", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchOverview();
    }, []);

    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-kas-dark tracking-tight">Dashboard Komunitas</h2>
                    <p className="text-kas-soft text-sm mt-1">Kelola jadwal main, grup, dan pemasukan komunitas Anda.</p>
                    {!isLoading && (
                            <span className="px-3 py-1 bg-kas-primary/10 text-kas-primary border border-kas-primary/20 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                                💎 Paket {stats.current_tier}
                            </span>
                        )}
                </div>
                <Link to="/admin/sessions/create" className="px-6 py-3 bg-kas-primary hover:bg-kas-dark text-white rounded-xl font-bold shadow-lg shadow-kas-primary/30 transition-all active:scale-95 flex items-center justify-center gap-2">
                    <span className="text-lg leading-none">+</span> Buat Sesi Baru
                </Link>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link to="/admin/groups" className="bg-white p-6 rounded-2xl border border-kas-accent/30 shadow-sm border-l-4 border-l-kas-primary transition-transform hover:-translate-y-1 block cursor-pointer">
                    <div className="text-kas-soft text-sm font-bold uppercase tracking-wider mb-2">Total Grup</div>
                    <div className="flex items-end gap-3">
                        <span className="text-4xl font-black text-kas-dark">{stats.total_groups}</span>
                        <span className="text-sm font-bold text-gray-400 mb-1">Grup Aktif</span>
                    </div>
                </Link>
                
                <Link to="/admin/sessions" className="bg-white p-6 rounded-2xl border border-kas-accent/30 shadow-sm border-l-4 border-l-blue-500 transition-transform hover:-translate-y-1 block cursor-pointer">
                    <div className="text-kas-soft text-sm font-bold uppercase tracking-wider mb-2">Jadwal Main (Sesi)</div>
                    <div className="flex items-end gap-3">
                        <span className="text-4xl font-black text-kas-dark">{stats.active_sessions}</span>
                        <span className="text-sm font-bold text-blue-500 mb-1">Berjalan</span>
                    </div>
                </Link>
                
                <Link to="/admin/transactions" className="bg-white p-6 rounded-2xl border border-kas-accent/30 shadow-sm border-l-4 border-l-green-500 transition-transform hover:-translate-y-1 block cursor-pointer">
                    <div className="text-kas-soft text-sm font-bold uppercase tracking-wider mb-2">Total Pendapatan</div>
                    <div className="text-2xl sm:text-3xl font-black text-green-600 truncate" title={formatRupiah(stats.revenue)}>
                        {formatRupiah(stats.revenue)}
                    </div>
                </Link>
            </div>

            {/* Sesi Terdekat (Upcoming Sessions) */}
            <div className="bg-white rounded-2xl border border-kas-accent/30 shadow-sm overflow-hidden flex flex-col">
                <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 text-lg">📅 Sesi Terdekat (Upcoming)</h3>
                    <Link to="/admin/sessions" className="text-sm font-bold text-kas-primary hover:underline">Lihat Semua →</Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-white text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                            <tr>
                                <th className="py-4 px-6 font-bold">Nama Sesi & Grup</th>
                                <th className="py-4 px-6 font-bold">Jadwal</th>
                                <th className="py-4 px-6 font-bold">Lokasi</th>
                                <th className="py-4 px-6 font-bold text-center">Tipe</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {isLoading ? (
                                <tr><td colSpan="4" className="py-10 text-center text-gray-500">Memuat jadwal...</td></tr>
                            ) : stats.upcoming_sessions.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="py-12 text-center flex flex-col items-center justify-center">
                                        <span className="text-4xl mb-3">⚽</span>
                                        <p className="text-kas-dark font-bold text-lg">Belum ada jadwal main</p>
                                        <p className="text-gray-400 text-sm mt-1">Buat sesi baru untuk mulai mengundang peserta.</p>
                                    </td>
                                </tr>
                            ) : stats.upcoming_sessions.map((session) => (
                                <tr key={session.id} className="border-b border-gray-50 hover:bg-kas-bg/30 transition-colors">
                                    <td className="py-4 px-6">
                                        <div className="font-bold text-kas-dark text-base">{session.name}</div>
                                        <div className="text-xs text-kas-primary font-bold mt-0.5">{session.group?.name}</div>
                                    </td>
                                    <td className="py-4 px-6 text-gray-700 font-medium">
                                        {formatDate(session.scheduled_at)}
                                    </td>
                                    <td className="py-4 px-6 text-gray-600">
                                        📍 {session.location}
                                    </td>
                                    <td className="py-4 px-6 text-center">
                                        {session.is_public ? (
                                            <span className="px-3 py-1 bg-purple-100 text-purple-700 border border-purple-200 rounded-full text-xs font-bold">🌐 Publik</span>
                                        ) : (
                                            <span className="px-3 py-1 bg-gray-100 text-gray-700 border border-gray-200 rounded-full text-xs font-bold">🔒 Private</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}