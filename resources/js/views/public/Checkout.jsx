import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { QRCodeSVG } from 'qrcode.react';
import { ChevronDown, ChevronUp, Info, AlertCircle, Clock, Zap } from 'lucide-react';

const MySwal = withReactContent(Swal);

export default function Checkout() {
    const { sessionId, userId } = useParams();
    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [paymentData, setPaymentData] = useState(null);
    const [isConfirming, setIsConfirming] = useState(false);
    
    // UX States
    const [showFeeDetails, setShowFeeDetails] = useState(false);
    const [timeLeft, setTimeLeft] = useState('');
    const [isExpired, setIsExpired] = useState(false);

    // 🔧 Fungsi Cerdas untuk Menerjemahkan Tanggal Laravel/Indonesia ke JS Date
    const parseBackendDate = (dateStr) => {
        if (!dateStr) return new Date(NaN);
        
        // 1. TANGKAP FORMAT ANEH (Contoh: "12 May 2026, [09:31] 200146")
        // Regex ini akan mengambil: Tanggal, Bulan, Tahun, Jam, dan Menit.
        const weirdFormatRegex = /(\d{1,2})\s+([A-Za-z]+)\s+(\d{4}),\s*\[(\d{2}):(\d{2})\]/;
        const match = dateStr.match(weirdFormatRegex);
        
        if (match) {
            // Merakit ulang menjadi format standar yang dimengerti JS: "May 12, 2026 09:31:00"
            const cleanDateStr = `${match[2]} ${match[1]}, ${match[3]} ${match[4]}:${match[5]}:00`;
            return new Date(cleanDateStr);
        }

        // 2. Coba format standar MySQL (YYYY-MM-DD HH:mm:ss)
        if (dateStr.includes('-') && dateStr.includes(':')) {
            let isoStr = dateStr.replace(' ', 'T');
            let d = new Date(isoStr);
            if (!isNaN(d.getTime())) return d;
        }

        // 3. Jika format Teks Standar Bahasa Indonesia (30 Mei 2026 08:00)
        const idMonths = {
            'Januari': 'Jan', 'Februari': 'Feb', 'Maret': 'Mar', 'April': 'Apr', 
            'Mei': 'May', 'Juni': 'Jun', 'Juli': 'Jul', 'Agustus': 'Aug', 'Agt': 'Aug', 
            'September': 'Sep', 'Oktober': 'Oct', 'Okt': 'Oct', 'November': 'Nov', 
            'Desember': 'Dec', 'Des': 'Dec'
        };
        
        let enStr = dateStr.replace(/,/g, ''); 
        Object.keys(idMonths).forEach(id => {
            enStr = enStr.replace(new RegExp(id, 'gi'), idMonths[id]);
        });

        return new Date(enStr);
    };

    useEffect(() => {
        fetchPaymentData();
    }, []);

    // 🕒 Efek untuk Countdown Timer
    useEffect(() => {
        // Jika is_static atau data kosong, berhenti.
        if (!paymentData || paymentData.is_static) return;

        // Jika API ternyata TIDAK MENGIRIM qris_expires_at, kita gunakan due_date sebagai fallback
        const rawDate = paymentData.qris_expires_at || paymentData.due_date;
        if (!rawDate) return;

        const targetDate = parseBackendDate(rawDate);

        const timer = setInterval(() => {
            const now = new Date();
            const difference = targetDate - now;

            // Jika JS masih tetap gagal parsing
            if (isNaN(difference)) {
                setTimeLeft('Format Error'); 
                clearInterval(timer);
                return;
            }

            if (difference <= 0) {
                clearInterval(timer);
                setTimeLeft('00:00:00');
                setIsExpired(true);
            } else {
                const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
                const minutes = Math.floor((difference / 1000 / 60) % 60);
                const seconds = Math.floor((difference / 1000) % 60);
                
                setTimeLeft(
                    `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
                );
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [paymentData]);

    const fetchPaymentData = async () => {
        try {
            const response = await axios.get(`/api/v1/sessions/${sessionId}/join/${userId}${window.location.search}`);
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
            cancelButtonText: 'Batal',
            customClass: { popup: 'rounded-3xl' }
        }).then(async (result) => {
            if (result.isConfirmed) {
                setIsConfirming(true);
                try {
                    MySwal.fire({ title: 'Menghubungi Admin...', allowOutsideClick: false, didOpen: () => MySwal.showLoading() });
                    await axios.post(`/api/v1/public/transactions/${paymentData.transaction_id}/mark-paid`);
                    
                    MySwal.fire({
                        icon: 'success', title: 'Konfirmasi Terkirim!',
                        text: 'Admin telah menerima notifikasi. Status akan lunas setelah admin mengecek mutasi masuk.',
                        confirmButtonColor: '#842A3B', customClass: { popup: 'rounded-3xl' }
                    }).then(() => navigate('/payment/success', { replace: true }));
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
                <div className="bg-white p-8 rounded-[2rem] shadow-xl text-center max-w-sm border border-gray-100">
                    <div className="text-red-500 text-5xl mb-4">⚠️</div>
                    <h3 className="font-black text-gray-800 text-xl mb-2">Oops!</h3>
                    <p className="text-gray-500 mb-6 font-medium text-sm">{errorMessage}</p>
                    <button onClick={() => window.location.reload()} className="bg-kas-primary hover:bg-kas-dark text-white font-bold py-3 px-6 rounded-xl w-full transition-colors">Coba Lagi</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-kas-accent selection:text-kas-dark">
            
            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-30 pointer-events-none select-none">
                <h1 className="text-6xl md:text-8xl font-black text-gray-300 tracking-tighter">KoleksiKAS</h1>
                <p className="text-gray-400 font-bold mt-2 text-xl tracking-widest uppercase">Secure Gateway</p>
            </div>

            <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden relative z-10 animate-slide-up border border-gray-100 flex flex-col">
                
                <div className="bg-kas-dark p-6 md:p-8 text-center relative overflow-hidden shrink-0">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-kas-primary opacity-30 rounded-full -mr-10 -mt-10 blur-xl pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-kas-soft opacity-20 rounded-full -ml-10 -mb-10 blur-lg pointer-events-none"></div>
                    <h2 className="text-white font-black text-2xl relative z-10">Penyelesaian Pembayaran</h2>
                    <p className="text-kas-accent text-xs font-bold mt-1.5 relative z-10 tracking-widest uppercase">
                        {paymentData?.session_name}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 p-6 md:p-10 gap-8 md:gap-12 bg-white">
                    
                    <div className="order-2 md:order-1 flex flex-col justify-center">
                        <div className="mb-6">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Total Keseluruhan</p>
                            <h3 className="text-5xl md:text-6xl font-black text-kas-primary tracking-tight">
                                {formatRupiah(paymentData?.grand_total || 0)}
                            </h3>
                        </div>

                        <div className="bg-gray-50 rounded-2xl mb-8 border border-gray-200 overflow-hidden">
                            <button onClick={() => setShowFeeDetails(!showFeeDetails)} className="w-full p-4 flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition-colors outline-none">
                                <span className="font-bold text-gray-700 text-sm">Lihat Rincian Pembayaran</span>
                                {showFeeDetails ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                            </button>
                            
                            {showFeeDetails && (
                                <div className="p-4 pt-0 text-sm space-y-3 border-t border-gray-200/50 mt-1">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500 font-medium">Tagihan / Iuran Utama</span>
                                        <span className="font-bold text-gray-800">{formatRupiah(paymentData?.base_amount || 0)}</span>
                                    </div>
                                    {!paymentData?.is_static && (
                                        <>
                                            {Number(paymentData?.platform_fee) > 0 && (
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-500 font-medium">Biaya Platform KoleksiKAS</span>
                                                    <span className="font-bold text-gray-800">{formatRupiah(paymentData?.platform_fee || 0)}</span>
                                                </div>
                                            )}
                                            {Number(paymentData?.pakasir_fee) > 0 && (
                                                <div className="flex justify-between items-start">
                                                    <div className="flex flex-col">
                                                        <span className="text-gray-500 font-medium flex items-center gap-1.5">Biaya Layanan QRIS <Info className="w-3.5 h-3.5 text-gray-400" /></span>
                                                        <span className="text-gray-400 text-[10px] leading-tight mt-0.5 max-w-[200px]">Diteruskan ke pihak Payment Gateway</span>
                                                    </div>
                                                    <span className="font-bold text-gray-800 mt-0.5">{formatRupiah(paymentData?.pakasir_fee || 0)}</span>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="mt-auto space-y-3">
                            {paymentData?.is_static ? (
                                <button onClick={handleMarkAsPaid} disabled={isConfirming} className="w-full py-4 bg-[#25D366] hover:bg-[#1DA851] text-white rounded-2xl font-black text-lg shadow-lg shadow-green-200 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                                    {isConfirming ? 'Memproses...' : <><span>✅</span> SAYA SUDAH TRANSFER</>}
                                </button>
                            ) : (
                                <div className="flex items-start gap-3 p-4 bg-kas-primary/5 border border-kas-primary/20 rounded-2xl">
                                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0"><Zap className="w-4 h-4 text-kas-primary" /></div>
                                    <p className="text-xs font-bold text-kas-dark/80 leading-relaxed mt-0.5">Sistem akan mendeteksi pembayaran Anda secara otomatis. Tidak perlu konfirmasi manual.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="order-1 md:order-2 flex flex-col items-center justify-center bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
                        <p className="text-xs font-black text-kas-dark uppercase tracking-widest mb-4">Scan QRIS Berikut</p>
                        
                        <div className="p-4 bg-white border-2 border-gray-200 rounded-[2rem] shadow-sm w-full max-w-[260px] aspect-square flex items-center justify-center overflow-hidden relative">
                            {isExpired ? (
                                <div className="text-center flex flex-col items-center">
                                    <AlertCircle className="w-12 h-12 text-red-500 mb-2" />
                                    <p className="font-black text-red-500 text-lg">QRIS HANGUS</p>
                                    <p className="text-xs text-gray-500 font-medium mt-1">Silakan muat ulang halaman atau buat tagihan baru.</p>
                                </div>
                            ) : paymentData?.is_static ? (
                                <img src={paymentData?.qr_string} alt="QRIS Statis" className="max-w-full max-h-full object-contain mix-blend-multiply" />
                            ) : (
                                <QRCodeSVG value={paymentData?.qr_string} size={220} />
                            )}
                            {isExpired && <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px]"></div>}
                        </div>

                        <div className="flex items-center justify-center gap-3 mt-5 mb-6">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/a/a2/Logo_QRIS.svg" alt="QRIS" className={`h-6 ${isExpired ? 'grayscale opacity-50' : ''}`} />
                        </div>

                        <div className="w-full text-left bg-white border border-gray-200 p-4 rounded-xl text-xs space-y-3 shadow-sm">
                            {!paymentData?.is_static && (
                                <>
                                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-orange-500" />
                                            <span className="font-bold text-gray-600">Batas Waktu Bayar</span>
                                        </div>
                                        {isExpired ? (
                                            <span className="font-black text-red-500 bg-red-50 px-2 py-1 rounded">EXPIRED</span>
                                        ) : (
                                            <span className="font-black text-orange-600 bg-orange-50 px-2 py-1 rounded tracking-wider text-sm">
                                                {timeLeft || '--:--:--'}
                                            </span>
                                        )}
                                    </div>
                                    {/* 👇 DEBUGGING AREA: Menampilkan Data Asli API 👇 */}
                                    {timeLeft === 'Format Error' && (
                                        <div className="pb-3 border-b border-gray-100">
                                            <span className="text-red-500">Error Parsing. Data Asli: {paymentData?.qris_expires_at || 'Null/Kosong'}</span>
                                        </div>
                                    )}
                                </>
                            )}
                            <div className="flex items-center justify-between pt-1">
                                <span className="font-bold text-gray-500">Tenggat Sesi</span>
                                <span className="font-black text-gray-800">{paymentData?.due_date}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-5 bg-gray-50 border-t border-gray-200 text-center shrink-0">
                    <button onClick={() => navigate('/')} className="text-sm font-bold text-gray-500 hover:text-kas-primary transition-colors inline-flex items-center gap-2">
                        ← Batal & Kembali ke Beranda
                    </button>
                </div>
            </div>
        </div>
    );
}