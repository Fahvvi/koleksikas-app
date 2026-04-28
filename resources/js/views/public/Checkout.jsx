import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';

export default function Checkout() {
    const { sessionId, userId } = useParams();
    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [paymentData, setPaymentData] = useState(null);

    useEffect(() => {
        fetchPaymentData();
    }, []);

    const fetchPaymentData = async () => {
        try {
            // Tembak API Backend kita
            const response = await axios.get(`/api/v1/sessions/${sessionId}/join/${userId}`);

            // Cek jika statusnya sudah pernah dibayar
            if (response.data.already_paid) {
                navigate('/payment/success');
                return;
            }

            // Simpan data QRIS dan nominal
            setPaymentData(response.data.data);
        } catch (error) {
            setIsError(true);
            setErrorMessage(error.response?.data?.message || 'Gagal menyiapkan pembayaran. Sistem sedang sibuk.');
        } finally {
            setIsLoading(false);
        }
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
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 relative overflow-hidden">
            
            {/* Latar Belakang "Toko" (Samar-samar) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-40 pointer-events-none">
                <h1 className="text-5xl md:text-7xl font-black text-gray-300 tracking-tighter">KoleksiKas</h1>
                <p className="text-gray-400 font-bold mt-2 text-xl">Secure Payment Gateway</p>
            </div>

            {/* --- MODAL POPUP ALA MIDTRANS --- */}
            <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden relative z-10 animate-slide-up border border-gray-100">
                
                {/* Header Modal */}
                <div className="bg-kas-primary p-6 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-10 -mb-10"></div>
                    <h2 className="text-white font-black text-2xl relative z-10">Pembayaran Iuran</h2>
                    <p className="text-white/90 text-sm font-bold mt-1 relative z-10 tracking-wide uppercase">
                        {paymentData?.session_name}
                    </p>
                </div>

                {/* Body Modal */}
                <div className="p-6 text-center bg-white">
                    
                    <p className="text-sm font-bold text-gray-500 mb-1">Total Pembayaran</p>
                    <h3 className="text-4xl font-black text-gray-800 tracking-tight mb-6">
                        {/* Ubah dari amount menjadi grand_total */}
                        {formatRupiah(paymentData?.grand_total || 0)}
                    </h3>

                    {/* --- KOTAK RINCIAN TAGIHAN (DIUPDATE) --- */}
                    <div className="bg-gray-50 p-4 rounded-2xl mb-6 text-left text-sm space-y-3 border border-gray-100 shadow-inner">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 font-medium">Harga Sesi Mabar</span>
                            <span className="font-bold text-gray-800">{formatRupiah(paymentData?.base_amount || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 font-medium">Biaya Platform KoleksiKas</span>
                            <span className="font-bold text-gray-800">{formatRupiah(paymentData?.platform_fee || 0)}</span>
                        </div>
                        {/* PERBAIKAN LAYANAN QRIS + DISCLAIMER */}
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col">
                                <span className="text-gray-500 font-medium flex items-center gap-2">
                                    Layanan QRIS 
                                    <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-md font-bold tracking-wider">
                                        0.7% + Rp 310
                                    </span>
                                </span>
                                {/* Disclaimer Kecil di Bawah */}
                                <span className="text-gray-400 text-[10px] leading-tight">
                                    Dibayarkan ke Payment Gateway
                                </span>
                            </div>
                            <span className="font-bold text-gray-800">{formatRupiah(paymentData?.pakasir_fee || 0)}</span>
                        </div>
                        
                        {/* Garis Pembatas Subtotal */}
                        <div className="border-t border-dashed border-gray-300 pt-3 mt-1 flex justify-between items-center">
                            <span className="font-black text-gray-700">Total Keseluruhan</span>
                            <span className="font-black text-lg text-kas-primary">{formatRupiah(paymentData?.grand_total || 0)}</span>
                        </div>
                    </div>

                    {/* --- AREA QR CODE SVG --- */}
                    <div className="bg-white p-4 rounded-3xl inline-block border-2 border-gray-100 shadow-sm relative group mb-4">
                        <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-kas-primary rounded-tl-xl"></div>
                        <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-kas-primary rounded-tr-xl"></div>
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-kas-primary rounded-bl-xl"></div>
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-kas-primary rounded-br-xl"></div>
                        
                        {paymentData?.qr_string ? (
                            <QRCodeSVG 
                                value={paymentData.qr_string} 
                                size={200} 
                                bgColor={"#ffffff"} 
                                fgColor={"#1f2937"} 
                                level={"Q"} 
                            />
                        ) : (
                            <div className="w-[200px] h-[200px] flex items-center justify-center bg-gray-50 text-gray-400 font-medium text-sm">QR Gagal Dimuat</div>
                        )}
                    </div>

                    <div className="flex items-center justify-center gap-3">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/a/a2/Logo_QRIS.svg" alt="QRIS" className="h-6" />
                    </div>

                    {/* --- KOTAK INFO TENGGAT WAKTU --- */}
                    <div className="mt-6 text-left bg-blue-50/50 border border-blue-100 p-4 rounded-xl text-xs space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="text-blue-500 text-lg">⏱️</div>
                            <div>
                                <p className="font-bold text-gray-700">Batas Scan QRIS</p>
                                <p className="text-gray-500">Berlaku s/d: <b className="text-red-500">{paymentData?.qris_expires_at}</b></p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 border-t border-blue-100/50 pt-2">
                            <div className="text-blue-500 text-lg">📅</div>
                            <div>
                                <p className="font-bold text-gray-700">Tenggat Akhir Pelunasan Sesi</p>
                                <p className="text-gray-500">Sesuai jadwal: <b className="text-gray-800">{paymentData?.due_date}</b></p>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer Modal */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
                    <button 
                        onClick={() => navigate('/')} 
                        className="text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors"
                    >
                        Batalkan Pembayaran
                    </button>
                </div>
            </div>
        </div>
    );

}