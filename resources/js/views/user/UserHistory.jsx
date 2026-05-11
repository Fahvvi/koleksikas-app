import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Clock, CheckCircle2, AlertCircle, Receipt, Trophy } from 'lucide-react';

export default function UserHistory() {
    const [histories, setHistories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all', 'pending', 'paid'
    const navigate = useNavigate();

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/v1/user/history', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHistories(res.data.data);
        } catch (error) {
            console.error("Gagal mengambil riwayat", error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatRupiah = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const filteredHistories = histories.filter(h => filter === 'all' ? true : h.status === filter);

    return (
        <div className="min-h-screen bg-gray-50 font-sans selection:bg-kas-accent selection:text-kas-dark pb-20">
            {/* Header Mobile Style */}
            <div className="bg-white px-4 py-5 border-b border-gray-100 flex items-center gap-4 sticky top-0 z-30 shadow-sm">
                <Link to="/explore" className="p-2 bg-gray-50 rounded-full text-gray-500 hover:text-kas-dark hover:bg-gray-100 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-xl font-black text-kas-dark tracking-tight">Riwayat Saya</h1>
            </div>

            <div className="max-w-3xl mx-auto px-4 mt-6 animate-fade-in">
                {/* Tabs / Filter */}
                <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 mb-6">
                    <button onClick={() => setFilter('all')} className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${filter === 'all' ? 'bg-kas-primary text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>Semua</button>
                    <button onClick={() => setFilter('pending')} className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${filter === 'pending' ? 'bg-orange-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>Belum Bayar</button>
                    <button onClick={() => setFilter('paid')} className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${filter === 'paid' ? 'bg-green-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>Lunas</button>
                </div>

                {isLoading ? (
                    <div className="text-center py-20"><div className="w-8 h-8 border-4 border-kas-primary border-t-transparent rounded-full animate-spin mx-auto"></div></div>
                ) : filteredHistories.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                        <Receipt className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                        <h3 className="text-lg font-black text-gray-800">Tidak ada riwayat</h3>
                        <p className="text-gray-500 text-sm mt-1">Anda belum memiliki tagihan di kategori ini.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredHistories.map(item => (
                            <div key={item.id} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-4 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start">
                                    <div className="flex gap-3 items-start">
                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${item.session_type === 'event' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                                            <Trophy className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-gray-900 leading-tight">{item.session_name}</h4>
                                            <p className="text-xs font-bold text-gray-400 mt-0.5">{item.group_name}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-kas-primary">{formatRupiah(item.amount)}</p>
                                        {item.status === 'paid' ? (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-green-600 bg-green-50 px-2 py-1 rounded-full mt-1 uppercase tracking-wider"><CheckCircle2 className="w-3 h-3" /> Lunas</span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-1 rounded-full mt-1 uppercase tracking-wider"><AlertCircle className="w-3 h-3" /> Pending</span>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                                        <Clock className="w-3.5 h-3.5" />
                                        {item.status === 'paid' ? `Dibayar: ${formatDate(item.paid_at || item.created_at)}` : `Tenggat: ${formatDate(item.due_date)}`}
                                    </div>
                                    
                                    {item.status !== 'paid' && item.session_id && (
                                        <button 
                                            onClick={() => navigate(`/checkout/${item.session_id}/${JSON.parse(localStorage.getItem('user')).id}`)}
                                            className="px-4 py-2 bg-kas-primary text-white text-xs font-black rounded-xl hover:bg-kas-dark transition-all active:scale-95 shadow-sm"
                                        >
                                            Bayar Sekarang
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}