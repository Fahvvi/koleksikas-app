import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

export default function SuperAdminPayouts() {
    const [payouts, setPayouts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get('/api/v1/super-admin/payouts');
            setPayouts(response.data.data || []);
        } catch (error) {
            console.error("Gagal load payouts", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const formatRupiah = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);

    const handleProcess = async (id) => {
        try {
            await axios.put(`/api/v1/super-admin/payouts/${id}/process`);
            MySwal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, icon: 'success', title: 'Status diubah ke Diproses' });
            fetchData();
        } catch (error) {
            MySwal.fire('Gagal', error.response?.data?.message || 'Terjadi kesalahan', 'error');
        }
    };

    const handleComplete = async (id) => {
        MySwal.fire({
            title: 'Selesaikan Pencairan?',
            text: "Sistem akan mengirim notifikasi WhatsApp otomatis ke Admin Mitra.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#25D366',
            confirmButtonText: 'Ya, Selesaikan & Kirim WA!',
            cancelButtonText: 'Batal'
        }).then(async (result) => {
            if (result.isConfirmed) {
                MySwal.fire({ title: 'Memproses...', text: 'Mengirim WA...', allowOutsideClick: false, didOpen: () => MySwal.showLoading() });
                try {
                    const response = await axios.put(`/api/v1/super-admin/payouts/${id}/complete`);
                    MySwal.fire('Berhasil!', response.data.message, 'success');
                    fetchData();
                } catch (error) {
                    MySwal.fire('Gagal', error.response?.data?.message || 'Terjadi kesalahan', 'error');
                }
            }
        });
    };

    const handleReject = async (id) => {
        const { value: reason } = await MySwal.fire({
            title: 'Tolak Pencairan',
            input: 'text',
            inputLabel: 'Alasan penolakan (akan dikirim via WA ke Mitra)',
            inputPlaceholder: 'Misal: Nomor rekening tidak valid',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Tolak & Kirim WA',
            inputValidator: (value) => {
                if (!value) return 'Alasan harus diisi!'
            }
        });

        if (reason) {
            MySwal.fire({ title: 'Memproses...', allowOutsideClick: false, didOpen: () => MySwal.showLoading() });
            try {
                const response = await axios.put(`/api/v1/super-admin/payouts/${id}/reject`, { reason });
                MySwal.fire('Ditolak!', response.data.message, 'success');
                fetchData();
            } catch (error) {
                MySwal.fire('Gagal', 'Terjadi kesalahan', 'error');
            }
        }
    };

    const getStatusBadge = (status) => {
        switch(status) {
            case 'completed': return <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Selesai</span>;
            case 'pending': return <span className="bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider animate-pulse">Menunggu</span>;
            case 'processing': return <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Diproses</span>;
            case 'rejected': return <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Ditolak</span>;
            default: return <span>{status}</span>;
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h2 className="text-3xl font-black text-kas-dark tracking-tight">Antrean Penarikan Dana</h2>
                <p className="text-kas-soft text-sm mt-1">Kelola permohonan pencairan uang (payout) dari seluruh Mitra.</p>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-[10px] text-gray-400 uppercase font-bold border-b border-gray-100">
                                <th className="p-4 whitespace-nowrap">Tanggal Request</th>
                                <th className="p-4 whitespace-nowrap">Mitra / Tenant</th>
                                <th className="p-4 whitespace-nowrap">Info Rekening</th>
                                <th className="p-4 whitespace-nowrap">Nominal</th>
                                <th className="p-4 whitespace-nowrap">Status</th>
                                <th className="p-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm">
                            {isLoading ? (
                                <tr><td colSpan="6" className="p-10 text-center font-bold text-gray-400">Memuat antrean...</td></tr>
                            ) : payouts.length === 0 ? (
                                <tr><td colSpan="6" className="p-10 text-center font-bold text-gray-400 text-lg">Belum ada request penarikan.</td></tr>
                            ) : payouts.map(p => (
                                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="p-4 text-xs font-medium text-gray-500 whitespace-nowrap">
                                        {new Date(p.created_at).toLocaleString('id-ID', {
                                            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                        })}
                                    </td>
                                    <td className="p-4">
                                        <p className="font-bold text-gray-800">{p.tenant?.mitra?.name || 'Mitra Unknown'}</p>
                                    </td>
                                    <td className="p-4">
                                        <p className="font-black text-kas-dark uppercase">{p.bank_name}</p>
                                        <p className="text-xs text-gray-500 font-mono mt-0.5">{p.account_number}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">A.n {p.account_holder}</p>
                                    </td>
                                    <td className="p-4 font-black text-green-600">
                                        {formatRupiah(p.amount)}
                                    </td>
                                    <td className="p-4">
                                        {getStatusBadge(p.status)}
                                    </td>
                                    <td className="p-4 text-right space-x-2 whitespace-nowrap">
                                        {p.status === 'pending' && (
                                            <>
                                                <button onClick={() => handleReject(p.id)} className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold transition-colors">Tolak</button>
                                                <button onClick={() => handleProcess(p.id)} className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-bold transition-colors">Proses Transfer</button>
                                            </>
                                        )}
                                        {p.status === 'processing' && (
                                            <button onClick={() => handleComplete(p.id)} className="px-3 py-1.5 bg-[#25D366] hover:bg-[#1DA851] text-white rounded-lg text-xs font-bold shadow-md transition-colors">
                                                ✅ Selesaikan & Kirim WA
                                            </button>
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