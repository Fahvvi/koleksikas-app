import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

export default function Finance() {
    const [isLoading, setIsLoading] = useState(true);
    const [financeData, setFinanceData] = useState(null);
    const [activeTab, setActiveTab] = useState('revenue');
    
    // State Filter
    const [filterType, setFilterType] = useState('month'); // 'month' atau 'range'
    const [filters, setFilters] = useState({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        start_date: '',
        end_date: ''
    });

    useEffect(() => {
        fetchFinanceData();
    }, [filters.month, filters.year, filters.start_date, filters.end_date]);

    const fetchFinanceData = async () => {
        setIsLoading(true);
        try {
            const params = filterType === 'month' 
                ? { month: filters.month, year: filters.year }
                : { start_date: filters.start_date, end_date: filters.end_date };

            const response = await axios.get('/api/v1/admin/finance', { params });
            setFinanceData(response.data.data);
        } catch (error) {
            console.error("Gagal memuat data", error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatRupiah = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);

    if (isLoading && !financeData) return <div className="p-10 text-center animate-pulse font-bold text-gray-500">Memuat Data...</div>;

    const { summary, payout_history, revenue_history, payment_type } = financeData;
    const isKoleksiKas = payment_type === 'koleksikas';

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h2 className="text-3xl font-black text-gray-800">Keuangan Mitra</h2>
                    <p className="text-gray-500 text-sm mt-1">
                        Metode: <span className="font-bold text-kas-primary uppercase">{payment_type.replace('_', ' ')}</span>
                    </p>
                </div>
                {isKoleksiKas && (
                    <button onClick={() => {/* handleRequestPayout logic */}} className="w-full md:w-auto py-3 px-6 bg-kas-primary text-white rounded-xl font-bold shadow-lg shadow-kas-primary/20">
                        Tarik Dana
                    </button>
                )}
            </div>

            {/* WIDGET SALDO */}
            <div className={`grid grid-cols-1 md:grid-cols-2 ${isKoleksiKas ? 'lg:grid-cols-4' : 'lg:grid-cols-2'} gap-4`}>
                {isKoleksiKas && (
                    <div className="bg-kas-dark text-white p-6 rounded-3xl shadow-lg">
                        <p className="text-xs font-bold text-gray-300 uppercase">Saldo Tersedia</p>
                        <h3 className="text-2xl font-black mt-2">{formatRupiah(summary.available_balance)}</h3>
                    </div>
                )}
                <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm">
                    <p className="text-xs font-bold text-gray-400 uppercase">Total Pendapatan (All Time)</p>
                    <h3 className="text-xl font-black text-gray-800 mt-2">{formatRupiah(summary.total_revenue)}</h3>
                </div>
                {isKoleksiKas && (
                    <>
                        <div className="bg-orange-50 p-6 rounded-3xl shadow-sm">
                            <p className="text-xs font-bold text-orange-400 uppercase">Dalam Proses</p>
                            <h3 className="text-xl font-black text-orange-700 mt-2">{formatRupiah(summary.total_pending)}</h3>
                        </div>
                        <div className="bg-green-50 p-6 rounded-3xl shadow-sm">
                            <p className="text-xs font-bold text-green-500 uppercase">Sudah Dicairkan</p>
                            <h3 className="text-xl font-black text-green-700 mt-2">{formatRupiah(summary.total_withdrawn)}</h3>
                        </div>
                    </>
                )}
            </div>

            {/* FILTER SECTION */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center gap-4 border-b border-gray-50 pb-4">
                    <button onClick={() => setFilterType('month')} className={`text-sm font-bold ${filterType === 'month' ? 'text-kas-primary' : 'text-gray-400'}`}>Per Bulan</button>
                    <button onClick={() => setFilterType('range')} className={`text-sm font-bold ${filterType === 'range' ? 'text-kas-primary' : 'text-gray-400'}`}>Rentang Tanggal</button>
                </div>
                
                <div className="flex flex-wrap gap-4 items-end">
                    {filterType === 'month' ? (
                        <>
                            <div className="flex-1 min-w-[150px]">
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Bulan</label>
                                <select value={filters.month} onChange={e => setFilters({...filters, month: e.target.value})} className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg font-bold">
                                    {['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'].map((m, i) => (
                                        <option key={i} value={i+1}>{m}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex-1 min-w-[150px]">
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Tahun</label>
                                <select value={filters.year} onChange={e => setFilters({...filters, year: e.target.value})} className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg font-bold">
                                    {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex-1 min-w-[150px]">
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Dari Tanggal</label>
                                <input type="date" value={filters.start_date} onChange={e => setFilters({...filters, start_date: e.target.value})} className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg font-bold" />
                            </div>
                            <div className="flex-1 min-w-[150px]">
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Sampai Tanggal</label>
                                <input type="date" value={filters.end_date} onChange={e => setFilters({...filters, end_date: e.target.value})} className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg font-bold" />
                            </div>
                        </>
                    )}
                    <div className="bg-kas-primary/10 p-2 px-4 rounded-xl">
                        <p className="text-[10px] font-bold text-kas-primary uppercase">Total Periode Ini</p>
                        <p className="font-black text-kas-primary">{formatRupiah(summary.filtered_revenue)}</p>
                    </div>
                </div>
            </div>

            {/* TABEL RIWAYAT */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex border-b border-gray-100 bg-gray-50">
                    <button onClick={() => setActiveTab('revenue')} className={`flex-1 py-4 text-sm font-black ${activeTab === 'revenue' ? 'text-kas-primary border-b-2 border-kas-primary bg-white' : 'text-gray-400'}`}>⬇️ Uang Masuk</button>
                    {isKoleksiKas && (
                        <button onClick={() => setActiveTab('payout')} className={`flex-1 py-4 text-sm font-black ${activeTab === 'payout' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-gray-400'}`}>↗️ Riwayat Tarik Dana</button>
                    )}
                </div>

                <div className="p-0 overflow-x-auto">
                    {activeTab === 'revenue' ? (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 text-[10px] text-gray-400 uppercase font-bold">
                                    <th className="p-4">Waktu</th>
                                    <th className="p-4">Member</th>
                                    <th className="p-4">Sesi</th>
                                    <th className="p-4 text-right">Nominal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {revenue_history.length > 0 ? revenue_history.map(trx => (
                                    <tr key={trx.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4 text-xs font-medium text-gray-500">
                                            {new Date(trx.created_at).toLocaleString('id-ID', {
                                                day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </td>
                                        <td className="p-4 font-bold text-gray-800 text-sm">
                                            {trx.user?.name || 'User Terhapus'}
                                        </td>
                                        <td className="p-4">
                                            <p className="text-xs text-gray-700 font-bold">
                                                {trx.bill_item?.bill?.name || 'Iuran Sesi'}
                                            </p>
                                            {/* 👇 BADGE SUMBER GATEWAY 👇 */}
                                            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                                trx.gateway_name === 'KoleksiKAS Gateway' 
                                                ? 'bg-kas-primary/10 text-kas-primary' 
                                                : 'bg-blue-100 text-blue-700'
                                            }`}>
                                                {trx.gateway_name}
                                            </span>
                                        </td>
                                        <td className="p-4 font-black text-green-600 text-right">
                                            {formatRupiah(trx.amount)}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="4" className="p-10 text-center text-gray-400 font-bold">Tidak ada transaksi ditemukan.</td></tr>
                                )}
                            </tbody>
                        </table>
                    ) : (
                        /* Payout History Table (Logic-nya sama seperti sebelumnya) */
                        <div className="p-10 text-center text-gray-400 italic">Riwayat Pencairan...</div>
                    )}
                </div>
            </div>
        </div>
    );
}