import React from 'react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-kas-bg font-sans text-kas-dark selection:bg-kas-accent selection:text-kas-dark">
            
            {/* Navbar */}
            <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
                <div className="text-2xl font-extrabold tracking-tight text-kas-primary">
                    Koleksi<span className="text-kas-soft">Kas.</span>
                </div>
                <div className="space-x-4">
                    <Link to="/mitra/register" className="hidden md:inline-block font-semibold hover:text-kas-primary transition">Jadi Mitra</Link>
                    <Link to="/auth/login" className="px-5 py-2.5 bg-kas-primary/10 text-kas-primary hover:bg-kas-primary hover:text-white rounded-full font-bold transition-all">
                        Login Admin
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="container mx-auto px-6 pt-20 pb-24 text-center md:pt-32 md:pb-40">
                <div className="inline-block px-4 py-1.5 mb-6 rounded-full bg-kas-accent/30 border border-kas-accent text-kas-dark text-sm font-semibold tracking-wide">
                    🎉 Platform Kelola Iuran Komunitas #1
                </div>
                <h1 className="text-4xl md:text-6xl font-black leading-tight mb-6 text-kas-dark">
                    Tagih Iuran Tanpa Baper, <br className="hidden md:block"/>
                    <span className="text-kas-primary text-transparent bg-clip-text bg-gradient-to-r from-kas-primary to-kas-soft">
                        Otomatis Lunas Pakai QRIS!
                    </span>
                </h1>
                <p className="text-lg md:text-xl text-kas-dark/80 max-w-2xl mx-auto mb-10 leading-relaxed">
                    Tinggalkan cara lama menagih iuran di grup WhatsApp. Dengan KoleksiKas, admin tenang, member senang, dan kas komunitas selalu transparan.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <Link to="/mitra/register" className="px-8 py-4 bg-kas-primary hover:bg-kas-dark text-white rounded-xl font-bold text-lg shadow-xl shadow-kas-primary/20 transition-transform active:scale-95">
                        Daftar Sebagai Mitra
                    </Link>
                    <a href="#fitur" className="px-8 py-4 bg-white border-2 border-kas-accent hover:border-kas-primary text-kas-dark rounded-xl font-bold text-lg shadow-sm transition-colors">
                        Lihat Fitur
                    </a>
                </div>
            </header>

            {/* Features Section */}
            <section id="fitur" className="bg-white py-24 border-t border-kas-accent/30">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-kas-dark mb-4">Didesain Khusus Untuk Komunitasmu</h2>
                        <p className="text-kas-soft">Mulai dari Futsal, Minisoccer, hingga Arisan.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-10">
                        {/* Feature 1 */}
                        <div className="p-8 rounded-2xl bg-kas-bg border border-kas-accent/50 hover:shadow-xl transition-shadow group">
                            <div className="w-14 h-14 bg-kas-accent/50 rounded-xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
                                💸
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-kas-primary">Bayar Instan QRIS</h3>
                            <p className="text-kas-dark/70 leading-relaxed">Setiap jadwal main, member tinggal scan QRIS. Sistem akan otomatis menandai LUNAS tanpa perlu kirim bukti transfer.</p>
                        </div>

                        {/* Feature 2 */}
                        <div className="p-8 rounded-2xl bg-kas-bg border border-kas-accent/50 hover:shadow-xl transition-shadow group">
                            <div className="w-14 h-14 bg-kas-accent/50 rounded-xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
                                🤖
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-kas-primary">Robot WhatsApp</h3>
                            <p className="text-kas-dark/70 leading-relaxed">Tagihan baru, pengingat telat bayar, hingga laporan lunas di grup WA, semuanya dikirim otomatis oleh sistem.</p>
                        </div>

                        {/* Feature 3 */}
                        <div className="p-8 rounded-2xl bg-kas-bg border border-kas-accent/50 hover:shadow-xl transition-shadow group">
                            <div className="w-14 h-14 bg-kas-accent/50 rounded-xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
                                📊
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-kas-primary">Laporan Real-Time</h3>
                            <p className="text-kas-dark/70 leading-relaxed">Super Admin dan Mitra bisa memantau kas, riwayat kehadiran, dan status lisensi dari dashboard yang interaktif.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-kas-dark py-12 text-center text-kas-accent border-t border-kas-primary">
                <div className="text-2xl font-extrabold tracking-tight mb-4 text-white">
                    Koleksi<span className="text-kas-soft">Kas.</span>
                </div>
                <p className="opacity-80 text-sm">© 2026 RootanRoo Digital. All rights reserved.</p>
            </footer>
        </div>
    );
}