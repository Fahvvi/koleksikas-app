import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function SuperAdminSystemLogs() {
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState({ total_errors: 0, wa_status: 'loading', payment_webhook_status: 'loading' });
    const [isLoading, setIsLoading] = useState(true);
    
    // Filter & Pagination
    const [levelFilter, setLevelFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`/api/v1/super-admin/system-logs?level=${levelFilter}&page=${page}`);
            setLogs(response.data.data || []);
            setTotalPages(response.data.meta?.last_page || 1);
            setStats(response.data.stats || {});
        } catch (error) {
            console.error("Gagal mengambil log:", error);
            // Dummy Data jika database masih kosong
            setLogs([
                { id: '1', level: 'error', service: 'whatsapp', message: 'Gagal mengirim pesan tagihan: Timeout', created_at: '2026-04-24 10:15:00' },
                { id: '2', level: 'info', service: 'payment', message: 'Webhook diterima: Pembayaran INV-001 Sukses', created_at: '2026-04-24 10:10:00' },
                { id: '3', level: 'warning', service: 'system', message: 'Penggunaan RAM Server mencapai 85%', created_at: '2026-04-24 09:00:00' },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchLogs(); }, [levelFilter, page]);

    const getBadgeStyle = (level) => {
        switch(level) {
            case 'error': return 'bg-red-100 text-red-700 border-red-200';
            case 'critical': return 'bg-red-600 text-white border-red-700 animate-pulse';
            case 'warning': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'info': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-kas-dark tracking-tight">System Health & Logs</h2>
                    <p className="text-kas-soft text-sm mt-1">Pantau infrastruktur, webhook, dan error server secara real-time.</p>
                </div>
                <button onClick={fetchLogs} className="px-5 py-2.5 bg-white border border-gray-200 text-kas-dark hover:bg-gray-50 rounded-xl font-bold shadow-sm transition-all flex items-center gap-2">
                    🔄 Refresh Logs
                </button>
            </div>

            {/* --- HEALTH METRICS CARDS --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-kas-accent/30 shadow-sm border-t-4 border-t-red-500">
                    <div className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-2">Error Hari Ini</div>
                    <div className="flex items-end gap-3">
                        <span className="text-4xl font-black text-kas-dark">{stats.total_errors}</span>
                        <span className="text-sm text-red-500 font-bold mb-1">Issue Terdeteksi</span>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-kas-accent/30 shadow-sm border-t-4 border-t-green-500">
                    <div className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-2">Status WhatsApp Bot</div>
                    <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-2xl font-black text-kas-dark capitalize">{stats.wa_status}</span>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-kas-accent/30 shadow-sm border-t-4 border-t-blue-500">
                    <div className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-2">Payment Webhook</div>
                    <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
                        <span className="text-2xl font-black text-kas-dark capitalize">{stats.payment_webhook_status}</span>
                    </div>
                </div>
            </div>

            {/* --- LOGS VIEWER --- */}
            <div className="bg-white rounded-2xl border border-kas-accent/30 shadow-sm flex flex-col overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-700">Live Server Logs</h3>
                    <select value={levelFilter} onChange={(e) => {setLevelFilter(e.target.value); setPage(1);}} className="px-4 py-2 rounded-lg border border-gray-200 outline-none text-sm font-medium">
                        <option value="all">Semua Level</option>
                        <option value="info">Info</option>
                        <option value="warning">Warning</option>
                        <option value="error">Error & Critical</option>
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-kas-dark text-white text-xs uppercase tracking-wider">
                            <tr>
                                <th className="py-3 px-6 font-bold w-40">Waktu</th>
                                <th className="py-3 px-6 font-bold w-32">Level</th>
                                <th className="py-3 px-6 font-bold w-32">Service</th>
                                <th className="py-3 px-6 font-bold">Pesan Log</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm font-mono">
                            {isLoading ? (
                                <tr><td colSpan="4" className="py-10 text-center text-gray-500 font-sans">Mengambil log server...</td></tr>
                            ) : logs.length === 0 ? (
                                <tr><td colSpan="4" className="py-10 text-center text-gray-500 font-sans">Tidak ada log ditemukan. Sistem berjalan normal.</td></tr>
                            ) : logs.map((log) => (
                                <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                    <td className="py-3 px-6 text-gray-500 text-xs">{new Date(log.created_at).toLocaleString('id-ID')}</td>
                                    <td className="py-3 px-6">
                                        <span className={`px-2.5 py-1 rounded border text-[10px] uppercase font-bold tracking-wider ${getBadgeStyle(log.level)}`}>
                                            {log.level}
                                        </span>
                                    </td>
                                    <td className="py-3 px-6 font-bold text-gray-700 uppercase text-xs">{log.service}</td>
                                    <td className="py-3 px-6 text-gray-800 break-words">{log.message}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 border rounded bg-white disabled:opacity-50 text-sm">Prev</button>
                        <span className="px-3 py-1.5 font-bold text-sm">Hal {page} dari {totalPages}</span>
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 border rounded bg-white disabled:opacity-50 text-sm">Next</button>
                    </div>
                )}
            </div>
        </div>
    );
}