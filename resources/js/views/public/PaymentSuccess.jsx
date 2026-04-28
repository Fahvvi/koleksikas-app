import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function PaymentSuccess() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 animate-fade-in">
            <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl max-w-md w-full text-center border border-green-100">
                {/* Ikon Sukses Animasi */}
                <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                    </svg>
                </div>
                
                <h2 className="text-3xl font-black text-gray-800 mb-2">Pembayaran Berhasil!</h2>
                <p className="text-gray-500 mb-8 leading-relaxed">
                    Terima kasih! Pembayaran Anda telah kami terima. Silakan cek <b>WhatsApp</b> Anda untuk melihat detail konfirmasi dan e-tiket mabar.
                </p>
                
                <button
                    onClick={() => navigate('/')}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-green-500/30 active:scale-95"
                >
                    Kembali ke Beranda
                </button>
            </div>
        </div>
    );
}