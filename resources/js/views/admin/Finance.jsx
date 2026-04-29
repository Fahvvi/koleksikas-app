import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

export default function Finance() {
    const [isLoading, setIsLoading] = useState(true);
    const [financeData, setFinanceData] = useState(null);
    const [activeTab, setActiveTab] = useState('revenue'); // 'revenue' atau 'payout'

    useEffect(() => {
        fetchFinanceData();
    }, []);

    const fetchFinanceData = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get('/api/v1/admin/finance');
            setFinanceData(response.data.data);
        } catch (error) {
            console.error("Gagal mengambil data keuangan", error);
            MySwal.fire('Error', 'Gagal memuat data keuangan.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const handleRequestPayout = async () => {
        // Cek jika rekening belum diatur
        if (!financeData.has_payout_config) {
            MySwal.fire({
                icon: 'warning',
                title: 'Rekening Belum Diatur!',
                text: 'Silakan atur rekening pencairan di menu Pengaturan terlebih dahulu.',
                confirmButtonText: 'Tutup',
                confirmButtonColor: '#3b82f6'
            });
            return;
        }

        // Cek jika saldo kosong
        if (financeData.summary.available_balance < 10000) {
            MySwal.fire('Saldo Kurang', 'Minimal penarikan dana adalah Rp 10.000', 'info');
            return;
        }

        // Tampilkan prompt input nominal
        const { value: amount, isConfirmed } = await MySwal.fire({
            title: 'Tarik Dana',
            html: `<p class="text-sm text-gray-500 mb-4">Saldo Tersedia: <b class="text-kas-primary text-lg">${formatRupiah(financeData.summary.available_balance)}</b></p>`,
            input: 'number',
            inputLabel: 'Nominal Penarikan (Rp)',
            inputPlaceholder: 'Contoh: 50000',
            showCancelButton: true,
            confirmButtonText: 'Ajukan Pencairan',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#f97316',
            inputValidator: (value) => {
                if (!value) return 'Nominal harus diisi!';
                if (value < 10000) return 'Minimal penarikan Rp 10.000!';
                if (value > financeData.summary.available_balance) return 'Saldo tidak mencukupi!';
            }
        });

        if (isConfirmed && amount) {
            MySwal.fire({ title: 'Memproses...', allowOutsideClick: false, didOpen: () => MySwal.showLoading() });
            
            try {
                const response = await axios.post('/api/v1/admin/finance/payout', { amount: amount });
                MySwal.fire('Berhasil!', response.data.message, 'success');
                fetchFinanceData(); // Refresh data saldo
            } catch (error) {
                MySwal.fire('Gagal!', error.response?.data?.message || 'Terjadi kesalahan sistem.', 'error');
            }
        }
    };

    if (isLoading) return <div className="p-10 text-center animate-pulse font-bold text-gray-500">Memuat Buku Kas...</div>;

    const { summary, payout_history, revenue_history } = financeData;

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 animate-fade-in">
            {/* --- HEADER & TOMBOL TARIK --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h2 className="text-3xl font-black text-gray-800">Keuangan Mitra</h2>
                    <p className="text-gray-500 text-sm mt-1">Pantau pendapatan Mabar dan kelola pencairan dana Anda.</p>
                </div>
                <button 
                    onClick={handleRequestPayout}
                    className="w-full md:w-auto py-3 px-6 bg-kas-primary hover:bg-kas-dark text-white rounded-xl font-black text-sm shadow-lg shadow-kas-primary/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    Tarik Dana Tersedia
                </button>
            </div>

            {/* --- WIDGET SALDO (4 KOTAK) --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-kas-dark text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full"></div>
                    <p className="text-xs font-bold text-gray-300 uppercase tracking-wider">Saldo Tersedia</p>
                    <h3 className="text-2xl font-black mt-2">{formatRupiah(summary.available_balance)}</h3>
                </div>
                <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Pendapatan</p>
                    <h3 className="text-xl font-black text-gray-800 mt-2">{formatRupiah(summary.total_revenue)}</h3>
                </div>
                <div className="bg-orange-50 border border-orange-100 p-6 rounded-3xl shadow-sm">
                    <p className="text-xs font-bold text-orange-400 uppercase tracking-wider">Dalam Proses Pencairan</p>
                    <h3 className="text-xl font-black text-orange-700 mt-2">{formatRupiah(summary.total_pending)}</h3>
                </div>
                <div className="bg-green-50 border border-green-100 p-6 rounded-3xl shadow-sm">
                    <p className="text-xs font-bold text-green-500 uppercase tracking-wider">Berhasil Dicairkan</p>
                    <h3 className="text-xl font-black text-green-700 mt-2">{formatRupiah(summary.total_withdrawn)}</h3>
                </div>
            </div>

            {/* --- TABEL RIWAYAT --- */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex border-b border-gray-100 bg-gray-50">
                    <button 
                        onClick={() => setActiveTab('revenue')} 
                        className={`flex-1 py-4 text-sm font-black transition-all ${activeTab === 'revenue' ? 'text-kas-primary border-b-2 border-kas-primary bg-white' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        ⬇️ Uang Masuk (Sesi Mabar)
                    </button>
                    <button 
                        onClick={() => setActiveTab('payout')} 
                        className={`flex-1 py-4 text-sm font-black transition-all ${activeTab === 'payout' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        ↗️ Uang Keluar (Pencairan)
                    </button>
                </div>

                <div className="p-0 overflow-x-auto">
                    {/* TAB: UANG MASUK */}
                    {activeTab === 'revenue' && (
                        <table className="w-full text-left border-collapse animate-fade-in">
                            <thead>
                                <tr className="bg-gray-50 text-xs text-gray-400 uppercase tracking-wider">
                                    <th className="p-4 font-bold">Waktu</th>
                                    <th className="p-4 font-bold">Member</th>
                                    <th className="p-4 font-bold">Keterangan</th>
                                    <th className="p-4 font-bold text-right">Nominal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {revenue_history.length > 0 ? revenue_history.map((trx) => (
                                    <tr key={trx.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4 text-xs font-medium text-gray-500">{formatDate(trx.created_at)}</td>
                                        <td className="p-4 font-bold text-gray-800 text-sm">{trx.user?.name || 'User Terhapus'}</td>
                                        <td className="p-4 text-xs font-medium text-gray-500">{trx.bill_item?.bill?.name || 'Iuran Sesi'}</td>
                                        <td className="p-4 font-black text-green-600 text-right">{formatRupiah(trx.amount)}</td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="4" className="p-8 text-center text-gray-400 font-bold text-sm">Belum ada transaksi masuk.</td></tr>
                                )}
                            </tbody>
                        </table>
                    )}

                    {/* TAB: PENCAIRAN */}
                    {activeTab === 'payout' && (
                        <table className="w-full text-left border-collapse animate-fade-in">
                            <thead>
                                <tr className="bg-gray-50 text-xs text-gray-400 uppercase tracking-wider">
                                    <th className="p-4 font-bold">Tanggal Request</th>
                                    <th className="p-4 font-bold">Tujuan Rekening</th>
                                    <th className="p-4 font-bold text-right">Nominal</th>
                                    <th className="p-4 font-bold text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {payout_history.length > 0 ? payout_history.map((payout) => (
                                    <tr key={payout.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4 text-xs font-medium text-gray-500">{formatDate(payout.created_at)}</td>
                                        <td className="p-4">
                                            <p className="font-bold text-gray-800 text-sm">{payout.bank_name} - {payout.account_number}</p>
                                            <p className="text-[10px] text-gray-400 uppercase">A.N {payout.account_holder}</p>
                                        </td>
                                        <td className="p-4 font-black text-gray-800 text-right">{formatRupiah(payout.amount)}</td>
                                        <td className="p-4 text-center">
                                            {payout.status === 'pending' && <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-[10px] font-black uppercase">Pending</span>}
                                            {payout.status === 'processing' && <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-[10px] font-black uppercase">Diproses</span>}
                                            {payout.status === 'completed' && <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-[10px] font-black uppercase">Selesai</span>}
                                            {payout.status === 'rejected' && <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-[10px] font-black uppercase" title={payout.notes}>Ditolak</span>}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="4" className="p-8 text-center text-gray-400 font-bold text-sm">Belum ada riwayat penarikan dana.</td></tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}