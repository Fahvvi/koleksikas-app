import '../css/app.css';
import './bootstrap';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// ==========================================
// 1. IMPORT AREA PUBLIK & AUTH
// ==========================================
import LandingPage from './views/public/LandingPage.jsx';
import RegisterSession from './views/public/RegisterSession.jsx';
import MitraRegister from './views/public/MitraRegister.jsx';
import Login from './views/auth/Login.jsx';

// ==========================================
// 2. IMPORT LAYOUTS
// ==========================================
import DashboardLayout from './layouts/DashboardLayout.jsx';
// import UserLayout from './layouts/UserLayout.jsx'; // Nanti untuk member

// ==========================================
// 3. IMPORT SUPER ADMIN VIEWS
// ==========================================
import SuperAdminDashboard from './views/superadmin/Dashboard.jsx'; // <-- INI YANG KETINGGALAN TADI! 🚀
import SuperAdminMitras from './views/superadmin/Mitras.jsx';
import SuperAdminLicenseTiers from './views/superadmin/LicenseTiers.jsx';
// import SuperAdminTenants from './views/superadmin/Tenants.jsx';
import SuperAdminSystemLogs from './views/superadmin/SystemLogs.jsx';
import SuperAdminGlobalSettings from './views/superadmin/GlobalSettings.jsx';

// ==========================================
// 4. IMPORT ADMIN (MITRA/TENANT) VIEWS
// ==========================================
import AdminDashboard from './views/admin/Dashboard.jsx';
import AdminGroups from './views/admin/Groups.jsx';
import GroupDetail from './views/admin/GroupDetail.jsx';
// import AdminMembers from './views/admin/Members.jsx';
import AdminSessions from './views/admin/Sessions.jsx';
// import AdminBills from './views/admin/Bills.jsx';
// import AdminTransactions from './views/admin/Transactions.jsx';
// import AdminSettings from './views/admin/Settings.jsx'; // Konfigurasi Payment & WA

// ==========================================
// 5. IMPORT USER (MEMBER) VIEWS
// ==========================================
// import UserDashboard from './views/user/Dashboard.jsx';
// import UserBills from './views/user/Bills.jsx';
// import UserPayment from './views/user/Payment.jsx';
import UserProfile from './views/shared/Profile.jsx';

function App() {
    return (
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
                
                {/* --- RUTE PUBLIK --- */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/sesi/:sessionId/daftar" element={<RegisterSession />} />
                <Route path="/mitra/register" element={<MitraRegister />} />
                <Route path="/auth/login" element={<Login />} />

                {/* --- RUTE DASHBOARD (Dibungkus oleh Layout) --- */}
                <Route element={<DashboardLayout />}>

                    {/* AREA BERSAMA */}
                    <Route path="/profile" element={<UserProfile />} />
                    
                    {/* AREA SUPER ADMIN */}
                    <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
                    <Route path="/super-admin/mitras" element={<SuperAdminMitras />} />
                    <Route path="/super-admin/license-tiers" element={<SuperAdminLicenseTiers />} />
                    <Route path="/super-admin/system-logs" element={<SuperAdminSystemLogs />} />
                    <Route path="/super-admin/global-settings" element={<SuperAdminGlobalSettings />} />
                    {/* <Route path="/super-admin/tenants" element={<SuperAdminTenants />} /> */}


                    {/* AREA ADMIN MITRA */}
                    <Route path="/admin/dashboard" element={<AdminDashboard />} />
                    <Route path="/admin/groups" element={<AdminGroups />} />
                    <Route path="/admin/groups/:id" element={<GroupDetail />} />
                    {/* <Route path="/admin/groups/:id/members" element={<AdminMembers />} /> */}
                    <Route path="/admin/sessions" element={<AdminSessions />} />
                    {/* <Route path="/admin/bills" element={<AdminBills />} /> */}
                    {/* <Route path="/admin/transactions" element={<AdminTransactions />} /> */}
                    {/* <Route path="/admin/settings" element={<AdminSettings />} /> */}

                </Route>

                {/* --- RUTE AREA MEMBER / USER (Nanti dibungkus UserLayout) --- */}
                {/* <Route element={<UserLayout />}>
                    <Route path="/user/dashboard" element={<UserDashboard />} />
                    <Route path="/user/bills" element={<UserBills />} />
                    <Route path="/user/bills/:id/pay" element={<UserPayment />} />
                </Route> */}

                

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
    );
}

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);