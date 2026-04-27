import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

export default function GroupDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [group, setGroup] = useState(null);
    const [members, setMembers] = useState([]); // State untuk daftar member
    const [isLoadingMembers, setIsLoadingMembers] = useState(true);
    
    // State Modals
    const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
    const [isEditMemberModalOpen, setIsEditMemberModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [memberForm, setMemberForm] = useState({ user_id: null, name: '', phone_wa: '' });

    const Toast = MySwal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });

    const fetchGroupData = async () => {
        try {
            // Ambil info detail grup
            const groupRes = await axios.get(`/api/v1/admin/groups/${id}`);
            setGroup(groupRes.data.data);
            
            // Ambil daftar anggotanya
            const membersRes = await axios.get(`/api/v1/admin/groups/${id}/members`);
            setMembers(membersRes.data.data || []);
            setIsLoadingMembers(false);
        } catch (err) {
            console.error(err);
            setIsLoadingMembers(false);
        }
    };

    useEffect(() => { fetchGroupData(); }, [id]);

    // ACTION: DELETE GRUP
    const handleDeleteGroup = () => {
        MySwal.fire({
            title: 'Hapus Grup?', text: `Kamu yakin ingin menghapus "${group?.name}"?`, icon: 'warning',
            showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#A3485A',
            confirmButtonText: 'Ya, Hapus!', cancelButtonText: 'Batal'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await axios.delete(`/api/v1/admin/groups/${id}`);
                    MySwal.fire('Terhapus!', 'Grup berhasil dihapus.', 'success').then(() => navigate('/admin/groups'));
                } catch (error) {
                    MySwal.fire('Gagal', 'Tidak dapat menghapus grup ini.', 'error');
                }
            }
        });
    };

    // ACTION: ADD / EDIT MEMBER SUBMIT
    const handleMemberSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (memberForm.user_id) {
                // Update (Edit)
                await axios.put(`/api/v1/admin/groups/${id}/members/${memberForm.user_id}`, memberForm);
                Toast.fire({ icon: 'success', title: 'Data member diperbarui!' });
                setIsEditMemberModalOpen(false);
            } else {
                // Create (Tambah)
                await axios.post(`/api/v1/admin/groups/${id}/members`, memberForm);
                Toast.fire({ icon: 'success', title: 'Member ditambahkan!' });
                setIsAddMemberModalOpen(false);
            }
            fetchGroupData(); 
        } catch (error) {
            MySwal.fire('Gagal', error.response?.data?.message || 'Terjadi kesalahan validasi.', 'error');
        } finally {
            setIsSubmitting(false);
            setMemberForm({ user_id: null, name: '', phone_wa: '' });
        }
    };

    // ACTION: BUKA MODAL EDIT
    const openEditModal = (member) => {
        setMemberForm({
            user_id: member.user.id,
            name: member.user.name,
            phone_wa: member.user.phone_wa || ''
        });
        setIsEditMemberModalOpen(true);
    };

    // ACTION: DELETE MEMBER
    const handleRemoveMember = (userId, userName) => {
        MySwal.fire({
            title: 'Keluarkan Member?', text: `Keluarkan "${userName}" dari grup ini?`, icon: 'warning',
            showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Ya, Keluarkan'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await axios.delete(`/api/v1/admin/groups/${id}/members/${userId}`);
                    Toast.fire({ icon: 'success', title: 'Member dikeluarkan dari grup.' });
                    fetchGroupData();
                } catch (error) {
                    MySwal.fire('Gagal', error.response?.data?.message || 'Tidak dapat menghapus member.', 'error');
                }
            }
        });
    };

    if (!group) return <div className="p-8 text-center text-gray-500 font-bold">Memuat data komunitas...</div>;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Navigasi Atas */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link to="/admin/groups" className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 hover:border-kas-primary text-gray-400 hover:text-kas-primary rounded-xl transition-all shadow-sm">←</Link>
                    <h2 className="text-2xl font-black text-kas-dark tracking-tight">Detail Komunitas</h2>
                </div>
                <button onClick={handleDeleteGroup} className="px-4 py-2 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white border border-red-100 rounded-xl font-bold text-sm transition-all shadow-sm">
                    Hapus Grup
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Info Card */}
                <div className="bg-kas-dark rounded-2xl shadow-xl p-6 lg:col-span-1 text-white relative overflow-hidden h-fit">
                    <div className="absolute -right-6 -top-6 text-9xl opacity-5">⚽</div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Nama Grup</h3>
                    <h2 className="text-3xl font-black leading-tight mb-2">{group.name}</h2>
                    <span className="inline-block px-3 py-1 bg-white/10 border border-white/20 rounded-lg text-xs font-bold mb-6">{group.sport_type}</span>
                    <div className="pt-6 border-t border-white/10">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-xl">👥</span>
                            <div>
                                <p className="text-xs text-gray-400 font-bold">Total Anggota</p>
                                <p className="font-black text-lg">{members.length} Orang</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Daftar Member Area */}
                <div className="bg-white rounded-2xl border border-kas-accent/30 shadow-sm p-6 lg:col-span-2 flex flex-col">
                    <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                        <div>
                            <h3 className="text-xl font-bold text-kas-dark">Daftar Anggota</h3>
                            <p className="text-xs text-gray-400 font-medium">Data kontak member komunitas</p>
                        </div>
                        <button onClick={() => { setMemberForm({ user_id: null, name: '', phone_wa: '' }); setIsAddMemberModalOpen(true); }} className="text-sm px-4 py-2.5 bg-kas-primary text-white hover:bg-kas-dark rounded-xl font-bold transition-all shadow-md">
                            + Tambah Member
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100">
                                    <th className="pb-3 px-4 font-bold">Nama / Kontak</th>
                                    <th className="pb-3 px-4 font-bold text-center">Peran</th>
                                    <th className="pb-3 px-4 font-bold text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {isLoadingMembers ? (
                                    <tr><td colSpan="3" className="text-center py-8 text-gray-400 font-medium">Memuat data anggota...</td></tr>
                                ) : members.length === 0 ? (
                                    <tr><td colSpan="3" className="text-center py-8 text-gray-400 font-medium">Belum ada anggota di grup ini.</td></tr>
                                ) : members.map((member) => (
                                    <tr key={member.id} className="border-b border-gray-50 hover:bg-kas-bg/50 transition-colors">
                                        <td className="py-3 px-4">
                                            <div className="font-bold text-kas-dark">{member.user.name}</div>
                                            <div className="text-xs text-kas-primary font-medium">{member.user.phone_wa || 'Belum ada WA'}</div>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            {member.role === 'admin' ? (
                                                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 font-bold text-[10px] rounded uppercase tracking-wider">Admin</span>
                                            ) : (
                                                <span className="px-2 py-1 bg-gray-100 text-gray-600 font-bold text-[10px] rounded uppercase tracking-wider">Member</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => openEditModal(member)} className="text-kas-primary hover:bg-kas-primary/10 p-2 rounded-lg transition-colors font-bold text-xs">
                                                    Edit
                                                </button>
                                                {member.role !== 'admin' && (
                                                    <button onClick={() => handleRemoveMember(member.user.id, member.user.name)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors font-bold text-xs">
                                                        Keluarkan
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* --- MODAL FORM (Dipakai untuk Tambah & Edit) --- */}
            {(isAddMemberModalOpen || isEditMemberModalOpen) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-kas-dark/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-kas-bg">
                            <h3 className="text-xl font-bold text-kas-dark">
                                {isEditMemberModalOpen ? 'Edit Data Member' : 'Tambah Member Baru'}
                            </h3>
                            <button onClick={() => { setIsAddMemberModalOpen(false); setIsEditMemberModalOpen(false); }} className="text-gray-400 hover:text-red-500 font-bold text-xl">✕</button>
                        </div>
                        
                        <form onSubmit={handleMemberSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-kas-dark mb-1">Nama Lengkap</label>
                                <input 
                                    type="text" required placeholder="Contoh: Budi Santoso"
                                    value={memberForm.name} onChange={(e) => setMemberForm({...memberForm, name: e.target.value})}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-kas-primary outline-none bg-kas-bg/50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-kas-dark mb-1">Nomor WhatsApp</label>
                                <input 
                                    type="text" required placeholder="Cth: 08123456789"
                                    value={memberForm.phone_wa} onChange={(e) => setMemberForm({...memberForm, phone_wa: e.target.value})}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-kas-primary outline-none bg-kas-bg/50"
                                />
                                <p className="text-[10px] text-gray-400 mt-1 font-medium">Sistem akan otomatis merapikan format nomor (+62).</p>
                            </div>
                            
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => { setIsAddMemberModalOpen(false); setIsEditMemberModalOpen(false); }} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-kas-dark rounded-xl font-bold transition-colors">Batal</button>
                                <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-kas-primary hover:bg-kas-dark text-white rounded-xl font-bold shadow-lg shadow-kas-primary/20 transition-all disabled:opacity-70">
                                    {isSubmitting ? 'Memproses...' : 'Simpan Data'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}