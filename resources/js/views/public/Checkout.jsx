import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { QRCodeSVG } from 'qrcode.react';

const MySwal = withReactContent(Swal);

export default function Checkout() {
    const { sessionId, userId } = useParams();
    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [paymentData, setPaymentData] = useState(null);
    const [isConfirming, setIsConfirming] = useState(false);

    useEffect(() => {
        fetchPaymentData();
    }, []);

    const fetchPaymentData = async () => {
        try {
            const response = await axios.get(`/api/v1/sessions/${sessionId}/join/${userId}`);

            if (response.data.already_paid) {
                navigate('/payment/success');
                return;
            }

            setPaymentData(response.data.data);
        } catch (error) {
            setIsError(true);
            setErrorMessage(error.response?.data?.message || 'Gagal menyiapkan pembayaran. Sistem sedang sibuk.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleMarkAsPaid = async () => {
        MySwal.fire({
            title: 'Sudah Mentransfer?',
            text: 'Pastikan Anda sudah mentransfer sesuai nominal persis sebelum menekan tombol ini.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#25D366',
            confirmButtonText: 'Ya, Sudah!',
            cancelButtonText: 'Batal'
        }).then(async (result) => {
            if (result.isConfirmed) {
                setIsConfirming(true);
                try {
                    MySwal.fire({ title: 'Menghubungi Admin...', allowOutsideClick: false, didOpen: () => MySwal.showLoading() });
                    
                    await axios.post(`/api/v1/public/transactions/${paymentData.transaction_id}/mark-paid`);
                    
                    MySwal.fire({
                        icon: 'success',
                        title: 'Konfirmasi Terkirim!',
                        text: 'Admin telah menerima notifikasi. Status akan lunas setelah admin mengecek mutasi masuk.',
                        confirmButtonColor: '#842A3B'
                    }).then(() => {
                        // 👇 UBAH DI SINI: Arahkan ke halaman Payment Success 👇
                        navigate('/payment/success', { replace: true });
                    });
                } catch (e) {
                    MySwal.fire('Gagal', 'Gagal mengirim konfirmasi.', 'error');
                } finally {
                    setIsConfirming(false);
                }
            }
        });
    };

    const formatRupiah = (angka) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-kas-bg flex flex-col items-center justify-center p-4">
                <div className="w-12 h-12 border-4 border-kas-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="font-bold text-gray-500 animate-pulse">Menyiapkan QRIS Pembayaran...</p>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="min-h-screen bg-kas-bg flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-sm">
                    <div className="text-red-500 text-5xl mb-4">⚠️</div>
                    <h3 className="font-black text-gray-800 text-xl mb-2">Oops!</h3>
                    <p className="text-gray-500 mb-6">{errorMessage}</p>
                    <button onClick={() => window.location.reload()} className="bg-kas-primary text-white font-bold py-3 px-6 rounded-xl w-full">Coba Lagi</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
            
            {/* Latar Belakang "Toko" (Samar-samar) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-40 pointer-events-none">
                <h1 className="text-5xl md:text-7xl font-black text-gray-300 tracking-tighter">KoleksiKas</h1>
                <p className="text-gray-400 font-bold mt-2 text-xl">Secure Payment Gateway</p>
            </div>

            {/* --- MODAL POPUP ALA MIDTRANS (Lebih Lebar di PC) --- */}
            <div className="bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden relative z-10 animate-slide-up border border-gray-100 flex flex-col">
                
                {/* Header Modal */}
                <div className="bg-kas-primary p-6 text-center relative overflow-hidden shrink-0">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-10 -mb-10 pointer-events-none"></div>
                    <h2 className="text-white font-black text-2xl relative z-10">Penyelesaian Pembayaran</h2>
                    <p className="text-white/90 text-sm font-bold mt-1 relative z-10 tracking-wide uppercase">
                        {paymentData?.session_name}
                    </p>
                </div>

                {/* Body Modal - Dibuat Grid untuk Responsif */}
                <div className="grid grid-cols-1 md:grid-cols-2 p-6 md:p-10 gap-8 md:gap-12 bg-white">
                    
                    {/* BAGIAN KANAN DI PC / ATAS DI MOBILE (QRIS & WAKTU) */}
                    <div className="order-1 md:order-2 flex flex-col items-center justify-center">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Scan QRIS Berikut</p>
                        
                        {/* Area QR Code */}
                        <div className="p-4 bg-white border-2 border-gray-100 rounded-3xl shadow-sm w-full max-w-[280px] aspect-square flex items-center justify-center overflow-hidden">
                            {paymentData?.is_static ? (
                                <img 
                                    src={paymentData?.qr_string} 
                                    alt="QRIS Statis" 
                                    className="max-w-full max-h-full object-contain mix-blend-multiply" 
                                />
                            ) : (
                                <QRCodeSVG value={paymentData?.qr_string} size={220} />
                            )}
                        </div>

                        <div className="flex items-center justify-center gap-3 mt-4 mb-6">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/a/a2/Logo_QRIS.svg" alt="QRIS" className="h-6" />
                        </div>

                        {/* Kotak Info Tenggat Waktu */}
                        <div className="w-full text-left bg-blue-50/50 border border-blue-100 p-4 rounded-xl text-xs space-y-3">
                            {!paymentData?.is_static && (
                                <div className="flex items-start gap-3">
                                    <div className="text-blue-500 text-lg">⏱️</div>
                                    <div>
                                        <p className="font-bold text-gray-700">Batas Scan QRIS</p>
                                        <p className="text-gray-500">Berlaku s/d: <b className="text-red-500">{paymentData?.qris_expires_at}</b></p>
                                    </div>
                                </div>
                            )}
                            <div className={`flex items-start gap-3 ${!paymentData?.is_static ? 'border-t border-blue-100/50 pt-2' : ''}`}>
                                <div className="text-blue-500 text-lg">📅</div>
                                <div>
                                    <p className="font-bold text-gray-700">Tenggat Akhir Pelunasan Sesi</p>
                                    <p className="text-gray-500">Sesuai jadwal: <b className="text-gray-800">{paymentData?.due_date}</b></p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* BAGIAN KIRI DI PC / BAWAH DI MOBILE (RINCIAN & TOMBOL) */}
                    <div className="order-2 md:order-1 flex flex-col justify-center">
                        
                        <div className="mb-8">
                            <p className="text-sm font-bold text-gray-500 mb-1">Total Pembayaran</p>
                            <h3 className="text-5xl md:text-6xl font-black text-kas-dark tracking-tight">
                                {formatRupiah(paymentData?.grand_total || 0)}
                            </h3>
                        </div>

                        {/* Kotak Rincian */}
                        <div className="bg-gray-50 p-5 rounded-2xl mb-8 text-left text-sm space-y-4 border border-gray-100 shadow-inner">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 font-medium">Tagihan / Iuran</span>
                                <span className="font-bold text-gray-800">{formatRupiah(paymentData?.base_amount || 0)}</span>
                            </div>

                            {/* Rincian Tambahan Hanya Tampil Jika QRIS Dinamis (Ada Biaya) */}
                            {!paymentData?.is_static && (
                                <>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500 font-medium">Biaya Platform KoleksiKas</span>
                                        <span className="font-bold text-gray-800">{formatRupiah(paymentData?.platform_fee || 0)}</span>
                                    </div>

                                    <div className="flex justify-between items-start">
                                        <div className="flex flex-col">
                                            <span className="text-gray-500 font-medium flex items-center gap-2">
                                                Layanan QRIS Dinamis
                                            </span>
                                            <span className="text-gray-400 text-[10px] leading-tight mt-0.5">
                                                Dibayarkan ke Payment Gateway
                                            </span>
                                        </div>
                                        <span className="font-bold text-gray-800">{formatRupiah(paymentData?.pakasir_fee || 0)}</span>
                                    </div>
                                </>
                            )}
                            
                            <div className="border-t border-dashed border-gray-300 pt-4 mt-2 flex justify-between items-center">
                                <span className="font-black text-gray-700">Total Keseluruhan</span>
                                <span className="font-black text-lg text-kas-primary">{formatRupiah(paymentData?.grand_total || 0)}</span>
                            </div>
                        </div>

                        {/* Tombol Aksi Konfirmasi (Khusus Statis) */}
                        <div className="mt-auto space-y-3">
                            {paymentData?.is_static ? (
                                <button 
                                    onClick={handleMarkAsPaid}
                                    disabled={isConfirming}
                                    className="w-full py-4 bg-[#25D366] hover:bg-[#1DA851] text-white rounded-2xl font-black text-lg shadow-lg shadow-green-200 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isConfirming ? 'Memproses...' : <><span>✅</span> SAYA SUDAH MEMBAYAR</>}
                                </button>
                            ) : (
                                <div className="text-center p-4 bg-green-50 border border-green-100 rounded-2xl">
                                    <p className="text-xs font-bold text-green-700">✅ Sistem memverifikasi pembayaran Anda otomatis. Anda dapat menutup halaman ini setelah membayar.</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                {/* Footer Modal */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 text-center shrink-0">
                    <button 
                        onClick={() => navigate('/')} 
                        className="text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors"
                    >
                        Batal & Kembali ke Beranda
                    </button>
                </div>
            </div>
        </div>
    );
}