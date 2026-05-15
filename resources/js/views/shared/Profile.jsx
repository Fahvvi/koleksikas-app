import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

export default function UserProfile() {
    const [user, setUser] = useState({ name: '', email: '', phone_wa: '' });
    const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' });
    const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [pendingAction, setPendingAction] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const Toast = MySwal.mixin({
        toast: true, position: 'top-end', showConfirmButton: false, timer: 3000,
    });

    useEffect(() => {
        axios.get('/api/v1/user/profile').then(res => {
            setUser(res.data.data);
            setIsLoading(false);
        });
    }, []);

    const handleUpdateBasic = async (e) => {
        e.preventDefault();
        try {
            // Update nama (Tanpa OTP sesuai request)
            await axios.put('/api/v1/user/profile/basic', { name: user.name });
            Toast.fire({ icon: 'success', title: 'Nama berhasil diubah!' });
        } catch (err) {
            MySwal.fire('Gagal', 'Gagal update nama', 'error');
        }
    };

    const triggerSensitiveUpdate = async (type) => {
        let channel = 'wa'; // Default channel

        // Jika mengubah password, berikan opsi pilihan
        if (type === 'change_password') {
            const { value: selectedChannel } = await MySwal.fire({
                title: 'Pilih Metode Verifikasi',
                text: 'Kirim kode OTP untuk ganti password melalui:',
                input: 'radio',
                inputOptions: {
                    'wa': 'WhatsApp',
                    'email': 'Email'
                },
                inputValue: 'wa', // Default yang terpilih
                showCancelButton: true,
                confirmButtonColor: '#842A3B',
                confirmButtonText: 'Kirim OTP',
                cancelButtonText: 'Batal',
                customClass: { popup: 'rounded-3xl' }
            });

            if (!selectedChannel) return; // Batalkan jika user klik di luar / cancel
            channel = selectedChannel;
        }

        // Kirim Request
        axios.post('/api/v1/user/otp/request', { type, channel }).then((res) => {
            setPendingAction(type);
            setIsOtpModalOpen(true);
            
            // Tampilkan debug code di Console jika local
            if(res.data.debug_code) console.log("Kode OTP:", res.data.debug_code);
            
            Toast.fire({ icon: 'info', title: res.data.message });
        }).catch(err => {
            MySwal.fire('Gagal', err.response?.data?.message || 'Gagal mengirim OTP', 'error');
        });
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
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-kas-primary bg-kas-bg/30 text-sm"
                                />
                                <button className="px-4 py-2 bg-kas-primary text-white rounded-xl font-bold text-xs">Update</button>
                            </div>
                        </div>
                    </form>

                    <div className="space-y-4 pt-4">
                        <h3 className="font-bold text-lg text-kas-dark border-b pb-2">Data Sensitif</h3>
                        
                        <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div>
                                <div className="text-xs font-bold text-gray-400 uppercase">Alamat Email</div>
                                <div className="text-sm font-bold text-kas-dark">{user.email}</div>
                            </div>
                            <button onClick={() => triggerSensitiveUpdate('change_email')} className="text-xs font-bold text-kas-primary hover:underline">Ubah</button>
                        </div>

                        <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div>
                                <div className="text-xs font-bold text-gray-400 uppercase">Nomor WhatsApp</div>
                                <div className="text-sm font-bold text-kas-dark">{user.phone_wa}</div>
                            </div>
                            <button onClick={() => triggerSensitiveUpdate('change_phone')} className="text-xs font-bold text-kas-primary hover:underline">Ubah</button>
                        </div>
                    </div>
                </div>

                {/* Sidebar Keamanan */}
                <div className="space-y-6">
                    <div className="bg-kas-dark p-6 rounded-2xl text-white shadow-xl">
                        <h3 className="font-bold mb-4">Keamanan Akun</h3>
                        <p className="text-xs text-gray-400 mb-6">Ganti password secara berkala untuk menjaga keamanan data komunitas Anda.</p>
                        <button onClick={() => triggerSensitiveUpdate('change_password')} className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-sm transition-all">
                            🔐 Ganti Password
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal OTP */}
            {isOtpModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-kas-dark/60 backdrop-blur-sm">
                    <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm text-center">
                        <div className="text-4xl mb-4">📱</div>
                        <h3 className="text-xl font-black text-kas-dark">Verifikasi OTP</h3>
                        <p className="text-sm text-gray-500 mt-2">Masukkan 6 digit kode yang dikirim ke nomor WhatsApp Anda.</p>
                        
                        <input 
                            type="text" maxLength="6" 
                            value={otpCode} onChange={e => setOtpCode(e.target.value)}
                            className="w-full mt-6 px-4 py-4 text-center text-2xl font-black tracking-[10px] rounded-2xl border-2 border-kas-bg focus:border-kas-primary outline-none"
                        />

                        <div className="mt-8 flex gap-3">
                            <button onClick={() => setIsOtpModalOpen(false)} className="flex-1 py-3 font-bold text-gray-400">Batal</button>
                            <button className="flex-1 py-3 bg-kas-primary text-white rounded-xl font-bold">Verifikasi</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}