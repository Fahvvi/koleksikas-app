import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users as UsersIcon, UserCheck, UserMinus, Search } from 'lucide-react';

export default function SuperAdminUsers() {
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState({ total_users: 0, active_users: 0, idle_users: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            // Gunakan auth_token secara eksplisit jika Axios Interceptor gagal mengambilnya
            const token = localStorage.getItem('auth_token');
            const response = await axios.get('/api/v1/super-admin/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setUsers(response.data.data || []); // 👈 PENGAMAN 1: Fallback ke Array kosong
            setStats(response.data.stats || { total_users: 0, active_users: 0, idle_users: 0 });
        } catch (error) {
            console.error("Gagal load data users", error);
            setUsers([]); // Pastikan dikosongkan jika error
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

    // 👇 PENGAMAN 2: Pastikan users di-fallback ke [] sebelum di-filter 👇
    const filteredUsers = (users || []).filter(u => 
        (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
        (u.phone_wa || '').includes(searchQuery)
    );


    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h2 className="text-3xl font-black text-kas-dark tracking-tight">Database Member Global</h2>
                <p className="text-kas-soft text-sm mt-1">Pantau seluruh user yang mendaftar ke ekosistem KoleksiKAS.</p>
            </div>

            {/* Statistik */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><UsersIcon className="w-7 h-7" /></div>
                    <div>
                        <p className="text-sm font-bold text-gray-400 uppercase">Total Terdaftar</p>
                        <p className="text-3xl font-black text-kas-dark">{stats.total_users}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-14 h-14 bg-green-50 text-green-600 rounded-xl flex items-center justify-center"><UserCheck className="w-7 h-7" /></div>
                    <div>
                        <p className="text-sm font-bold text-gray-400 uppercase">Terikat Mitra</p>
                        <p className="text-3xl font-black text-kas-dark">{stats.active_users}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center"><UserMinus className="w-7 h-7" /></div>
                    <div>
                        <p className="text-sm font-bold text-gray-400 uppercase">Freelance / Idle</p>
                        <p className="text-3xl font-black text-kas-dark">{stats.idle_users}</p>
                    </div>
                </div>
            </div>

            {/* Tabel Data */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <h3 className="text-lg font-black text-kas-dark">Daftar Pengguna</h3>
                    <div className="relative w-full md:w-72">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Search className="w-4 h-4" /></span>
                        <input 
                            type="text" 
                            placeholder="Cari nama atau no WA..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-kas-primary outline-none text-sm font-medium transition-colors"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 text-gray-400 text-xs uppercase tracking-wider">
                                <th className="p-4 font-bold">Nama Member</th>
                                <th className="p-4 font-bold">Kontak WA</th>
                                <th className="p-4 font-bold">Komunitas / Mitra</th>
                                <th className="p-4 font-bold">Status</th>
                                <th className="p-4 font-bold">Tgl Daftar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {isLoading ? (
                                <tr><td colSpan="5" className="p-8 text-center text-gray-500 font-bold">Memuat data...</td></tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr><td colSpan="5" className="p-8 text-center text-gray-500 font-bold">Tidak ada data ditemukan.</td></tr>
                            ) : filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-kas-primary/10 text-kas-primary font-black flex items-center justify-center text-xs">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="font-bold text-gray-800">{user.name}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 font-medium text-gray-600">{user.phone_wa}</td>
                                    <td className="p-4">
                                        {user.groups.length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                                {user.groups.map((group, i) => (
                                                    <span key={i} className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-[10px] font-bold border border-blue-100">{group}</span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 italic text-xs">-</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        {user.is_active ? (
                                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase">Aktif</span>
                                        ) : (
                                            <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-[10px] font-black uppercase">Freelance</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-gray-500 font-medium">{formatDate(user.created_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}