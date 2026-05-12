import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from "framer-motion";
import {
  CheckCircle2, Users, Zap, Clock, MessageSquare, CreditCard,
  Globe, Shield, BarChart3, ArrowRight, Sparkles, Rocket, Star,
  Search, MapPin
} from "lucide-react";

import { AuroraBackground } from '../../components/AuroraBackground'; 
import { TextHoverEffect } from '../../components/TextHoverEffect';
import { FadeText } from '../../components/FadeText';

// ==========================================
// KOMPONEN PRICING CARD (GLOW & ROTATING BORDER)
// ==========================================
const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

function PricingCard({ tier, index }) {
  // Parsing Fitur dari JSON API agar tidak ada string aneh (basic_report, dll)
  let parsedFeatures = [];
  try {
      let parsed = typeof tier.features === 'string' ? JSON.parse(tier.features) : tier.features;
      
      // Kamus translasi agar bahasa mesin berubah jadi bahasa marketing
      const featureLabels = {
          'wa_group_notif': 'Notifikasi WhatsApp Group',
          'wa_bot_bill': 'Tagihan otomatis via WA Bot',
          'export_pdf': 'Export PDF Laporan Absensi',
          'finance_recap': 'Rekap keuangan komunitas',
          'qris': 'Pembayaran QRIS Otomatis',
          'wa_personal': 'Kirim Pesan WA Personal',
          'wa_group': 'Kirim Pesan WA ke Grup',
          'multi_admin': 'Dukungan Multi-Admin',
          'export': 'Export Data Excel & PDF',
          'custom_wa_template': 'Kustomisasi Pesan WA Bot',
          'auto_recap': 'Rekapitulasi Kas Otomatis',
          'allowed_gateways': 'Bebas Pilih Payment Gateway',
          'basic_report': 'Laporan Analitik Komprehensif'
      };

      if (typeof parsed === 'object' && !Array.isArray(parsed)) {
          // Ambil fitur yang bernilai true / 1
          parsedFeatures = Object.keys(parsed)
              .filter(k => parsed[k] === true || parsed[k] === 1 || parsed[k] === '1')
              .map(k => featureLabels[k] || k.replace(/_/g, ' ')); // Fallback hapus underscore
      } else if (Array.isArray(parsed)) {
          parsedFeatures = parsed.map(k => featureLabels[k] || k.replace(/_/g, ' '));
      }
  } catch (e) {
      parsedFeatures = [tier.features];
  }

  // Gabungkan dengan limit grup bawaan database
  const allFeatures = [
      `Maksimal ${tier.max_groups} Grup`,
      `${tier.max_members_per_group} Member / Grup`,
      ...parsedFeatures
  ];

  const isPopular = index === 1; // Asumsi paket tengah yang ditekankan

  return (
    <div className={`relative flex flex-col h-full rounded-[2rem] p-8 md:p-10 transition-all duration-300 ${
      isPopular
        ? 'bg-white border-2 border-kas-primary shadow-2xl shadow-kas-primary/20 transform md:-translate-y-4 z-20'
        : 'bg-white/5 border border-white/10 hover:border-white/20 backdrop-blur-md text-white z-10'
    }`}>

      {/* Badge Paling Diminati */}
      {isPopular && (
        <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
          <span className="bg-kas-primary text-white text-[11px] font-black tracking-widest px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5 whitespace-nowrap">
            <Star className="w-3.5 h-3.5 fill-white" /> PALING DIMINATI
          </span>
        </div>
      )}

      {/* Header Info */}
      <div className="mb-8 border-b border-gray-500/20 pb-8">
        <h3 className={`text-2xl font-black mb-2 ${isPopular ? 'text-kas-dark' : 'text-white'}`}>{tier.name}</h3>
        <p className={`text-sm font-medium ${isPopular ? 'text-gray-500' : 'text-white/50'}`}>
          {tier.price == 0 ? 'Mulai kelola tanpa biaya' : 'Untuk komunitas skala besar'}
        </p>
      </div>

      {/* Harga */}
      <div className="mb-8">
        <div className="flex items-end gap-2">
          <span className={`text-4xl md:text-5xl font-black tracking-tight ${isPopular ? 'text-kas-primary' : 'text-white'}`}>
            {tier.price == 0 ? 'Gratis' : `Rp ${new Intl.NumberFormat('id-ID').format(tier.price)}`}
          </span>
        </div>
        {tier.price > 0 && <p className={`text-sm font-bold mt-2 ${isPopular ? 'text-gray-400' : 'text-white/40'}`}>/ sekali bayar selamanya</p>}
      </div>

      {/* List Fitur */}
      <ul className={`space-y-5 text-sm font-medium flex-grow mb-10 ${isPopular ? 'text-gray-600' : 'text-white/70'}`}>
        {allFeatures.map((feature, idx) => (
          <li key={idx} className="flex items-start gap-3">
            <CheckCircle2 className={`w-5 h-5 shrink-0 mt-0.5 ${isPopular ? 'text-kas-primary' : 'text-kas-accent'}`} />
            <span className="leading-snug capitalize capitalize-first">{feature}</span>
          </li>
        ))}
      </ul>

      {/* Tombol CTA */}
      <div className="mt-auto">
        <Link to="/mitra/register" className={`w-full py-4 rounded-xl font-black flex items-center justify-center transition-all ${
          isPopular
            ? 'bg-kas-primary hover:bg-kas-dark text-white shadow-xl shadow-kas-primary/30'
            : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
        }`}>
          {tier.price == 0 ? 'Mulai Gratis' : 'Pilih Paket Ini'}
        </Link>
      </div>
    </div>
  );
}


