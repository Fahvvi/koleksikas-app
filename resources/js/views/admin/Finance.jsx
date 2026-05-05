import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

export default function Finance() {
    const [isLoading, setIsLoading] = useState(true);
    const [financeData, setFinanceData] = useState(null);
    const [activeTab, setActiveTab] = useState('revenue');
    
    const [filterType, setFilterType] = useState('month'); 
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

    const handleRequestPayout = async () => {
        if (!financeData.has_payout_config) {
            MySwal.fire({
                icon: 'warning',
                title: 'Rekening Belum Diatur',
                text: 'Anda harus mengatur rekening pencairan di menu Pengaturan terlebih dahulu.'
            });
            return;
        }

        const { value: amount } = await MySwal.fire({
            title: 'Tarik Dana',
            input: 'number',
            inputLabel: `Maksimal Penarikan: ${formatRupiah(financeData.summary.available_balance)}`,
            inputPlaceholder: 'Contoh: 100000',
            inputAttributes: {
                min: 10000,
                max: financeData.summary.available_balance,
                step: 1000
            },
            showCancelButton: true,
            confirmButtonText: 'Ajukan Penarikan',
            cancelButtonText: 'Batal',
            inputValidator: (value) => {
                if (!value) return 'Anda harus memasukkan nominal!';
                if (value < 10000) return 'Minimal penarikan adalah Rp 10.000!';
                if (value > financeData.summary.available_balance) return 'Nominal melebihi saldo tersedia!';
            }
        });

        if (amount) {
            try {
                MySwal.fire({ title: 'Memproses...', allowOutsideClick: false, didOpen: () => MySwal.showLoading() });
                const response = await axios.post('/api/v1/admin/finance/payout', { amount: parseFloat(amount) });
                MySwal.fire('Berhasil!', response.data.message, 'success');
                fetchFinanceData(); 
            } catch (error) {
                MySwal.fire('Gagal!', error.response?.data?.message || 'Terjadi kesalahan.', 'error');
            }
        }
    };

    const getStatusBadge = (status) => {
        switch(status) {
            case 'completed': return <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-[10px] font-black uppercase">Selesai</span>;
            case 'pending': return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-[10px] font-black uppercase">Pending</span>;
            case 'processing': return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-[10px] font-black uppercase">Diproses</span>;
            case 'rejected': return <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-[10px] font-black uppercase">Ditolak</span>;
            default: return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-[10px] font-black uppercase">{status}</span>;
        }
    };

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
                    <button onClick={handleRequestPayout} disabled={summary.available_balance < 10000} className="w-full md:w-auto py-3 px-6 bg-kas-primary hover:bg-kas-dark transition-all text-white rounded-xl font-bold shadow-lg shadow-kas-primary/20 disabled:opacity-50 disabled:cursor-not-allowed">
                        Tarik Dana
                    </button>
                )}
            </div>

            <div className={`grid grid-cols-1 md:grid-cols-2 ${isKoleksiKas ? 'lg:grid-cols-4' : 'lg:grid-cols-2'} gap-4`}>
                {isKoleksiKas && (
                    <div className="bg-kas-dark text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
                        <p className="text-xs font-bold text-gray-300 uppercase relative z-10">Saldo Tersedia</p>
                        <h3 className="text-2xl font-black mt-2 relative z-10">{formatRupiah(summary.available_balance)}</h3>
                    </div>
                )}
                <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm">
                    <p className="text-xs font-bold text-gray-400 uppercase">Total Pendapatan Bersih (Netto)</p>
                    <h3 className="text-xl font-black text-gray-800 mt-2">{formatRupiah(summary.total_revenue)}</h3>
                </div>
                {isKoleksiKas && (
                    <>
                        <div className="bg-orange-50 p-6 rounded-3xl shadow-sm border border-orange-100/50">
                            <p className="text-xs font-bold text-orange-400 uppercase">Dalam Proses</p>
                            <h3 className="text-xl font-black text-orange-700 mt-2">{formatRupiah(summary.total_pending)}</h3>
                        </div>
                        <div className="bg-green-50 p-6 rounded-3xl shadow-sm border border-green-100/50">
                            <p className="text-xs font-bold text-green-500 uppercase">Sudah Dicairkan</p>
                            <h3 className="text-xl font-black text-green-700 mt-2">{formatRupiah(summary.total_withdrawn)}</h3>
                        </div>
                    </>
                )}
            </div>

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
                                <select value={filters.month} onChange={e => setFilters({...filters, month: parseInt(e.target.value)})} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none focus:border-kas-primary">
                                    {['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'].map((m, i) => (
                                        <option key={i} value={i+1}>{m}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex-1 min-w-[150px]">
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Tahun</label>
                                <select value={filters.year} onChange={e => setFilters({...filters, year: parseInt(e.target.value)})} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none focus:border-kas-primary">
                                    {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex-1 min-w-[150px]">
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Dari Tanggal</label>
                                <input type="date" value={filters.start_date} onChange={e => setFilters({...filters, start_date: e.target.value})} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none focus:border-kas-primary" />
                            </div>
                            <div className="flex-1 min-w-[150px]">
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Sampai Tanggal</label>
                                <input type="date" value={filters.end_date} onChange={e => setFilters({...filters, end_date: e.target.value})} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none focus:border-kas-primary" />
                            </div>
                        </>
                    )}
                    <div className="bg-kas-primary/10 py-2.5 px-5 rounded-xl border border-kas-primary/20">
                        <p className="text-[10px] font-bold text-kas-primary uppercase">Total Bersih Periode Ini</p>
                        <p className="font-black text-kas-primary text-lg leading-none">{formatRupiah(summary.filtered_revenue)}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex border-b border-gray-100 bg-gray-50">
                    <button onClick={() => setActiveTab('revenue')} className={`flex-1 py-4 text-sm font-black transition-all ${activeTab === 'revenue' ? 'text-kas-primary border-b-2 border-kas-primary bg-white' : 'text-gray-400 hover:text-gray-600'}`}>⬇️ Riwayat Uang Masuk</button>
                    {isKoleksiKas && (
                        <button onClick={() => setActiveTab('payout')} className={`flex-1 py-4 text-sm font-black transition-all ${activeTab === 'payout' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-gray-400 hover:text-gray-600'}`}>↗️ Riwayat Penarikan</button>
                    )}
                </div>

                <div className="p-0 overflow-x-auto">
                    {activeTab === 'revenue' ? (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 text-[10px] text-gray-400 uppercase font-bold">
                                    <th className="p-5">Waktu</th>
                                    <th className="p-5">Member</th>
                                    <th className="p-5">Sesi/Tagihan</th>
                                    <th className="p-5 text-right">Nominal (Netto)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {revenue_history.length > 0 ? revenue_history.map(trx => (
                                    <tr key={trx.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-5 text-xs font-medium text-gray-500">
                                            {new Date(trx.created_at).toLocaleString('id-ID', {
                                                day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </td>
                                        <td className="p-5 font-bold text-gray-800 text-sm">
                                            {trx.user?.name || 'User Terhapus'}
                                        </td>
                                        <td className="p-5">
                                            <p className="text-xs text-gray-700 font-bold">
                                                {trx.bill_item?.bill?.name || 'Iuran Sesi'}
                                            </p>
                                            <span className={`inline-block mt-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                                                trx.gateway_name === 'KoleksiKAS Gateway' ? 'bg-kas-primary/10 text-kas-primary' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                                {trx.gateway_name}
                                            </span>
                                        </td>
                                        <td className="p-5 text-right">
                                            {/* 👇 TAMPILAN NOMINAL NETTO & INFO FEE 👇 */}
                                            <div className="font-black text-green-600 text-base">{formatRupiah(trx.net_amount)}</div>
                                            {trx.platform_fee > 0 && (
                                                <div className="text-[10px] text-gray-400 font-bold mt-0.5">
                                                    (Dipotong Fee {formatRupiah(trx.platform_fee)})
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="4" className="p-12 text-center text-gray-400 font-bold">Tidak ada transaksi ditemukan.</td></tr>
                                )}
                            </tbody>
                        </table>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 text-[10px] text-gray-400 uppercase font-bold">
                                    <th className="p-5">Tanggal Pengajuan</th>
                                    <th className="p-5">Bank Tujuan</th>
                                    <th className="p-5">Status</th>
                                    <th className="p-5 text-right">Nominal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {payout_history && payout_history.length > 0 ? payout_history.map(payout => (
                                    <tr key={payout.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-5 text-xs font-medium text-gray-500">
                                            {new Date(payout.created_at).toLocaleString('id-ID', {
                                                day: '2-digit', month: 'short', year: 'numeric'
                                            })}
                                        </td>
                                        <td className="p-5">
                                            <p className="text-sm font-bold text-gray-800 uppercase">{payout.bank_name}</p>
                                            <p className="text-xs text-gray-500 font-mono mt-0.5">{payout.account_number} - {payout.account_holder}</p>
                                        </td>
                                        <td className="p-5">
                                            {getStatusBadge(payout.status)}
                                        </td>
                                        <td className="p-5 font-black text-gray-800 text-right text-base">
                                            {formatRupiah(payout.amount)}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="4" className="p-12 text-center text-gray-400 font-bold">Belum ada riwayat penarikan dana.</td></tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}