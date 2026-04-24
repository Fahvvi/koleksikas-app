import React from 'react';

export default function AdminDashboard() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-kas-accent/30 shadow-sm">
                    <div className="text-kas-soft text-sm font-bold mb-1">Total Kas Terkumpul</div>
                    <div className="text-3xl font-black text-kas-primary">Rp 4.500.000</div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-kas-accent/30 shadow-sm">
                    <div className="text-kas-soft text-sm font-bold mb-1">Tagihan Pending</div>
                    <div className="text-3xl font-black text-kas-dark">Rp 850.000</div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-kas-accent/30 shadow-sm">
                    <div className="text-kas-soft text-sm font-bold mb-1">Pesan WA Terkirim</div>
                    <div className="text-3xl font-black text-kas-dark">142 <span className="text-sm font-medium text-gray-400">/ 500 limit</span></div>
                </div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl border border-kas-accent/30 shadow-sm min-h-[300px]">
                <h3 className="text-lg font-bold mb-4">Aktivitas Terbaru</h3>
                <p className="text-gray-500">Belum ada aktivitas iuran hari ini.</p>
            </div>
        </div>
    );
}