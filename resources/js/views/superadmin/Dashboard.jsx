import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function SuperAdminDashboard() {
    const [stats, setStats] = useState({
        total_mitra: 0,
        total_member: 0,
        gmv: 0,
        platform_revenue: 0,
        pending_approval: 0
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchOverview = async () => {
            try {
                const response = await axios.get('/api/v1/super-admin/overview');
                if (response.data && response.data.data) {
                    setStats(response.data.data);
                }
            } catch (error) {
                console.error("Gagal mengambil data overview", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchOverview();
    }, []);

    // Format Rupiah
    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(number || 0);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-end mb-4">
                <div>
                    <h2 className="text-3xl font-black text-kas-dark tracking-tight">Overview Sistem</h2>
                    <p className="text-kas-soft text-sm mt-1">Pantau performa finansial dan denyut nadi seluruh ekosistem KoleksiKas.</p>
                </div>
            </div>

            {isLoading ? (
                <div className="space-y-6 animate-pulse">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-200 h-40 rounded-3xl"></div>
                        <div className="bg-gray-200 h-40 rounded-3xl"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => <div key={i} className="bg-gray-100 h-32 rounded-2xl"></div>)}
                    </div>
                </div>
            ) : (
                <>
                    {/* --- KARTU FINANSIAL UTAMA (Highlight) --- */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* GMV Card */}
                        <div className="bg-gradient-to-br from-gray-800 to-black p-8 rounded-[2rem] shadow-2xl relative overflow-hidden transition-transform hover:-translate-y-1 hover:shadow-gray-900/30 text-white">
                            <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
                            <div className="relative z-10">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-gray-400 font-bold uppercase tracking-widest text-xs">Total GMV Ekosistem</h3>
                                    <span className="p-2 bg-white/10 rounded-xl">🌐</span>
                                </div>
                                <div className="text-3xl md:text-5xl font-black truncate" title={formatRupiah(stats.gmv)}>
                                    {formatRupiah(stats.gmv)}
                                </div>
                                <p className="text-gray-400 text-xs mt-3 font-medium">Total perputaran uang seluruh komunitas.</p>
                            </div>
                        </div>

                        {/* Platform Revenue Card */}
                        <div className="bg-gradient-to-br from-kas-primary to-kas-dark p-8 rounded-[2rem] shadow-2xl shadow-kas-primary/20 relative overflow-hidden transition-transform hover:-translate-y-1 text-white flex flex-col justify-between">
                            <div className="absolute -left-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                            
                            <div className="relative z-10">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-kas-accent/90 font-bold uppercase tracking-widest text-xs">Total Pendapatan Bersih</h3>
                                    <span className="p-2 bg-white/10 rounded-xl text-lg shadow-sm">💎</span>
                                </div>
                                <div className="text-4xl md:text-5xl font-black text-white truncate drop-shadow-md" title={formatRupiah(stats.platform_revenue)}>
                                    {formatRupiah(stats.platform_revenue)}
                                </div>
                            </div>

                            {/* 👇 BREAKDOWN PENDAPATAN DITAMBAHKAN DI SINI 👇 */}
                            <div className="relative z-10 mt-6 pt-5 border-t border-white/10 grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] font-bold text-kas-accent/70 uppercase tracking-wider mb-1">Dari Lisensi B2B</p>
                                    <p className="text-lg font-bold text-white">{formatRupiah(stats.revenue_breakdown?.license)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-kas-accent/70 uppercase tracking-wider mb-1">Dari Platform Fee</p>
                                    <p className="text-lg font-bold text-white">{formatRupiah(stats.revenue_breakdown?.fees)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- KARTU METRIK OPERASIONAL --- */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        
                        {/* Mitra Aktif */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between transition-all hover:border-kas-primary/30 hover:shadow-md">
                            <div>
                                <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Mitra Aktif</div>
                                <div className="text-3xl font-black text-kas-dark">{stats.total_mitra}</div>
                            </div>
                            <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center text-2xl">🏢</div>
                        </div>
                        
                        {/* Total Member */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between transition-all hover:border-kas-primary/30 hover:shadow-md">
                            <div>
                                <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Total Pengguna</div>
                                <div className="text-3xl font-black text-kas-dark">{stats.total_member}</div>
                            </div>
                            <div className="w-12 h-12 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center text-2xl">👥</div>
                        </div>
                        
                        {/* Pending Approval */}
                        <Link to="/super-admin/mitras" className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between transition-all hover:bg-orange-50 hover:border-orange-200 hover:shadow-md cursor-pointer group">
                            <div>
                                <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1 group-hover:text-orange-500">Antrean Mitra Baru</div>
                                <div className="text-3xl font-black text-orange-500">{stats.pending_approval}</div>
                                {stats.pending_approval > 0 && (
                                    <p className="text-[10px] text-orange-600 mt-1 font-bold">Klik untuk tinjau pendaftar</p>
                                )}
                            </div>
                            <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-white group-hover:shadow-sm transition-all">⏳</div>
                        </Link>
                        
                    </div>
                </>
            )}
            
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm min-h-[300px] flex flex-col justify-center items-center text-center mt-6">
                <div className="w-20 h-20 bg-kas-primary/5 rounded-full flex items-center justify-center mb-4 text-3xl">📊</div>
                <h3 className="text-xl font-black mb-2 text-kas-dark">Grafik Pertumbuhan Ekosistem</h3>
                <p className="text-gray-500 max-w-md text-sm font-medium">Data transaksi saat ini sedang dikumpulkan. Grafik visual akan otomatis aktif setelah volume transaksi mencapai ambang batas yang dapat dianalisis.</p>
            </div>
        </div>
    );
}