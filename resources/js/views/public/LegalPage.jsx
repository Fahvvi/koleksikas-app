import React, { useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { DynamicIslandTOC } from '../../components/DynamicIslandTOC';

export default function LegalPage() {
    const { hash } = useLocation();

    useEffect(() => {
        if (hash) {
            setTimeout(() => {
                const element = document.getElementById(hash.substring(1));
                if (element) {
                    // Mengurangi offset di mobile agar scroll jatuhnya pas
                    const yOffset = window.innerWidth < 768 ? -80 : -100;
                    const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
                    window.scrollTo({ top: y, behavior: 'smooth' });
                }
            }, 300);
        } else {
            window.scrollTo(0, 0);
        }
    }, [hash]);

    return (
        <div className="min-h-screen bg-gray-50 text-kas-dark pb-40 font-sans selection:bg-kas-accent selection:text-kas-dark overflow-x-hidden">
            {/* Navbar Simple */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 md:px-8 py-3 md:py-4 flex justify-between items-center shadow-sm">
                <Link to="/" className="flex items-center gap-2 text-kas-dark font-bold hover:text-kas-primary transition-colors text-sm md:text-base">
                    <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 shrink-0" /> 
                    <span className="hidden sm:inline">Kembali ke Beranda</span>
                    <span className="sm:hidden">Kembali</span>
                </Link>
                <div className="flex items-center gap-1.5 md:gap-2 bg-kas-primary/10 px-3 py-1.5 rounded-full shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5 md:w-4 md:h-4 text-kas-primary" />
                    <span className="text-[10px] md:text-xs font-black text-kas-primary tracking-widest uppercase truncate">Legal Center</span>
                </div>
            </nav>

            {/* Konten dengan TOC Island */}
            <DynamicIslandTOC selector="article h2">
                <main className="max-w-3xl mx-auto px-5 md:px-6 pt-10 md:pt-16">
                    <div className="mb-10 md:mb-16 border-b border-gray-200 pb-8 md:pb-10">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-kas-dark mb-3 md:mb-4 tracking-tight leading-tight">
                            Pusat Informasi Hukum & Kebijakan
                        </h1>
                        <p className="text-sm md:text-lg text-gray-500 font-medium">Pembaruan Terakhir: 12 Mei 2026</p>
                    </div>

                    <article className="space-y-12 md:space-y-16">
                        {/* SECTION 1 */}
                        <section>
                            <h2 id="syarat-ketentuan" data-toc-title="Syarat & Ketentuan" className="text-2xl md:text-3xl font-black text-kas-dark mb-4 md:mb-6 flex items-start sm:items-center gap-2 md:gap-3 leading-snug">
                                <span className="text-kas-primary/30 shrink-0 mt-0.5 sm:mt-0">#</span> 
                                <span>Syarat & Ketentuan</span>
                            </h2>
                            <div className="space-y-4 text-sm md:text-base text-gray-600 font-medium leading-relaxed break-words">
                                <p>Selamat datang di platform KoleksiKAS. Dengan mendaftar, mengakses, atau menggunakan layanan kami, Anda menyetujui untuk terikat oleh Syarat dan Ketentuan ini.</p>
                                <p>KoleksiKAS merupakan penyedia layanan perangkat lunak (SaaS) yang memfasilitasi pencatatan kas dan iuran, BUKAN lembaga perbankan atau penyedia dompet digital langsung. Seluruh arus dana diproses oleh Payment Gateway pihak ketiga yang berlisensi Bank Indonesia.</p>
                            </div>
                        </section>

                        {/* SECTION 2 */}
                        <section>
                            <h2 id="kebijakan-privasi" data-toc-title="Kebijakan Privasi" className="text-2xl md:text-3xl font-black text-kas-dark mb-4 md:mb-6 flex items-start sm:items-center gap-2 md:gap-3 leading-snug">
                                <span className="text-kas-primary/30 shrink-0 mt-0.5 sm:mt-0">#</span> 
                                <span>Kebijakan Privasi</span>
                            </h2>
                            <div className="space-y-4 text-sm md:text-base text-gray-600 font-medium leading-relaxed break-words">
                                <p>Privasi Anda adalah prioritas kami. Kami hanya mengumpulkan data yang diperlukan untuk operasional komunitas Anda, seperti nama, nomor WhatsApp, dan riwayat transaksi.</p>
                                <p>Kami tidak pernah menjual data Anda ke pihak ketiga. Informasi nomor telepon hanya digunakan untuk keperluan pengiriman notifikasi WhatsApp tagihan dan OTP.</p>
                            </div>
                        </section>

                        {/* SECTION 3 */}
                        <section>
                            <h2 id="kebijakan-penarikan" data-toc-title="Kebijakan Penarikan" className="text-2xl md:text-3xl font-black text-kas-dark mb-4 md:mb-6 flex items-start sm:items-center gap-2 md:gap-3 leading-snug">
                                <span className="text-kas-primary/30 shrink-0 mt-0.5 sm:mt-0">#</span> 
                                <span>Kebijakan Penarikan Dana</span>
                            </h2>
                            <div className="space-y-4 text-sm md:text-base text-gray-600 font-medium leading-relaxed break-words">
                                <p>Penarikan dana (Withdrawal) ke rekening komunitas tunduk pada aturan penyelesaian (Settlement) dari Bank Indonesia dan Payment Gateway.</p>
                                <ul className="list-disc pl-5 md:pl-6 space-y-2 mt-4 text-gray-700">
                                    <li>Dana dari pembayaran QRIS akan masuk ke Saldo Mengendap setelah H+1 (Hari Kerja).</li>
                                    <li>Minimal penarikan dana adalah Rp 50.000.</li>
                                    <li>Biaya transfer antar bank (jika ada) akan dipotong langsung dari total dana yang ditarik.</li>
                                </ul>
                            </div>
                        </section>

                        {/* SECTION 4 */}
                        <section>
                            <h2 id="laporan-keamanan" data-toc-title="Laporan Keamanan" className="text-2xl md:text-3xl font-black text-kas-dark mb-4 md:mb-6 flex items-start sm:items-center gap-2 md:gap-3 leading-snug">
                                <span className="text-kas-primary/30 shrink-0 mt-0.5 sm:mt-0">#</span> 
                                <span>Laporan Keamanan</span>
                            </h2>
                            <div className="space-y-4 text-sm md:text-base text-gray-600 font-medium leading-relaxed break-words">
                                <p>KoleksiKAS berkomitmen menjaga standar keamanan industri. Jika Anda adalah seorang peneliti keamanan dan menemukan kerentanan pada sistem kami, kami sangat mengapresiasi laporan Anda.</p>
                                <p>Silakan kirimkan detail temuan Anda ke <strong className="text-kas-primary break-all">security@rootanroo.com</strong>. Kami menjamin tidak akan menempuh jalur hukum terhadap pelapor yang bertindak dengan itikad baik (Bug Bounty Program).</p>
                            </div>
                        </section>
                    </article>
                </main>
            </DynamicIslandTOC>
        </div>
    );
}