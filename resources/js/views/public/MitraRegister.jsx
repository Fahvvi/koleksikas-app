// import React, { useState } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import axios from 'axios';
// import Swal from 'sweetalert2';
// import withReactContent from 'sweetalert2-react-content';

// const MySwal = withReactContent(Swal);

// export default function MitraRegister() {
//     const navigate = useNavigate();
//     const [isLoading, setIsLoading] = useState(false);
//     const [formData, setFormData] = useState({
//         name: '', email: '', phone: '', company_name: ''
//     });

//     const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

//     const submitForm = async (e) => {
//         e.preventDefault();
//         setIsLoading(true);
//         try {
//             // 1. Tembak API Register Mitra
//             const response = await axios.post('/api/v1/mitra/register', formData);
            
//             // 2. Tampilkan pesan sukses
//             MySwal.fire({
//                 icon: 'success',
//                 title: 'Pendaftaran Berhasil!',
//                 text: 'Langkah selanjutnya: Pilih paket lisensi Anda.',
//                 confirmButtonColor: '#842A3B',
//                 confirmButtonText: 'Lanjutkan'
//             }).then(() => {
//                 // 3. Arahkan ke halaman pemilihan paket/pembayaran lisensi (membawa ID mitra)
//                 const mitraId = response.data.data.mitra_id;
//                 // Asumsi kamu akan membuat rute ini nanti:
//                 navigate(`/mitra/checkout/${mitraId}`); 
//             });

//         } catch (error) {
//             // Tangkap pesan error dari validasi Laravel (misal: email sudah dipakai)
//             const errorMsg = error.response?.data?.message || 'Terjadi kesalahan sistem. Silakan coba lagi.';
//             MySwal.fire({
//                 icon: 'error',
//                 title: 'Pendaftaran Gagal',
//                 text: errorMsg,
//                 confirmButtonColor: '#842A3B'
//             });
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     return (
//         <div className="min-h-screen bg-kas-bg flex flex-col font-sans text-kas-dark">
//             <nav className="container mx-auto px-6 py-4">
//                 <Link to="/" className="text-2xl font-extrabold tracking-tight text-kas-primary">
//                     Koleksi<span className="text-kas-soft">Kas.</span>
//                 </Link>
//             </nav>

//             <div className="flex-grow flex items-center justify-center p-6">
//                 <div className="max-w-4xl w-full grid md:grid-cols-2 bg-white rounded-3xl shadow-2xl overflow-hidden border border-kas-accent/30 animate-fade-in">
                    
//                     {/* Sisi Kiri (Informasi) */}
//                     <div className="bg-kas-primary p-10 text-white flex-col justify-between hidden md:flex relative overflow-hidden">
//                         {/* Ornamen Background Transparan */}
//                         <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-white opacity-5 rounded-full blur-3xl"></div>
                        
//                         <div className="relative z-10">
//                             <h2 className="text-3xl lg:text-4xl font-black mb-6 leading-tight">Mulai Kelola Komunitasmu Secara Profesional.</h2>
//                             <p className="text-kas-accent/90 text-lg leading-relaxed mb-8">
//                                 Bergabunglah dengan ratusan pengelola komunitas yang sudah beralih ke otomatisasi KoleksiKas.
//                             </p>
//                         </div>
                        
//                         <div className="relative z-10 text-sm font-medium text-white/60">
//                             Hanya butuh 2 menit untuk mengatur semuanya.
//                         </div>
//                     </div>

//                     {/* Sisi Kanan (Formulir) */}
//                     <div className="p-10 lg:p-12">
//                         <div className="mb-8">
//                             <h3 className="text-2xl font-black text-kas-dark">Daftar Mitra</h3>
//                             <p className="text-kas-soft text-sm font-medium mt-1">Lengkapi data untuk membuat ruang kerja komunitas Anda.</p>
//                         </div>

//                         <form onSubmit={submitForm} className="space-y-5">
//                             <div>
//                                 <label className="block text-sm font-bold text-gray-700 mb-1">Nama Pengelola (Admin)</label>
//                                 <input name="name" value={formData.name} onChange={handleChange} type="text" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-kas-primary focus:ring-1 focus:ring-kas-primary bg-gray-50 focus:bg-white outline-none transition-all" required placeholder="Cth: Budi Santoso" />
//                             </div>

//                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                                 <div>
//                                     <label className="block text-sm font-bold text-gray-700 mb-1">Email Aktif</label>
//                                     <input name="email" value={formData.email} onChange={handleChange} type="email" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-kas-primary focus:ring-1 focus:ring-kas-primary bg-gray-50 focus:bg-white outline-none transition-all" required placeholder="budi@email.com" />
//                                 </div>
//                                 <div>
//                                     <label className="block text-sm font-bold text-gray-700 mb-1">No. WhatsApp</label>
//                                     <input name="phone" value={formData.phone} onChange={handleChange} type="tel" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-kas-primary focus:ring-1 focus:ring-kas-primary bg-gray-50 focus:bg-white outline-none transition-all" required placeholder="081234567890" />
//                                 </div>
//                             </div>

//                             <div>
//                                 <label className="block text-sm font-bold text-gray-700 mb-1">Nama Komunitas / Event</label>
//                                 <input name="company_name" value={formData.company_name} onChange={handleChange} type="text" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-kas-primary focus:ring-1 focus:ring-kas-primary bg-gray-50 focus:bg-white outline-none transition-all" required placeholder="Cth: Futsal Jumat Ceria" />
//                             </div>

//                             <button type="submit" disabled={isLoading} className="w-full py-3.5 mt-4 bg-kas-primary hover:bg-kas-dark text-white rounded-xl font-bold shadow-lg shadow-kas-primary/20 transition-all active:scale-95 disabled:opacity-70">
//                                 {isLoading ? 'Memproses...' : 'Lanjutkan ke Pemilihan Paket'}
//                             </button>
//                         </form>
                        
//                         <div className="mt-6 text-center">
//                             <p className="text-gray-500 font-medium text-sm">
//                                 Sudah punya akun? <Link to="/auth/login" className="text-kas-primary font-bold hover:underline">Masuk di sini</Link>
//                             </p>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }a