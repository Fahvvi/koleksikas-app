import '../css/app.css';
import './bootstrap';
import React, { Component } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';

// ==========================================
// 1. IMPORT AREA PUBLIK & AUTH
// ==========================================
import LandingPage from './views/public/LandingPage.jsx';
import RegisterSession from './views/public/RegisterSession.jsx';
// import MitraRegister from './views/public/MitraRegister.jsx';
import Login from './views/auth/Login.jsx';
import PaymentSuccess from './views/public/PaymentSuccess';
import SetPassword from './views/auth/SetPassword';
import MitraCheckout from './views/public/MitraCheckout.jsx';
import Checkout from './views/public/Checkout.jsx';
import ExploreOpenPlay from './views/public/ExploreOpenPlay.jsx';
import UserLogin from './views/auth/UserLogin.jsx';
import LegalPage from './views/public/LegalPage.jsx';
import ForgotPassword from './views/auth/ForgotPassword.jsx';

// ==========================================
// 2. IMPORT LAYOUTS
// ==========================================
import DashboardLayout from './layouts/DashboardLayout.jsx';

// ==========================================
// 3. IMPORT SUPER ADMIN VIEWS
// ==========================================
import SuperAdminDashboard from './views/superadmin/Dashboard.jsx';
import SuperAdminMitras from './views/superadmin/Mitras.jsx';
import SuperAdminLicenseTiers from './views/superadmin/LicenseTiers.jsx';
import SuperAdminSystemLogs from './views/superadmin/SystemLogs.jsx';
import SuperAdminGlobalSettings from './views/superadmin/GlobalSettings.jsx';
import SuperAdminPayout from './views/superadmin/Payout.jsx';
import SuperAdminUsers from './views/superadmin/Users.jsx';

// ==========================================
// 4. IMPORT ADMIN (MITRA/TENANT) VIEWS
// ==========================================
import AdminDashboard from './views/admin/Dashboard.jsx';
import AdminGroups from './views/admin/Groups.jsx';
import GroupDetail from './views/admin/GroupDetail.jsx';
import AdminSessions from './views/admin/Sessions.jsx';
import AdminBilling from './views/admin/Billing.jsx';
import AdminSettings from './views/admin/Settings.jsx'; 
import AdminFinance from './views/admin/Finance.jsx'; 

// ==========================================
// 5. IMPORT USER (MEMBER) VIEWS
// ==========================================
import SharedProfile from './views/shared/Profile.jsx';
import UserHistory from './views/user/UserHistory';
import UserProfile from './views/user/UserProfile';

// ==========================================
// 🛡️ ERROR BOUNDARY COMPONENT
// ==========================================
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // Di sini nantinya bisa disambungkan ke Sentry atau tools log lainnya
        console.error("Tertangkap oleh ErrorBoundary:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans">
                    <div className="bg-white p-8 md:p-10 rounded-[2rem] shadow-2xl border border-gray-100 text-center max-w-md w-full">
                        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-inner">
                            ⚠️
                        </div>
                        <h1 className="text-2xl font-black text-kas-dark mb-3">Sistem Mengalami Gangguan</h1>
                        <p className="text-kas-dark/60 font-medium mb-8 text-sm leading-relaxed">
                            Maaf, terjadi kesalahan tak terduga pada halaman ini. Jangan khawatir, cobalah memuat ulang halaman.
                        </p>
                        <button 
                            onClick={() => window.location.reload()} 
                            className="w-full bg-kas-primary hover:bg-kas-dark text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-kas-primary/30 flex items-center justify-center gap-2"
                        >
                            <span>🔄</span> Muat Ulang Halaman
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

// ==========================================
// KOMPONEN PENJAGA RUTE (ROLE GUARD)
// ==========================================
const RoleGuard = ({ allowedRole }) => {
    const userStr = localStorage.getItem('user');
    
    if (!userStr) {
        return <Navigate to="/auth/login" replace />;
    }

    try {
        const user = JSON.parse(userStr);

        if (user.role !== allowedRole) {
            if (user.role === 'super_admin') return <Navigate to="/super-admin/dashboard" replace />;
            if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
            return <Navigate to="/" replace />;
        }

        return <Outlet />;

    } catch (e) {
        return <Navigate to="/auth/login" replace />;
    }
};

function App() {
    return (
        // Bungkus seluruh rute dengan Error Boundary
        <ErrorBoundary>
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <Routes>
                    {/* --- RUTE PUBLIK --- */}
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/sesi/:sessionId/daftar" element={<RegisterSession />} />
                    <Route path="/mitra/register" element={<Login />} />
                    <Route path="/auth/login" element={<Login />} />
                    <Route path="/payment/success" element={<PaymentSuccess />} />
                    <Route path="/auth/set-password" element={<SetPassword />} />
                    <Route path="/checkout/:sessionId/:userId" element={<Checkout />} />
                    <Route path="/mitra/checkout/:mitraId" element={<MitraCheckout />} />
                    <Route path="/explore" element={<ExploreOpenPlay />} />
                    <Route path="/user/login" element={<UserLogin />} />
                    <Route path="/legal" element={<LegalPage />} />
                    <Route path="/auth/forgot-password" element={<ForgotPassword />} />

                    {/* --- RUTE DASHBOARD (Dibungkus oleh Layout) --- */}
                    <Route element={<DashboardLayout />}>
                        <Route path="/profile" element={<SharedProfile />} />
                        
                        <Route element={<RoleGuard allowedRole="super_admin" />}>
                            <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
                            <Route path="/super-admin/mitras" element={<SuperAdminMitras />} />
                            <Route path="/super-admin/license-tiers" element={<SuperAdminLicenseTiers />} />
                            <Route path="/super-admin/system-logs" element={<SuperAdminSystemLogs />} />
                            <Route path="/super-admin/global-settings" element={<SuperAdminGlobalSettings />} />
                            <Route path="/super-admin/payout" element={<SuperAdminPayout />} />
                            <Route path="/super-admin/users" element={<SuperAdminUsers />} />
                        </Route>

                        <Route element={<RoleGuard allowedRole="admin" />}>
                            <Route path="/admin/dashboard" element={<AdminDashboard />} />
                            <Route path="/admin/groups" element={<AdminGroups />} />
                            <Route path="/admin/groups/:id" element={<GroupDetail />} />
                            <Route path="/admin/sessions" element={<AdminSessions />} />
                            <Route path="/admin/billing" element={<AdminBilling />} />
                            <Route path="/admin/settings" element={<AdminSettings />} />
                            <Route path="/admin/finance" element={<AdminFinance />} />
                        </Route>
                    </Route>

                    {/* --- RUTE AREA MEMBER / USER --- */}
                    <Route path="/user/history" element={<UserHistory />} />
                    <Route path="/user/profile" element={<UserProfile />} />
                    
                    {/* --- FALLBACK 404 --- */}
                    <Route path="*" element={
                        <div className="min-h-screen flex items-center justify-center bg-kas-bg">
                            <div className="text-center font-sans">
                                <h1 className="text-6xl font-black text-kas-primary mb-4">404</h1>
                                <p className="text-xl text-kas-dark font-medium">Halaman Tidak Ditemukan</p>
                            </div>
                        </div>
                    } />
                    
                </Routes>
            </BrowserRouter>
        </ErrorBoundary>
    );
}

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);