import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function SuperAdminDashboard() {
    const [stats, setStats] = useState({
        total_mitra: 0,
        total_member: 0,
        revenue: 0,
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
        }).format(number);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-black text-kas-dark tracking-tight">Overview Sistem</h2>
                    <p className="text-kas-soft text-sm mt-1">Pantau performa dan denyut nadi seluruh tenant KoleksiKas.</p>
                </div>
            </div>

            {/* Jika loading, tampilkan animasi skeleton sederhana */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-pulse">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-gray-100 h-32 rounded-2xl border border-gray-200"></div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Card 1 */}
                    <div className="bg-white p-6 rounded-2xl border border-kas-accent/30 shadow-sm border-l-4 border-l-kas-primary transition-transform hover:-translate-y-1">
                        <div className="text-kas-soft text-sm font-bold uppercase tracking-wider mb-2">Mitra Aktif</div>
                        <div className="flex items-end gap-3">
                            <span className="text-4xl font-black text-kas-dark">{stats.total_mitra}</span>
                            <span className="text-sm font-bold text-gray-400 mb-1">Klien</span>
                        </div>
                    </div>
                    
                    {/* Card 2 */}
                    <div className="bg-white p-6 rounded-2xl border border-kas-accent/30 shadow-sm border-l-4 border-l-green-500 transition-transform hover:-translate-y-1">
                        <div className="text-kas-soft text-sm font-bold uppercase tracking-wider mb-2">Total Member</div>
                        <div className="flex items-end gap-3">
                            <span className="text-4xl font-black text-kas-dark">{stats.total_member}</span>
                            <span className="text-sm font-bold text-gray-400 mb-1">Pengguna</span>
                        </div>
                    </div>
                    
                    {/* Card 3 */}
                    <div className="bg-white p-6 rounded-2xl border border-kas-accent/30 shadow-sm border-l-4 border-l-blue-500 transition-transform hover:-translate-y-1">
                        <div className="text-kas-soft text-sm font-bold uppercase tracking-wider mb-2">Total GMV (Sukses)</div>
                        <div className="text-2xl sm:text-3xl font-black text-kas-dark truncate" title={formatRupiah(stats.revenue)}>
                            {formatRupiah(stats.revenue)}
                        </div>
                    </div>
                    
                    {/* Card 4 */}
                    <Link to="/super-admin/mitras" className="bg-white p-6 rounded-2xl border border-kas-accent/30 shadow-sm border-l-4 border-l-yellow-500 transition-all hover:bg-yellow-50 hover:-translate-y-1 cursor-pointer block">
                        <div className="text-kas-soft text-sm font-bold uppercase tracking-wider mb-2">Pending Approval</div>
                        <div className="flex items-end gap-3">
                            <span className="text-4xl font-black text-kas-dark">{stats.pending_approval}</span>
                            <span className="text-sm font-bold text-yellow-600 mb-1">Menunggu</span>
                        </div>
                        {stats.pending_approval > 0 && (
                            <p className="text-xs text-yellow-600 mt-2 font-semibold">Ada pendaftar baru! Klik untuk review.</p>
                        )}
                    </Link>
                </div>
            )}
            
            <div className="bg-white p-6 rounded-2xl border border-kas-accent/30 shadow-sm min-h-[300px] flex flex-col justify-center items-center text-center">
                <div className="w-20 h-20 bg-kas-primary/10 rounded-full flex items-center justify-center mb-4 text-3xl">📈</div>
                <h3 className="text-xl font-black mb-2 text-kas-dark">Grafik Pertumbuhan</h3>
                <p className="text-gray-500 max-w-md">Data transaksi saat ini sedang dikumpulkan. Grafik visual akan otomatis aktif setelah volume transaksi mencapai ambang batas yang dapat dianalisis.</p>
            </div>
        </div>
    );
}