import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { Search, MapPin, Calendar, Users, Trophy, LogIn, ArrowRight, X, Info, ChevronDown, History, Settings, LogOut } from 'lucide-react';

const MySwal = withReactContent(Swal);

export default function ExploreOpenPlay() {
    const [sessions, setSessions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchRegion, setSearchRegion] = useState('');
    
    // Auth & Dropdown States
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false); // State untuk Menu Dropdown
    
    // Modal States
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
            try {
                const res = await axios.get('/api/v1/auth/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCurrentUser(res.data.data);
                setIsAuthenticated(true);
            } catch (e) {
                console.error("Token tidak valid");
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setIsAuthenticated(false);
            }
        }
    };

    const fetchPublicSessions = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get('/api/v1/public/sessions'); 
            setSessions(response.data.data || []);
        } catch (error) {
            console.error("Gagal mengambil data open play", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/v1/auth/logout', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (e) {
            console.error("Logout error", e);
        }
        
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setCurrentUser(null);
        setIsDropdownOpen(false);
        
        MySwal.fire({
            toast: true, position: 'top-end', icon: 'success', title: 'Berhasil Keluar',
            showConfirmButton: false, timer: 1500
        });
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
            navigate('/user/login', { state: { returnUrl: location.pathname } });
        } else {
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
        
        MySwal.fire({ title: 'Menyiapkan Tagihan...', allowOutsideClick: false, didOpen: () => MySwal.showLoading() });
        
        setTimeout(() => {
            MySwal.close();
            setIsSubmitting(false);
            setIsModalOpen(false);
            navigate(`/checkout/${selectedSession.id}/${currentUser.id}`);
        }, 800);
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans selection:bg-kas-accent selection:text-kas-dark">
            {/* Header / Navbar */}
            <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link to="/" className="font-black text-xl md:text-2xl text-kas-primary tracking-tight">KoleksiKAS.</Link>
                    <div className="flex gap-2 md:gap-4 items-center">
                        <Link to="/" className="hidden sm:block text-sm font-bold text-gray-500 hover:text-kas-dark transition-colors">Beranda</Link>
                        
                        {!isAuthenticated ? (
                            <Link to="/user/login" className="bg-kas-primary text-white text-xs font-bold px-3 py-2 md:px-4 md:py-2.5 rounded-lg hover:bg-kas-dark transition-colors flex items-center gap-2 shadow-md">
                                <LogIn className="w-4 h-4" /> Login
                            </Link>
                        ) : (
                            <div className="relative">
                                {/* Tombol Dropdown Profil */}
                                <button 
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="flex items-center gap-2 bg-kas-primary/5 hover:bg-kas-primary/10 px-3 py-1.5 rounded-full border border-kas-primary/10 transition-colors"
                                >
                                    <div className="w-7 h-7 bg-kas-primary text-white rounded-full flex items-center justify-center font-black text-xs shadow-sm">
                                        {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <span className="text-xs font-bold text-kas-dark hidden sm:block truncate max-w-[100px]">
                                        {currentUser?.name}
                                    </span>
                                    <ChevronDown className={`w-4 h-4 text-kas-primary transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Menu Dropdown */}
                                {isDropdownOpen && (
                                    <>
                                        {/* Overlay tak terlihat untuk menutup dropdown saat klik di luar */}
                                        <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)}></div>
                                        
                                        <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-slide-up origin-top-right">
                                            <div className="px-4 py-3 border-b border-gray-50 mb-2">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-0.5">Masuk Sebagai</p>
                                                <p className="text-sm font-black text-kas-dark truncate">{currentUser?.name}</p>
                                                <p className="text-xs font-medium text-gray-500 truncate">{currentUser?.phone_wa}</p>
                                            </div>
                                            
                                            {/* Nanti rute ini bisa kamu buat halamannya */}
                                            <Link to="/user/history" className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-gray-600 hover:text-kas-primary hover:bg-kas-primary/5 transition-colors">
                                                <History className="w-4 h-4" /> Riwayat Tagihan
                                            </Link>
                                            <Link to="/user/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-gray-600 hover:text-kas-primary hover:bg-kas-primary/5 transition-colors">
                                                <Settings className="w-4 h-4" /> Pengaturan Profil
                                            </Link>
                                            
                                            <div className="h-px bg-gray-50 my-2"></div>
                                            
                                            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors">
                                                <LogOut className="w-4 h-4" /> Keluar Akun
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* Banner Area (Mobile Optimized) */}
            <div className="bg-kas-dark text-white pt-10 pb-20 md:pt-16 md:pb-24 px-4 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-kas-primary rounded-full blur-3xl opacity-20"></div>
                <div className="relative z-10">
                    <h1 className="text-3xl md:text-5xl font-black mb-3 md:mb-4 tracking-tight leading-tight">Cari Lawan. Cari Teman.<br className="md:hidden"/> Ikut Mabar.</h1>
                    <p className="text-kas-soft text-sm md:text-lg font-medium">Temukan jadwal Open Play olahraga terdekat.</p>
                    
                    <div className="max-w-3xl mx-auto mt-8 bg-white p-2 rounded-2xl shadow-xl flex flex-col md:flex-row gap-2 border border-gray-100">
                        <div className="flex-1 flex items-center px-4 bg-gray-50 rounded-xl border border-transparent focus-within:border-kas-primary transition-colors h-12 md:h-14">
                            <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                            <input type="text" placeholder="Futsal, Badminton..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-transparent border-none outline-none px-3 text-gray-800 font-medium text-sm md:text-base" />
                        </div>
                        <div className="flex-1 flex items-center px-4 bg-gray-50 rounded-xl border border-transparent focus-within:border-kas-primary transition-colors h-12 md:h-14">
                            <MapPin className="w-5 h-5 text-kas-primary flex-shrink-0" />
                            <input type="text" placeholder="Kecamatan atau Kota..." value={searchRegion} onChange={(e) => setSearchRegion(e.target.value)} className="w-full bg-transparent border-none outline-none px-3 text-gray-800 font-medium text-sm md:text-base" />
                        </div>
                    </div>
                </div>
            </div>

            {/* List Mabar */}
            <div className="max-w-7xl mx-auto px-4 -mt-8 pb-20 relative z-20">
                {isLoading ? (
                    <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100"><div className="w-10 h-10 border-4 border-kas-primary border-t-transparent rounded-full animate-spin mx-auto"></div></div>
                ) : filteredSessions.length === 0 ? (
                    <div className="bg-white p-10 md:p-16 rounded-3xl shadow-sm border border-gray-100 text-center">
                        <span className="text-5xl md:text-6xl mb-4 block opacity-50">🏝️</span>
                        <h3 className="text-xl md:text-2xl font-black text-gray-800 mb-2">Tidak ada jadwal ditemukan</h3>
                        <p className="text-gray-500 font-medium text-sm md:text-base">Coba gunakan kata kunci kota atau olahraga yang lain.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                        {filteredSessions.map(session => (
                            <div key={session.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col">
                                <div className="p-5 md:p-6 flex-1">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="bg-kas-accent/50 text-kas-dark text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1 border border-kas-accent">
                                            <Trophy className="w-3 h-3 text-kas-primary" /> Open Play
                                        </span>
                                        <span className="text-lg md:text-xl font-black text-kas-primary">{Number(session.price) === 0 ? 'Gratis' : formatRupiah(session.price)}</span>
                                    </div>
                                    <h3 className="text-xl md:text-2xl font-black text-gray-900 leading-tight mb-2 group-hover:text-kas-primary transition-colors line-clamp-2">{session.name}</h3>
                                    <p className="text-xs md:text-sm font-bold text-gray-500 mb-5 flex items-center gap-2 truncate"><Users className="w-4 h-4 text-kas-soft flex-shrink-0"/> Host: {session.group?.name}</p>
                                    
                                    <div className="space-y-3 text-xs md:text-sm text-gray-600 font-medium bg-gray-50 p-4 rounded-2xl border border-gray-100/50">
                                        <div className="flex items-start gap-3">
                                            <Calendar className="w-4 h-4 md:w-5 md:h-5 text-kas-primary flex-shrink-0 mt-0.5" />
                                            <span>{formatDate(session.scheduled_at)}</span>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <MapPin className="w-4 h-4 md:w-5 md:h-5 text-kas-primary flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-gray-800 font-bold leading-tight">{session.location}</p>
                                                {session.region && <p className="text-[10px] md:text-xs text-gray-500 mt-1">{session.region}</p>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 md:p-5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                                    <div className="text-sm">
                                        <p className="text-gray-500 font-bold text-[10px] md:text-xs uppercase mb-0.5">Sisa Kuota</p>
                                        <p className="font-black text-kas-dark text-base md:text-lg"><span className="text-kas-primary">{session.max_participants - session.participants_count}</span> <span className="text-xs md:text-sm text-gray-400">/ {session.max_participants}</span></p>
                                    </div>
                                    {session.participants_count >= session.max_participants ? (
                                        <button disabled className="bg-gray-200 text-gray-400 font-bold py-2.5 md:py-3 px-5 md:px-6 rounded-xl cursor-not-allowed uppercase tracking-wider text-xs">Penuh</button>
                                    ) : (
                                        <button 
                                            onClick={() => handleActionClick(session)} 
                                            className={`font-black py-2.5 md:py-3 px-5 md:px-6 rounded-xl transition-all shadow-lg flex items-center gap-2 text-sm md:text-base ${isAuthenticated ? 'bg-kas-primary hover:bg-kas-dark text-white shadow-kas-primary/30' : 'bg-white border-2 border-kas-dark text-kas-dark hover:bg-kas-dark hover:text-white'}`}
                                        >
                                            {isAuthenticated ? 'Ikut Mabar' : 'Login Daftar'}
                                            {!isAuthenticated && <ArrowRight className="w-4 h-4 hidden sm:block" />}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* MODAL PENDAFTARAN (MOBILE RESPONSIVE) */}
            {isModalOpen && selectedSession && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-kas-dark/70 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-t-3xl sm:rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden transform transition-all flex flex-col max-h-[90vh]">
                        
                        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mt-4 mb-2 sm:hidden"></div>

                        <div className="px-6 py-4 sm:p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0">
                            <div>
                                <h3 className="text-xl font-black text-kas-dark">Konfirmasi Tiket</h3>
                                <p className="text-xs font-bold text-kas-primary uppercase tracking-wider mt-1 truncate max-w-[200px] sm:max-w-xs">{selectedSession.name}</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 bg-gray-50 p-2 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                        </div>
                        
                        <form onSubmit={handleRegisterSubmit} className="p-6 overflow-y-auto space-y-5">
                            <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-center gap-4">
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-xl shadow-sm flex-shrink-0">🎫</div>
                                <div>
                                    <p className="text-[10px] text-blue-800 font-bold uppercase tracking-wider">Total Tagihan</p>
                                    <p className="text-2xl font-black text-kas-primary">{Number(selectedSession.price) === 0 ? 'Gratis' : formatRupiah(selectedSession.price)}</p>
                                </div>
                            </div>

                            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-xl flex items-start gap-3">
                                <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                <p className="text-xs font-medium text-yellow-800 leading-relaxed">
                                    Data ini diambil otomatis dari profil Anda dan tidak dapat diubah di sini.
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Nama Peserta</label>
                                <input 
                                    type="text" 
                                    value={formData.name} 
                                    disabled
                                    className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-100 text-gray-600 font-bold cursor-not-allowed" 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Nomor WhatsApp</label>
                                <input 
                                    type="text" 
                                    value={formData.phone_wa} 
                                    disabled
                                    className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-100 text-gray-600 font-bold cursor-not-allowed tracking-wider" 
                                />
                            </div>

                            <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-kas-primary hover:bg-kas-dark text-white rounded-2xl font-black transition-all shadow-xl shadow-kas-primary/30 disabled:opacity-70 mt-6 flex items-center justify-center gap-2 text-lg">
                                {isSubmitting ? 'Memproses...' : <>Lanjut Pembayaran <ArrowRight className="w-5 h-5" /></>}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}