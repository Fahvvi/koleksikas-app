import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Billing() {
    const [sessions, setSessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => { fetchBills(); }, []);

    const fetchBills = async () => {
        try {
            const response = await axios.get('/api/v1/admin/bills');
            setSessions(response.data.data || []);
        } catch (error) { console.error(error); } 
        finally { setIsLoading(false); }
    };

    const formatRupiah = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

    if (isLoading) return <div className="p-10 text-center animate-pulse">Memuat Keuangan...</div>;

    return (
        <div className="space-y-6 p-4 md:p-8 max-w-7xl mx-auto">
            <div>
                <h2 className="text-3xl font-black text-gray-800">Keuangan Sesi</h2>
                <p className="text-gray-500 text-sm">Klik sesi untuk melihat detail siapa saja yang sudah bayar.</p>
            </div>

            {/* --- LIST SESI (MASTER) --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sessions.map((session) => (
                    <div 
                        key={session.id} 
                        onClick={() => setSelectedSession(session)}
                        className={`bg-white p-6 rounded-3xl border-2 transition-all cursor-pointer hover:shadow-xl ${selectedSession?.id === session.id ? 'border-kas-primary shadow-lg shadow-kas-primary/10' : 'border-gray-100'}`}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-kas-primary/10 text-kas-primary p-2 rounded-xl text-lg">🏸</div>
                            <span className="text-xs font-black bg-gray-100 px-3 py-1 rounded-full text-gray-600">{session.date}</span>
                        </div>
                        <h3 className="text-xl font-black text-gray-800 mb-1">{session.name}</h3>
                        
                        <div className="mt-4 space-y-2">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="font-bold text-gray-500">Pemasukan</span>
                                <span className="font-black text-green-600">{formatRupiah(session.total_collected)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="font-bold text-gray-500">Partisipan</span>
                                <span className="font-black text-gray-700">{session.paid_count}/{session.total_members} <span className="text-kas-primary">({session.percentage}%)</span></span>
                            </div>
                            {/* PROGRESS BAR */}
                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                <div className="bg-kas-primary h-full transition-all" style={{ width: `${session.percentage}%` }}></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* --- DETAIL MEMBER (DETAIL) --- */}
            {selectedSession && (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden animate-slide-up">
                    <div className="p-6 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                        <h4 className="font-black text-gray-800">Detail Pembayaran: {selectedSession.name}</h4>
                        <button onClick={() => setSelectedSession(null)} className="text-gray-400 hover:text-gray-600">✖ Tutup</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white text-gray-500 uppercase text-xs font-bold border-b">
                                <tr>
                                    <th className="px-6 py-4">Member</th>
                                    <th className="px-6 py-4">Nominal</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Waktu Bayar</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {selectedSession.details.map((detail, idx) => (
                                    <tr key={idx} className="hover:bg-kas-bg/30">
                                        <td className="px-6 py-4 font-bold text-gray-800">{detail.user_name}</td>
                                        <td className="px-6 py-4 font-bold text-gray-600">{formatRupiah(detail.amount)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black ${detail.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                {detail.status === 'paid' ? 'LUNAS' : 'PENDING'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-400">{detail.paid_at}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}