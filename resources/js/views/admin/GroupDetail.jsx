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

    useEffect(() => {
        // GET detail grup
        axios.get(`/api/v1/admin/groups/${id}`)
            .then(res => setGroup(res.data.data))
            .catch(err => {
                console.error(err);
                // Fallback dummy
                setGroup({ id: id, name: 'Futsal (Dummy)', sport_type: 'Futsal', description: 'Gagal mengambil data dari server.' });
            });
    }, [id]);

    // ACTION: DELETE
    const handleDelete = () => {
        MySwal.fire({
            title: 'Hapus Grup?',
            text: `Kamu yakin ingin menghapus "${group.name}"? Data yang terhapus tidak dapat dikembalikan!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#A3485A',
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await axios.delete(`/api/v1/admin/groups/${id}`);
                    MySwal.fire({
                        title: 'Terhapus!',
                        text: 'Grup berhasil dihapus.',
                        icon: 'success',
                        confirmButtonColor: '#842A3B'
                    });
                    navigate('/admin/groups');
                } catch (error) {
                    MySwal.fire('Gagal!', 'Terjadi kesalahan saat menghapus data.', 'error');
                }
            }
        });
    };

    if (!group) return <div className="p-10 text-center animate-pulse">Memuat data...</div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="text-sm font-medium text-gray-400 mb-1 flex items-center gap-2">
                        <Link to="/admin/groups" className="hover:text-kas-primary transition-colors">Komunitas</Link>
                        <span>/</span>
                        <span className="text-kas-soft">Detail Grup</span>
                    </div>
                    <h2 className="text-3xl font-black text-kas-dark tracking-tight">{group.name}</h2>
                    <span className="inline-block px-3 py-1 bg-kas-accent/20 border border-kas-accent/50 text-kas-dark text-xs font-bold rounded-full mt-2">
                        {group.sport_type}
                    </span>
                </div>

                <button onClick={handleDelete} className="px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl font-bold transition-all flex items-center gap-2">
                    <span className="text-lg">🗑️</span> Hapus Grup
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl border border-kas-accent/30 shadow-sm p-6 lg:col-span-1 space-y-6">
                    <div>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Deskripsi</h3>
                        <p className="text-kas-dark font-medium leading-relaxed bg-kas-bg/50 p-4 rounded-xl border border-kas-accent/20">
                            {group.description || 'Tidak ada deskripsi.'}
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-kas-accent/30 shadow-sm p-6 lg:col-span-2 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-kas-dark">Daftar Anggota</h3>
                        <button className="text-sm px-4 py-2 bg-kas-primary/10 text-kas-primary hover:bg-kas-primary hover:text-white rounded-lg font-bold transition-all">
                            + Tambah Member
                        </button>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-kas-accent/50 rounded-xl p-10 bg-kas-bg/30 text-center">
                        <div className="text-4xl mb-3 opacity-50">👥</div>
                        <p className="text-kas-dark font-bold text-lg">Area Member</p>
                    </div>
                </div>
            </div>
        </div>
    );
}