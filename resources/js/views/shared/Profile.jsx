import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { Mail, Smartphone, ShieldCheck, KeyRound } from 'lucide-react';

const MySwal = withReactContent(Swal);

export default function UserProfile() {
    const [user, setUser] = useState({ name: '', email: '', phone_wa: '' });
    
    // State Modal OTP & Form Baru
    const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [newData, setNewData] = useState(''); // 👈 State untuk menyimpan email/wa/password baru
    const [pendingAction, setPendingAction] = useState(null);
    const [activeChannel, setActiveChannel] = useState('wa'); 
    const [isLoading, setIsLoading] = useState(true);
    const [isVerifying, setIsVerifying] = useState(false);

    const Toast = MySwal.mixin({
        toast: true, position: 'top-end', showConfirmButton: false, timer: 3000,
    });

    // Ambil Data User Saat Load
    const fetchUserData = () => {
        axios.get('/api/v1/user/profile').then(res => {
            setUser(res.data.data);
            setIsLoading(false);
        });
    };

    useEffect(() => {
        fetchUserData();
    }, []);

    const handleUpdateBasic = async (e) => {
        e.preventDefault();
        try {
            await axios.put('/api/v1/user/profile/basic', { name: user.name });
            Toast.fire({ icon: 'success', title: 'Nama berhasil diubah!' });
        } catch (err) {
            MySwal.fire('Gagal', 'Gagal update nama', 'error');
        }
    };

    // 1. FUNGSI MINTA OTP
    const triggerSensitiveUpdate = async (type) => {
        let channel = 'wa'; 

        if (type === 'change_phone') {
            channel = 'email'; 
        } else if (type === 'change_email') {
            channel = 'wa';    
        } else if (type === 'change_password') {
            const { value: selectedChannel } = await MySwal.fire({
                title: 'Pilih Metode Verifikasi',
                text: 'Kirim kode OTP untuk ganti password melalui:',
                input: 'radio',
                inputOptions: { 'wa': 'WhatsApp', 'email': 'Email' },
                inputValue: 'wa',
                showCancelButton: true,
                confirmButtonColor: '#842A3B',
                confirmButtonText: 'Kirim OTP',
                cancelButtonText: 'Batal',
                customClass: { popup: 'rounded-3xl' }
            });

            if (!selectedChannel) return; 
            channel = selectedChannel;
        }

        setActiveChannel(channel);

        axios.post('/api/v1/user/otp/request', { type, channel }).then((res) => {
            setPendingAction(type);
            setOtpCode(''); 
            setNewData(''); // Reset kolom input data baru
            setIsOtpModalOpen(true);
            
            if(res.data.debug_code) console.log("Kode OTP:", res.data.debug_code);
            Toast.fire({ icon: 'info', title: res.data.message });
        }).catch(err => {
            MySwal.fire('Gagal', err.response?.data?.message || 'Gagal mengirim OTP', 'error');
        });
    };

    // 2. FUNGSI TEMBAK API VERIFIKASI OTP
    const handleVerifyOtp = async () => {
        if (!newData) {
            Toast.fire({ icon: 'warning', title: 'Data baru tidak boleh kosong!' });
            return;
        }
        if (!otpCode || otpCode.length < 6) {
            Toast.fire({ icon: 'warning', title: 'Kode OTP harus 6 digit!' });
            return;
        }
        
        setIsVerifying(true);
        try {
            const response = await axios.post('/api/v1/user/otp/verify', {
                type: pendingAction,
                code: otpCode,
                new_data: newData
            });

            Toast.fire({ icon: 'success', title: response.data.message });
            setIsOtpModalOpen(false);
            setOtpCode('');
            setNewData('');
            
            // Refresh profil agar data di layar langsung berubah
            fetchUserData(); 

        } catch (error) {
            MySwal.fire('Gagal', error.response?.data?.message || 'Kode OTP Salah atau Kadaluarsa', 'error');
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 animate-fade-in">
            <header>
                <h2 className="text-3xl font-black text-kas-dark">Pengaturan Profil</h2>
                <p className="text-kas-soft text-sm">Kelola identitas dan keamanan akun Anda.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Info Dasar */}
                <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-kas-accent/30 shadow-sm space-y-6">
                    <form onSubmit={handleUpdateBasic} className="space-y-4">
                        <h3 className="font-bold text-lg text-kas-dark border-b pb-2">Informasi Publik</h3>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Nama Lengkap</label>
                            <div className="flex gap-2 mt-1">
                                <input 
                                    type="text" value={user.name} 
                                    onChange={e => setUser({...user, name: e.target.value})}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-kas-primary bg-kas-bg/30 text-sm font-bold text-kas-dark"
                                />
                                <button type="submit" className="px-4 py-2 bg-kas-primary text-white rounded-xl font-bold text-xs shadow-md active:scale-95 transition-all">Update</button>
                            </div>
                        </div>
                    </form>

                    <div className="space-y-4 pt-4">
                        <h3 className="font-bold text-lg text-kas-dark border-b pb-2">Data Sensitif</h3>
                        
                        <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div>
                                <div className="text-xs font-bold text-gray-400 uppercase">Alamat Email</div>
                                <div className="text-sm font-bold text-kas-dark mt-1">{user.email || '-'}</div>
                            </div>
                            <button onClick={() => triggerSensitiveUpdate('change_email')} className="text-xs font-bold text-kas-primary hover:underline px-4 py-2 bg-kas-primary/10 rounded-lg transition-colors active:bg-kas-primary/20">Ubah</button>
                        </div>

                        <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div>
                                <div className="text-xs font-bold text-gray-400 uppercase">Nomor WhatsApp</div>
                                <div className="text-sm font-bold text-kas-dark mt-1">{user.phone_wa || '-'}</div>
                            </div>
                            <button onClick={() => triggerSensitiveUpdate('change_phone')} className="text-xs font-bold text-kas-primary hover:underline px-4 py-2 bg-kas-primary/10 rounded-lg transition-colors active:bg-kas-primary/20">Ubah</button>
                        </div>
                    </div>
                </div>

                {/* Sidebar Keamanan */}
                <div className="space-y-6">
                    <div className="bg-kas-dark p-6 rounded-2xl text-white shadow-xl relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 opacity-10">
                            <ShieldCheck className="w-32 h-32" />
                        </div>
                        <h3 className="font-bold mb-4 relative z-10">Keamanan Akun</h3>
                        <p className="text-xs text-gray-400 mb-6 relative z-10 leading-relaxed">
                            Ganti password secara berkala untuk menjaga keamanan data komunitas Anda.
                        </p>
                        <button onClick={() => triggerSensitiveUpdate('change_password')} className="w-full py-3.5 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-sm transition-all border border-white/10 flex items-center justify-center gap-2 relative z-10 active:scale-95">
                            <KeyRound className="w-4 h-4" /> Ganti Password
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal OTP Dinamis dengan Form Input Data Baru */}
            {isOtpModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-kas-dark/60 backdrop-blur-sm">
                    <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md text-center animate-slide-up">
                        
                        <div className="flex justify-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-kas-primary/10 border border-kas-primary/20">
                                {activeChannel === 'email' ? <Mail className="w-6 h-6 text-kas-primary" /> : <Smartphone className="w-6 h-6 text-kas-primary" />}
                            </div>
                            {pendingAction === 'change_password' && (
                                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-kas-dark text-white shadow-lg">
                                    <KeyRound className="w-5 h-5" />
                                </div>
                            )}
                        </div>
                        
                        <h3 className="text-2xl font-black text-kas-dark tracking-tight">Perbarui Data</h3>
                        <p className="text-xs text-gray-500 mt-2 font-medium">
                            Kode rahasia telah dikirimkan ke <strong className="text-kas-dark">{activeChannel === 'email' ? 'Email' : 'WhatsApp'}</strong> Anda.
                        </p>
                        
                        <div className="mt-6 space-y-4 text-left">
                            {/* Input Data Baru */}
                            <div>
                                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                                    {pendingAction === 'change_email' ? 'Masukkan Email Baru' : 
                                     pendingAction === 'change_phone' ? 'Masukkan Nomor WA Baru' : 
                                     'Masukkan Password Baru'}
                                </label>
                                <input 
                                    type={pendingAction === 'change_email' ? 'email' : pendingAction === 'change_phone' ? 'tel' : 'text'}
                                    value={newData} 
                                    onChange={e => setNewData(e.target.value)}
                                    placeholder={pendingAction === 'change_email' ? 'contoh@mail.com' : pendingAction === 'change_phone' ? '0812...' : 'Min. 6 Karakter'}
                                    className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-100 focus:border-kas-primary outline-none transition-colors bg-gray-50 focus:bg-white text-kas-dark text-sm font-bold"
                                />
                            </div>

                            {/* Input OTP */}
                            <div>
                                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Kode OTP (6 Digit)</label>
                                <input 
                                    type="text" maxLength="6" 
                                    value={otpCode} 
                                    onChange={e => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                                    placeholder="••••••"
                                    className="w-full px-4 py-3.5 text-center text-2xl font-black tracking-[0.4em] rounded-xl border-2 border-gray-100 focus:border-kas-primary outline-none transition-colors bg-gray-50 focus:bg-white text-kas-dark placeholder-gray-300"
                                />
                            </div>
                        </div>

                        <div className="mt-8 flex gap-3">
                            <button onClick={() => setIsOtpModalOpen(false)} className="flex-1 py-3.5 font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">
                                Batal
                            </button>
                            <button onClick={handleVerifyOtp} disabled={isVerifying} className="flex-1 py-3.5 bg-kas-primary hover:bg-kas-dark text-white rounded-xl font-black shadow-lg shadow-kas-primary/30 transition-all disabled:opacity-70">
                                {isVerifying ? 'Memeriksa...' : 'Simpan Perubahan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}