// ==========================================
// HALAMAN UTAMA
// ==========================================
export default function LandingPage() {
  const navigate = useNavigate();
  const [tiers, setTiers] = useState([]);

  // Ambil Data Pricing dari API
  useEffect(() => {
      axios.get('/api/v1/public/license-tiers')
          .then(res => {
              if (res.data && Array.isArray(res.data.data)) {
                  setTiers(res.data.data.filter(t => t.is_active == true));
              }
          }).catch(err => console.error("Gagal load pricing", err));
  }, []);

  return (
    <div className="min-h-screen bg-kas-bg font-sans text-kas-dark selection:bg-kas-accent selection:text-kas-dark overflow-x-hidden">
      
      {/* ========================================== */}
      {/* NAVIGATION */}
      {/* ========================================== */}
      <nav className="fixed top-0 w-full bg-kas-dark/40 backdrop-blur-lg z-50 border-b border-white/20 shadow-md transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="relative transform scale-75 md:scale-100">
                <div className="absolute inset-0 bg-gradient-to-br from-kas-accent to-kas-primary rounded-xl blur-md opacity-60 animate-pulse"></div>
                <CreditCard className="w-8 h-8 text-white relative transform rotate-12" />
              </div>
              <span className="font-black text-xl md:text-2xl tracking-tight text-white drop-shadow-md">
                KoleksiKAS.
              </span>
            </div>
            
            <div className="hidden md:flex gap-8 items-center">
              <Link to="/explore" className="text-white font-bold hover:text-kas-accent transition-colors flex items-center gap-2 drop-shadow-sm">
                <MapPin className="w-4 h-4" /> Cari Mabar
              </Link>
              <a href="#solusi" className="text-white/80 hover:text-white font-bold transition-colors drop-shadow-sm">Solusi</a>
              <a href="#fitur" className="text-white/80 hover:text-white font-bold transition-colors drop-shadow-sm">Fitur</a>
              <a href="#harga" className="text-white/80 hover:text-white font-bold transition-colors drop-shadow-sm">Harga</a>
            </div>

            <div className="flex items-center gap-3 md:gap-4">
              <Link to="/auth/login" className="hidden sm:block text-white hover:text-kas-accent font-bold transition-colors drop-shadow-sm text-sm md:text-base">
                Login Admin
              </Link>
              <Link to="/mitra/register" className="bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white hover:text-kas-dark px-4 py-2 md:px-6 md:py-2.5 rounded-lg md:rounded-xl font-bold shadow-lg transition-all transform hover:-translate-y-0.5 text-sm md:text-base">
                Jadi Mitra
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ========================================== */}
      {/* HERO SECTION */}
      {/* ========================================== */}
      <div className="relative bg-kas-dark">
        <AuroraBackground className="w-full" showRadialGradient={true}>
          <div className="absolute inset-0 bg-kas-dark/40 z-0 pointer-events-none"></div>
          <div className="max-w-7xl mx-auto relative z-10 w-full pt-28 md:pt-32 pb-16 px-4">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center max-w-5xl mx-auto flex flex-col items-center">
              
              <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 md:px-5 md:py-2.5 rounded-full mb-6 md:mb-8 border border-white/20 backdrop-blur-md shadow-lg max-w-full overflow-hidden">
                <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-kas-accent flex-shrink-0" />
                <span className="text-white font-bold text-xs md:text-sm tracking-wide truncate">Platform Kelola Iuran & Komunitas #1</span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black mb-6 md:mb-8 leading-[1.15] md:leading-[1.1] tracking-tight">
                <span className="text-white drop-shadow-md">Tagih Tanpa Baper.</span>
                <br />
                <span className="bg-gradient-to-r from-kas-soft via-kas-accent to-white bg-clip-text text-transparent drop-shadow-sm">
                  Lunas Otomatis.
                </span>
              </h1>

              <p className="text-lg md:text-xl lg:text-2xl text-white/80 mb-8 md:mb-12 leading-relaxed max-w-3xl mx-auto font-medium px-2">
                Tinggalkan cara lama menagih iuran di grup WhatsApp. <br className="hidden sm:block" />
                <span className="font-black text-kas-accent drop-shadow-md">Bot WA + QRIS Instan = Rekap Bebas Stres.</span>
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center w-full px-4 sm:px-0">
                <Link to="/mitra/register" className="w-full sm:w-auto group relative bg-white text-kas-primary px-8 md:px-10 py-3.5 md:py-4 rounded-xl md:rounded-2xl text-base md:text-lg font-black shadow-2xl transition-all transform hover:-translate-y-1 hover:scale-105 overflow-hidden flex items-center justify-center gap-2">
                  Daftar Sebagai Mitra
                  <ArrowRight className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-1 transition-transform" />
                </Link>

                <button onClick={() => navigate('/explore')} className="w-full sm:w-auto relative bg-white/10 text-white px-8 md:px-10 py-3.5 md:py-4 rounded-xl md:rounded-2xl text-base md:text-lg font-bold border border-white/20 hover:bg-white/20 backdrop-blur-md transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2 shadow-lg">
                  <Search className="w-5 h-5 text-kas-accent" /> Cari Mabar Olahraga
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6 mt-12 md:mt-16 pb-4">
                <div className="flex -space-x-3 md:-space-x-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-kas-dark border-2 border-kas-soft shadow-xl flex items-center justify-center text-lg md:text-xl">👤</div>
                  ))}
                </div>
                <div className="text-center sm:text-left">
                  <div className="flex gap-1 mb-1 justify-center sm:justify-start">
                    {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="w-3 h-3 md:w-4 md:h-4 fill-kas-accent text-kas-accent drop-shadow-sm" />)}
                  </div>
                  <p className="text-white/80 font-medium text-xs md:text-sm">
                    Dipercaya <span className="font-black text-white">500+</span> komunitas seluruh Indonesia
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </AuroraBackground>
      </div>

      {/* ========================================== */}
      {/* SEKSI CARI MABAR (TERANG) */}
      {/* ========================================== */}
      <section className="py-12 md:py-16 px-4 bg-kas-bg relative">
        <div className="max-w-5xl mx-auto -mt-16 md:-mt-24 relative z-20">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] shadow-xl md:shadow-2xl border border-gray-100 flex flex-col md:flex-row items-center gap-6 md:gap-8 justify-between text-center md:text-left">
            <div>
              <h3 className="text-2xl md:text-3xl font-black text-kas-dark mb-2">Pemain Lepas (Freelance)?</h3>
              <p className="text-kas-dark/70 font-medium text-sm md:text-base">Temukan jadwal Open Play / Mabar olahraga di sekitarmu, daftar, dan bayar otomatis!</p>
            </div>
            <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
                <input type="text" placeholder="Cth: Bogor, Jakarta..." className="w-full px-5 py-3 md:py-3.5 rounded-xl border border-gray-200 focus:border-kas-primary outline-none bg-gray-50 min-w-[200px] text-sm md:text-base" />
                <button onClick={() => navigate('/explore')} className="w-full sm:w-auto bg-kas-dark text-white px-6 py-3 md:py-3.5 rounded-xl font-bold hover:bg-kas-primary transition-colors flex items-center justify-center gap-2 shadow-lg text-sm md:text-base">
                    <Search className="w-5 h-5" /> Cari
                </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Problem-Solution Section */}
      <section id="solusi" className="py-16 md:py-24 px-4 relative bg-gray-50">
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12 md:mb-16">
            <span className="text-kas-soft font-black tracking-wider text-xs md:text-sm mb-3 block uppercase">Cara Lama vs KoleksiKAS</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4 md:mb-5 leading-tight">
              <span className="text-kas-dark">Tinggalkan Cara Lama yang </span>
              <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">Melelahkan</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 md:gap-10 max-w-6xl mx-auto">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative bg-white p-6 md:p-10 rounded-[1.5rem] md:rounded-[2rem] border border-gray-200 shadow-sm h-full hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-4 mb-6 md:mb-8">
                  <div className="w-12 h-12 md:w-14 md:h-14 bg-red-50 text-red-500 rounded-xl md:rounded-2xl flex items-center justify-center text-xl md:text-2xl font-black border border-red-100 flex-shrink-0">❌</div>
                  <h3 className="text-xl md:text-2xl font-black text-kas-dark">Masalah Saat Ini</h3>
                </div>
                <div className="space-y-4 md:space-y-5">
                  {["Menagih iuran satu per satu di grup WhatsApp", "Anggota lupa bayar karena obrolan tenggelam", "Cek mutasi rekening manual berjam-jam", "Rekap data tercecer di Excel dan Notes", "Rasa sungkan / baper saat menagih teman sendiri"].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 md:gap-4"><span className="text-red-400 mt-1 font-bold text-sm md:text-base">✕</span><span className="text-kas-dark/80 font-medium text-sm md:text-base">{item}</span></div>
                  ))}
                </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative bg-white p-6 md:p-10 rounded-[1.5rem] md:rounded-[2rem] shadow-xl md:shadow-2xl shadow-kas-primary/10 border-2 border-kas-soft h-full group hover:-translate-y-1 transition-transform">
                <div className="flex items-center gap-4 mb-6 md:mb-8">
                  <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-kas-primary to-kas-dark text-white rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform flex-shrink-0"><Rocket className="w-6 h-6 md:w-7 md:h-7" /></div>
                  <h3 className="text-xl md:text-2xl font-black bg-gradient-to-r from-kas-primary to-kas-dark bg-clip-text text-transparent">Solusi KoleksiKAS</h3>
                </div>
                <div className="space-y-3 md:space-y-5">
                  {["Broadcast tagihan massal via Bot WhatsApp", "Member bayar instan pakai QRIS Otomatis", "Sistem otomatis deteksi dan tandai 'Lunas'", "Laporan keuangan rapi di Dashboard Real-time", "Notifikasi pengingat terkirim otomatis"].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 md:gap-4 p-2.5 md:p-3 bg-kas-primary/5 rounded-lg md:rounded-xl hover:bg-kas-primary/10 transition-colors"><CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-kas-primary flex-shrink-0" /><span className="text-kas-dark font-bold text-sm md:text-base">{item}</span></div>
                  ))}
                </div>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* 3. CTA SECTION (GELAP / AURORA) */}
      <div className="relative bg-kas-dark">
        <AuroraBackground className="py-16 md:py-24 px-4 w-full min-h-[50vh] md:min-h-[60vh]" showRadialGradient={false}>
          <div className="absolute inset-0 bg-kas-dark/40 z-0 pointer-events-none"></div>

          <div className="max-w-4xl mx-auto text-center relative z-10 w-full">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
              <h2 className="text-3xl sm:text-4xl md:text-6xl font-black text-white mb-4 md:mb-6 leading-tight drop-shadow-lg px-2">
                Siap Mengubah Cara Komunitasmu Berjalan?
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-white/80 mb-8 md:mb-10 font-medium max-w-2xl mx-auto drop-shadow-sm px-4">
                Bergabunglah bersama ratusan ketua komunitas yang sudah merasakan tenangnya menagih tanpa baper.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full px-4 sm:px-0">
                <Link to="/mitra/register" className="w-full sm:w-auto bg-white text-kas-primary px-8 md:px-10 py-3.5 md:py-4 rounded-xl md:rounded-2xl text-base md:text-xl font-black hover:shadow-xl hover:scale-105 transition-all shadow-kas-dark/50 flex justify-center">
                  Mulai Gratis Sekarang
                </Link>
                <Link to="/auth/login" className="w-full sm:w-auto px-8 md:px-10 py-3.5 md:py-4 rounded-xl md:rounded-2xl text-base md:text-xl font-bold text-white border border-white/30 hover:bg-white/10 backdrop-blur-sm transition-colors flex justify-center">
                  Login Admin
                </Link>
              </div>
            </motion.div>
          </div>
        </AuroraBackground>
      </div>

      {/* Features Grid */}
      <section id="fitur" className="py-16 md:py-24 px-4 bg-white relative border-t border-gray-100">
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12 md:mb-16">
            <span className="text-kas-soft font-black tracking-wider text-xs md:text-sm mb-3 block uppercase">FITUR UNGGULAN</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-kas-dark leading-tight">Semua yang Komunitasmu Butuhkan</h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 md:gap-6">
            {[
              { icon: MessageSquare, title: "Bot WA Otomatis", desc: "Broadcast tagihan, pengingat, dan struk lunas langsung ke nomor WA member.", color: "from-kas-primary to-kas-soft" },
              { icon: CreditCard, title: "QRIS Payment Gateway", desc: "Dukung pembayaran instan. Verifikasi lunas otomatis tanpa cek mutasi.", color: "from-kas-dark to-kas-primary" },
              { icon: Users, title: "Arisan & Mabar", desc: "Kelola Event Mudah. Buat jadwal, atur kuota, dan harga tiket masuk.", color: "from-kas-primary to-kas-dark" },
              { icon: Globe, title: "Sesi Open Play", desc: "Buat tagihan publik. Tampil otomatis di halaman Eksplor Mabar KoleksiKAS.", color: "from-kas-soft to-kas-primary" },
              { icon: BarChart3, title: "Laporan Kas Real-time", desc: "Pantau uang masuk, penunggak, dan total saldo kas dari dashboard admin.", color: "from-kas-primary via-kas-dark to-kas-primary" },
              { icon: Shield, title: "Aman & Transparan", desc: "Riwayat pembayaran tersimpan di Cloud. Bebas dari salah catat.", color: "from-gray-700 to-kas-dark" }
            ].map((feature, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} whileHover={{ y: -5 }} className="relative group">
                <div className="relative bg-gray-50 p-6 md:p-8 rounded-[1.5rem] md:rounded-3xl shadow-sm border border-gray-100 group-hover:border-kas-primary/30 group-hover:shadow-xl transition-all h-full z-10">
                  <div className={`w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br ${feature.color} rounded-xl md:rounded-2xl flex items-center justify-center mb-5 md:mb-6 shadow-md transform group-hover:rotate-6 transition-transform`}>
                    <feature.icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
                  </div>
                  <h3 className="text-lg md:text-xl font-black text-kas-dark mb-2 md:mb-3">{feature.title}</h3>
                  <p className="text-kas-dark/60 font-medium leading-relaxed text-xs md:text-sm">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================== */}
      {/* SEKSI HARGA (PRICING) - NEW! */}
      {/* ========================================== */}
      <section id="harga" className="py-20 md:py-32 bg-kas-dark relative border-t border-white/10">
        
        {/* Subtle Glow di belakang agar tidak terlalu polos */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[800px] h-[800px] bg-kas-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="text-center mb-16 md:mb-20">
            <span className="text-kas-accent font-black tracking-widest text-xs md:text-sm mb-3 block uppercase">PILIHAN LISENSI</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight mb-4 drop-shadow-md">
              Mulai dengan <span className="bg-gradient-to-r from-kas-soft via-kas-accent to-white bg-clip-text text-transparent drop-shadow-sm">
                  Rp1.000
                </span>, Tumbuh Tanpa Batas
            </h2>
            <p className="text-white/60 font-medium text-lg max-w-2xl mx-auto">
              Tidak ada biaya langganan bulanan. Bayar sekali dan miliki sistem ini untuk komunitas Anda selamanya.
            </p>
          </div>

          {tiers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 items-stretch justify-center max-w-6xl mx-auto">
              {tiers.map((tier, index) => (
                <PricingCard key={tier.id} tier={tier} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-white/50 font-bold text-xl animate-pulse">
              Mengambil Data Paket Lisensi...
            </div>
          )}
        </div>
      </section>


      {/* Footer */}
      <footer className="relative bg-white text-kas-dark overflow-hidden border-t border-gray-100 z-20 font-sans">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 md:pt-20 pb-8 md:pb-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 md:gap-12 mb-12 md:mb-16">
            
            <div className="col-span-1 sm:col-span-2 md:col-span-1 space-y-4 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-kas-primary to-kas-soft rounded-xl flex items-center justify-center shadow-md">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <span className="font-black text-2xl tracking-tight text-kas-dark">
                  KoleksiKAS.
                </span>
              </div>
              <p className="text-sm text-kas-dark/70 leading-relaxed mx-auto sm:mx-0 max-w-[280px] font-medium">
                Platform kelola iuran komunitas #1 di Indonesia. Aman, Transparan, & Lunas Otomatis.
              </p>
            </div>

            <div className="space-y-4 md:space-y-5 text-center sm:text-left">
              <h4 className="font-black text-kas-dark uppercase tracking-wider text-sm">Eksplorasi</h4>
              <ul className="space-y-3 text-sm font-semibold">
                <li><a href="#solusi" className="text-kas-dark/80 hover:text-kas-primary transition-colors">Solusi Masalah</a></li>
                <li><a href="#fitur" className="text-kas-dark/80 hover:text-kas-primary transition-colors">Fitur Unggulan</a></li>
                <li><Link to="/explore" className="text-kas-dark/80 hover:text-kas-primary transition-colors">Cari Mabar/Event</Link></li>
                <li><Link to="/mitra/register" className="text-kas-primary hover:text-kas-dark font-bold transition-colors">Daftar Mitra</Link></li>
              </ul>
            </div>

            <div className="space-y-4 md:space-y-5 text-center sm:text-left">
              <h4 className="font-black text-kas-dark uppercase tracking-wider text-sm">Informasi Hukum</h4>
              <ul className="space-y-3 text-sm font-semibold">
                <li><Link to="/legal#syarat-ketentuan" className="text-kas-dark/80 hover:text-kas-primary transition-colors">Syarat & Ketentuan</Link></li>
                <li><Link to="/legal#kebijakan-privasi" className="text-kas-dark/80 hover:text-kas-primary transition-colors">Kebijakan Privasi</Link></li>
                <li><Link to="/legal#kebijakan-penarikan" className="text-kas-dark/80 hover:text-kas-primary transition-colors inline-flex items-center gap-1.5 justify-center sm:justify-start"> Kebijakan Penarikan</Link></li>
                <li><Link to="/legal#laporan-keamanan" className="text-kas-dark/80 hover:text-kas-primary transition-colors">Laporan Keamanan</Link></li>
              </ul>
            </div>

            <div className="space-y-4 md:space-y-5 text-center sm:text-left">
              <h4 className="font-black text-kas-dark uppercase tracking-wider text-sm">Dikembangkan Oleh</h4>
              <div className="space-y-1 md:space-y-2">
                 <p className="font-extrabold text-kas-dark">RootanRoo Digital</p>
                 <p className="text-xs text-kas-dark/60 font-medium">Cileungsi, Bogor, Jawa Barat</p>
              </div>
              <ul className="space-y-3 text-sm font-semibold">
                <li><a href="mailto:support@rootanroo.com" className="text-kas-dark/80 hover:text-kas-primary transition-colors inline-flex items-center gap-2 tracking-tight justify-center sm:justify-start">📧 support@rootanroo.com</a></li>
                <li><a href="mailto:partnership@rootanroo.com" className="text-kas-dark/80 hover:text-kas-primary transition-colors inline-flex items-center gap-2 tracking-tight justify-center sm:justify-start">🤝 partnership@rootanroo.com</a></li>
              </ul>
            </div>
          </div>

          <div className="relative w-full mt-6 md:mt-10 -mb-4 md:-mb-10 overflow-hidden pointer-events-none">
             <FadeText text="KOLEKSIKAS" />
          </div>

          <div className="border-t border-gray-100 pt-6 md:pt-8 mt-4 text-center">
             <p className="text-[10px] md:text-xs font-bold text-kas-dark/50">
              © {new Date().getFullYear()} KoleksiKAS by RootanRoo Digital. buat Sistem Kamu bersama kami!
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}