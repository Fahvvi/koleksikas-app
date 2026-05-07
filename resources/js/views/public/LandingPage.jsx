import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Users,
  Zap,
  Clock,
  MessageSquare,
  CreditCard,
  Globe,
  Shield,
  BarChart3,
  ArrowRight,
  Sparkles,
  Rocket,
  Star
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-kas-bg font-sans text-kas-dark selection:bg-kas-accent selection:text-kas-dark overflow-hidden">
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-kas-bg/80 backdrop-blur-xl z-50 border-b border-kas-accent/30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-kas-primary to-kas-soft rounded-xl blur-md opacity-40 animate-pulse"></div>
                <CreditCard className="w-8 h-8 text-kas-primary relative transform rotate-12" />
              </div>
              <span className="font-black text-2xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-kas-primary to-kas-dark">
                KoleksiKAS.
              </span>
            </div>
            
            <div className="hidden md:flex gap-8 items-center">
              <a href="#solusi" className="text-kas-dark/70 hover:text-kas-primary font-bold transition-colors">Solusi</a>
              <a href="#fitur" className="text-kas-dark/70 hover:text-kas-primary font-bold transition-colors">Fitur</a>
            </div>

            <div className="flex items-center gap-4">
              <Link to="/auth/login" className="hidden sm:block text-kas-dark/80 hover:text-kas-primary font-bold transition-colors">
                Login Admin
              </Link>
              <Link to="/mitra/register" className="bg-gradient-to-r from-kas-primary via-kas-soft to-kas-primary bg-[length:200%_auto] hover:bg-right text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-kas-primary/20 transition-all transform hover:-translate-y-0.5">
                Jadi Mitra
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-4 relative">
        {/* Floating 3D Elements (Gradients Custom) */}
        <div className="absolute top-32 left-10 w-40 h-40 bg-gradient-to-br from-kas-primary to-kas-accent rounded-full opacity-20 blur-3xl animate-float"></div>
        <div className="absolute top-60 right-10 w-56 h-56 bg-gradient-to-bl from-kas-soft to-kas-primary rounded-full opacity-10 blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-5xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-kas-accent/40 to-transparent px-5 py-2.5 rounded-full mb-8 border border-kas-primary/20 backdrop-blur-sm">
              <Sparkles className="w-5 h-5 text-kas-primary" />
              <span className="text-kas-dark font-bold text-sm tracking-wide">Platform Kelola Iuran & Komunitas #1</span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 leading-[1.1] tracking-tight">
              <span className="text-kas-dark">Tagih Tanpa Baper.</span>
              <br />
              <span className="bg-gradient-to-r from-kas-primary via-kas-dark to-kas-soft bg-clip-text text-transparent">
                Lunas Otomatis.
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-kas-dark/70 mb-12 leading-relaxed max-w-3xl mx-auto">
              Tinggalkan cara lama menagih iuran di grup WhatsApp. <br />
              <span className="font-black text-kas-primary">Bot WA + QRIS Instan = Rekap Bebas Stres.</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-5 justify-center">
              <Link to="/mitra/register" className="group relative bg-gradient-to-r from-kas-primary to-kas-dark text-white px-10 py-4 rounded-2xl text-lg font-black shadow-2xl shadow-kas-primary/30 transition-all transform hover:-translate-y-1 hover:scale-105 overflow-hidden">
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Daftar Sebagai Mitra
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-kas-dark to-kas-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </Link>

              <a href="#fitur" className="relative bg-white text-kas-dark px-10 py-4 rounded-2xl text-lg font-black border-2 border-kas-accent hover:border-kas-primary hover:shadow-xl transition-all transform hover:-translate-y-1">
                Jelajahi Fitur
              </a>
            </div>

            {/* Social Proof */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-16">
              <div className="flex -space-x-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="w-12 h-12 rounded-full bg-gradient-to-br from-kas-accent to-kas-bg border-4 border-white shadow-md flex items-center justify-center text-xl">👤</div>
                ))}
              </div>
              <div className="text-left">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-kas-dark/70 font-medium text-sm">
                  Dipercaya <span className="font-black text-kas-primary">500+</span> komunitas seluruh Indonesia
                </p>
              </div>
            </div>
          </motion.div>

          {/* 3D Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-5xl mx-auto relative z-20"
          >
            {[
              { value: "95%", label: "Waktu Dihemat", icon: Clock, gradient: "from-kas-primary to-kas-soft" },
              { value: "Real-time", label: "Konfirmasi Lunas", icon: Zap, gradient: "from-kas-dark to-kas-primary" },
              { value: "Nol", label: "Baper Saat Nagih", icon: Shield, gradient: "from-kas-soft to-kas-dark" }
            ].map((stat, i) => (
              <motion.div key={i} whileHover={{ y: -10 }} className="relative group">
                <div className="absolute inset-0 bg-gradient-to-b from-white to-kas-bg opacity-80 rounded-3xl blur-md group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-lg shadow-kas-accent/50 border border-kas-accent/50 group-hover:border-kas-primary/30 transition-all">
                  <div className={`w-14 h-14 bg-gradient-to-br ${stat.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-md`}>
                    <stat.icon className="w-7 h-7 text-white" />
                  </div>
                  <div className={`text-4xl font-black mb-2 bg-gradient-to-br ${stat.gradient} bg-clip-text text-transparent`}>
                    {stat.value}
                  </div>
                  <div className="text-kas-dark/60 font-bold">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Problem-Solution Section */}
      <section id="solusi" className="py-24 px-4 relative bg-white border-y border-kas-accent/30">
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/3 h-full bg-gradient-to-l from-kas-accent/30 to-transparent opacity-50 blur-3xl pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
            <span className="text-kas-soft font-black tracking-wider text-sm mb-3 block uppercase">Cara Lama vs KoleksiKAS</span>
            <h2 className="text-4xl md:text-5xl font-black mb-5">
              <span className="text-kas-dark">Tinggalkan Cara Lama yang </span>
              <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                Melelahkan
              </span>
            </h2>
            <p className="text-lg text-kas-dark/60 max-w-2xl mx-auto font-medium">
              Menjadi pengurus komunitas seharusnya menyenangkan, bukan seperti pekerjaan sampingan yang bikin pusing.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-10 max-w-6xl mx-auto">
            {/* Old Way */}
            <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative">
              <div className="relative bg-red-50/50 p-8 md:p-10 rounded-[2rem] border-2 border-red-100 h-full hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 bg-red-100 text-red-500 rounded-2xl flex items-center justify-center text-2xl font-black">❌</div>
                  <h3 className="text-2xl font-black text-kas-dark">Masalah Saat Ini</h3>
                </div>
                <div className="space-y-5">
                  {[
                    "Menagih iuran satu per satu di grup WhatsApp",
                    "Anggota lupa bayar karena obrolan tenggelam",
                    "Cek mutasi rekening manual berjam-jam",
                    "Rekap data tercecer di Excel dan Notes",
                    "Rasa sungkan / baper saat menagih teman sendiri"
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <span className="text-red-400 mt-1">✕</span>
                      <span className="text-kas-dark/80 font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* New Way (Brand Gradients) */}
            <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-kas-primary to-kas-soft rounded-[2rem] transform rotate-1 opacity-20"></div>
              <div className="relative bg-white p-8 md:p-10 rounded-[2rem] shadow-2xl shadow-kas-primary/10 border-2 border-kas-accent h-full group hover:-translate-y-1 transition-transform">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 bg-gradient-to-br from-kas-primary to-kas-dark text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Rocket className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-black bg-gradient-to-r from-kas-primary to-kas-dark bg-clip-text text-transparent">
                    Solusi KoleksiKAS
                  </h3>
                </div>
                <div className="space-y-5">
                  {[
                    "Broadcast tagihan massal via Bot WhatsApp",
                    "Member bayar instan pakai QRIS Otomatis",
                    "Sistem otomatis deteksi dan tandai 'Lunas'",
                    "Laporan keuangan rapi di Dashboard Real-time",
                    "Notifikasi pengingat terkirim tanpa campur tangan"
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4 p-3 bg-kas-bg/50 rounded-xl hover:bg-kas-accent/20 transition-colors">
                      <CheckCircle2 className="w-6 h-6 text-kas-primary flex-shrink-0" />
                      <span className="text-kas-dark font-bold">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="fitur" className="py-24 px-4 bg-kas-bg relative">
        <div className="absolute left-0 top-1/3 w-64 h-64 bg-kas-primary/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
            <span className="text-kas-soft font-black tracking-wider text-sm mb-3 block uppercase">FITUR UNGGULAN</span>
            <h2 className="text-4xl md:text-5xl font-black text-kas-dark">
              Semua yang Komunitasmu Butuhkan
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: MessageSquare, title: "Bot WA Otomatis", desc: "Broadcast tagihan, pengingat, dan struk lunas langsung ke nomor WA member tanpa save nomor.", color: "from-kas-primary to-kas-soft" },
              { icon: CreditCard, title: "QRIS Payment Gateway", desc: "Dukung pembayaran instan. Verifikasi lunas otomatis tanpa cek mutasi manual di mutasi rekening.", color: "from-kas-dark to-kas-primary" },
              { icon: Users, title: "Arisan & Mabar", desc: "Kelola Event Mudah. Buat jadwal Mini Soccer, Bulutangkis, atau Arisan rutin. Atur kuota dan harga.", color: "from-kas-primary to-kas-dark" },
              { icon: Globe, title: "Sesi Open Play", desc: "Buat tagihan publik yang bisa dibagikan sebagai Link. Siapapun bisa daftar dan langsung bayar.", color: "from-kas-soft to-kas-primary" },
              { icon: BarChart3, title: "Laporan Kas Real-time", desc: "Pantau uang masuk, siapa yang nunggak, dan total saldo kas dari dashboard admin yang elegan.", color: "from-kas-primary via-kas-dark to-kas-primary" },
              { icon: Shield, title: "Aman & Transparan", desc: "Seluruh riwayat pembayaran tersimpan rapi di Cloud. Bebas dari salah catat atau uang hilang.", color: "from-gray-700 to-kas-dark" }
            ].map((feature, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} whileHover={{ y: -5 }} className="relative group">
                {/* Glow Effect di belakang card */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 blur-xl group-hover:opacity-15 transition-opacity rounded-3xl`}></div>
                
                <div className="relative bg-white p-8 rounded-3xl shadow-sm border border-kas-accent/50 group-hover:border-kas-primary/30 transition-all h-full z-10">
                  <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 shadow-md transform group-hover:rotate-6 transition-transform`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-black text-kas-dark mb-3">{feature.title}</h3>
                  <p className="text-kas-dark/60 font-medium leading-relaxed text-sm">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section (Full Brand Colors) */}
      <section className="py-24 px-4 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-kas-dark"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-kas-primary/80 via-kas-dark to-kas-soft/50"></div>
        
        {/* Abstract shapes */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-kas-primary rounded-full blur-3xl opacity-50 animate-pulse"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-kas-soft rounded-full blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '1.5s' }}></div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight drop-shadow-lg">
              Siap Mengubah Cara Komunitasmu Berjalan?
            </h2>
            <p className="text-xl text-white/80 mb-10 font-medium max-w-2xl mx-auto">
              Bergabunglah bersama ratusan ketua komunitas yang sudah merasakan tenangnya menagih tanpa baper.
            </p>
            <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
              <Link to="/mitra/register" className="w-full sm:w-auto bg-white text-kas-primary px-10 py-4 rounded-2xl text-xl font-black hover:shadow-xl hover:scale-105 transition-all shadow-kas-dark/50">
                Mulai Gratis Sekarang
              </Link>
              <Link to="/auth/login" className="w-full sm:w-auto px-10 py-4 rounded-2xl text-xl font-bold text-white border-2 border-white/30 hover:bg-white/10 backdrop-blur-sm transition-colors">
                Login Admin
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-kas-dark text-white/60 py-12 px-4 border-t border-white/10 relative z-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-kas-primary to-kas-soft rounded-lg flex items-center justify-center">
               <CreditCard className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-white text-xl tracking-tight">KoleksiKAS.</span>
          </div>
          <p className="text-sm font-medium text-center">
            © 2026 KoleksiKAS by RootanRoo Digital. Platform Iuran & Mabar Terpercaya.
          </p>
        </div>
      </footer>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}