import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { Search, MapPin, Calendar, Users, Trophy, LogIn, ArrowRight, X } from 'lucide-react';

const MySwal = withReactContent(Swal);

export default function ExploreOpenPlay() {
    const [sessions, setSessions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchRegion, setSearchRegion] = useState('');
    
    // Auth & Modal States
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSession, setSelectedSession] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [formData, setFormData] = useState({ name: '', phone_wa: '' });
    
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        checkAuthStatus();
        fetchPublicSessions();
    }, []);

    const checkAuthStatus = async () => {
        const token = localStorage.getItem('token');
        if (token) {
            setIsAuthenticated(true);
            try {
                // Ambil data profil user jika sudah login untuk auto-fill
                const res = await axios.get('/api/v1/auth/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCurrentUser(res.data.data);
            } catch (e) {
                console.error("Token tidak valid");
                localStorage.removeItem('token');
                setIsAuthenticated(false);
            }
        }
    };

    const fetchPublicSessions = async () => {
        setIsLoading(true);
        try {
            // Nanti sesuaikan dengan endpoint backend kamu
            const response = await axios.get('/api/v1/public/sessions'); 
            setSessions(response.data.data || []);
        } catch (error) {
            console.error("Gagal mengambil data open play", error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString) => new Date(dateString).toLocaleString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
    const formatRupiah = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);

    const filteredSessions = sessions.filter(session => {
        const matchName = (session.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (session.group?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchRegion = (session.region || session.location || '').toLowerCase().includes(searchRegion.toLowerCase());
        return matchName && matchRegion;
    });

    const handleActionClick = (session) => {
        if (!isAuthenticated) {
            // Jika belum login, simpan URL saat ini agar bisa dikembalikan setelah login
            navigate('/user/login', { state: { returnUrl: location.pathname } });
        } else {
            // Jika sudah login, buka modal dan isi form otomatis
            setSelectedSession(session);
            setFormData({
                name: currentUser?.name || '',
                phone_wa: currentUser?.phone_wa || ''
            });
            setIsModalOpen(true);
        }
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            MySwal.fire({ title: 'Mendaftarkan...', allowOutsideClick: false, didOpen: () => MySwal.showLoading() });
            
            // Tembak ke endpoint registrasi publik
            const response = await axios.post(`/api/v1/sessions/${selectedSession.id}/register`, formData);
            
            MySwal.fire('Berhasil!', 'Silakan lakukan pembayaran.', 'success').then(() => {
                // Asumsi response backend mengembalikan format data QRIS / link pembayaran
                // Arahkan ke halaman checkout sesuai sistem kamu
                navigate(`/checkout/${selectedSession.id}/${currentUser?.id || 'guest'}`);
            });
        } catch (error) {
            MySwal.fire('Gagal', error.response?.data?.message || 'Gagal mendaftar sesi ini.', 'error');
        } finally {
            setIsSubmitting(false);
            setIsModalOpen(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans selection:bg-kas-accent selection:text-kas-dark">
            {/* Header / Navbar */}
            <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link to="/" className="font-black text-2xl text-kas-primary tracking-tight">KoleksiKAS.</Link>
                    <div className="flex gap-4 items-center">
                        <Link to="/" className="text-sm font-bold text-gray-500 hover:text-kas-dark transition-colors">Beranda</Link>
                        {!isAuthenticated ? (
                            <Link to="/user/login" className="bg-kas-primary text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-kas-dark transition-colors flex items-center gap-2 shadow-md">
                                <LogIn className="w-3 h-3" /> Login
                            </Link>
                        ) : (
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-kas-primary/10 text-kas-primary rounded-full flex items-center justify-center font-black border border-kas-primary/20">
                                    {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* Banner Area */}
            <div className="bg-kas-dark text-white pt-16 pb-24 px-4 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-kas-primary rounded-full blur-3xl opacity-20"></div>
                <div className="relative z-10">
                    <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">Cari Lawan. Cari Teman. Ikut Mabar.</h1>
                    <p className="text-kas-soft text-lg font-medium">Temukan jadwal Open Play olahraga terdekat di kota Anda.</p>
                    
                    {/* Search Bar */}
                    <div className="max-w-3xl mx-auto mt-10 bg-white p-2 rounded-2xl shadow-2xl flex flex-col md:flex-row gap-2 border border-gray-100">
                        <div className="flex-1 flex items-center px-4 bg-gray-50 rounded-xl border border-transparent focus-within:border-kas-primary transition-colors">
                            <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                            <input type="text" placeholder="Cari olahraga (Futsal, Badminton...)" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-transparent border-none outline-none px-3 py-3 text-gray-800 font-medium" />
                        </div>
                        <div className="flex-1 flex items-center px-4 bg-gray-50 rounded-xl border border-transparent focus-within:border-kas-primary transition-colors">
                            <MapPin className="w-5 h-5 text-kas-primary flex-shrink-0" />
                            <input type="text" placeholder="Kecamatan, Desa, atau Kota..." value={searchRegion} onChange={(e) => setSearchRegion(e.target.value)} className="w-full bg-transparent border-none outline-none px-3 py-3 text-gray-800 font-medium" />
                        </div>
                    </div>
                </div>
            </div>

            {/* List Mabar */}
            <div className="max-w-7xl mx-auto px-4 -mt-10 pb-20 relative z-20">
                {isLoading ? (
                    <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100"><div className="w-12 h-12 border-4 border-kas-primary border-t-transparent rounded-full animate-spin mx-auto"></div></div>
                ) : filteredSessions.length === 0 ? (
                    <div className="bg-white p-16 rounded-3xl shadow-sm border border-gray-100 text-center">
                        <span className="text-6xl mb-4 block opacity-50">🏝️</span>
                        <h3 className="text-2xl font-black text-gray-800 mb-2">Tidak ada jadwal ditemukan</h3>
                        <p className="text-gray-500 font-medium">Coba gunakan kata kunci kota atau olahraga yang lain.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredSessions.map(session => (
                            <div key={session.id} className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col">
                                <div className="p-6 flex-1">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="bg-kas-accent/50 text-kas-dark text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 border border-kas-accent">
                                            <Trophy className="w-3 h-3 text-kas-primary" /> Open Play
                                        </span>
                                        <span className="text-xl font-black text-kas-primary">{Number(session.price) === 0 ? 'Gratis' : formatRupiah(session.price)}</span>
                                    </div>
                                    <h3 className="text-2xl font-black text-gray-900 leading-tight mb-2 group-hover:text-kas-primary transition-colors">{session.name}</h3>
                                    <p className="text-sm font-bold text-gray-500 mb-6 flex items-center gap-2"><Users className="w-4 h-4 text-kas-soft"/> Host: {session.group?.name}</p>
                                    
                                    <div className="space-y-3 text-sm text-gray-600 font-medium bg-gray-50 p-4 rounded-2xl border border-gray-100/50">
                                        <div className="flex items-start gap-3">
                                            <Calendar className="w-5 h-5 text-kas-primary flex-shrink-0" />
                                            <span>{formatDate(session.scheduled_at)}</span>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <MapPin className="w-5 h-5 text-kas-primary flex-shrink-0" />
                                            <div>
                                                <p className="text-gray-800 font-bold">{session.location}</p>
                                                {session.region && <p className="text-xs text-gray-500 mt-0.5">{session.region}</p>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                                    <div className="text-sm">
                                        <p className="text-gray-500 font-bold text-xs uppercase mb-0.5">Sisa Kuota</p>
                                        <p className="font-black text-kas-dark text-lg"><span className="text-kas-primary">{session.max_participants - session.participants_count}</span> <span className="text-sm text-gray-400">/ {session.max_participants}</span></p>
                                    </div>
                                    {session.participants_count >= session.max_participants ? (
                                        <button disabled className="bg-gray-200 text-gray-400 font-bold py-3 px-6 rounded-xl cursor-not-allowed uppercase tracking-wider text-xs">Penuh</button>
                                    ) : (
                                        <button 
                                            onClick={() => handleActionClick(session)} 
                                            className={`font-black py-3 px-6 rounded-xl transition-all shadow-lg flex items-center gap-2 ${isAuthenticated ? 'bg-kas-primary hover:bg-kas-dark text-white shadow-kas-primary/30' : 'bg-white border-2 border-kas-dark text-kas-dark hover:bg-kas-dark hover:text-white'}`}
                                        >
                                            {isAuthenticated ? 'Ikut Mabar' : 'Login untuk Daftar'}
                                            {!isAuthenticated && <ArrowRight className="w-4 h-4" />}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* MODAL PENDAFTARAN & KONFIRMASI (HANYA JIKA LOGGED IN) */}
            {isModalOpen && selectedSession && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-kas-dark/70 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
                        <div className="bg-kas-bg p-6 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black text-kas-dark">Konfirmasi Pendaftaran</h3>
                                <p className="text-xs font-bold text-kas-primary uppercase tracking-wider mt-1">{selectedSession.name}</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors"><X className="w-6 h-6" /></button>
                        </div>
                        
                        <form onSubmit={handleRegisterSubmit} className="p-6 space-y-5">
                            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center gap-4 mb-2">
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-xl shadow-sm">🎫</div>
                                <div>
                                    <p className="text-xs text-blue-800 font-bold uppercase">Total Tagihan</p>
                                    <p className="text-xl font-black text-kas-primary">{Number(selectedSession.price) === 0 ? 'Gratis' : formatRupiah(selectedSession.price)}</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Nama Peserta</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={formData.name} 
                                    onChange={e => setFormData({...formData, name: e.target.value})} 
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-kas-primary focus:ring-2 focus:ring-kas-primary/20 outline-none font-medium transition-all" 
                                    placeholder="Masukkan nama Anda" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Nomor WhatsApp (Aktif)</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={formData.phone_wa} 
                                    onChange={e => setFormData({...formData, phone_wa: e.target.value})} 
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-kas-primary focus:ring-2 focus:ring-kas-primary/20 outline-none font-medium transition-all" 
                                    placeholder="Cth: 08123456789" 
                                />
                                <p className="text-[10px] text-gray-400 mt-1.5 font-medium">*Tiket & link pembayaran akan dikirim ke nomor ini.</p>
                            </div>

                            <button type="submit" disabled={isSubmitting} className="w-full py-3.5 bg-kas-primary hover:bg-kas-dark text-white rounded-xl font-black transition-all shadow-lg shadow-kas-primary/30 disabled:opacity-70 mt-4 flex items-center justify-center gap-2">
                                {isSubmitting ? 'Memproses...' : <>Lanjut Pembayaran <ArrowRight className="w-5 h-5" /></>}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}