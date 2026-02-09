"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Users,
    Plus,
    Search,
    UserPlus,
    User,
    X,
    Calendar,
    ChevronRight,
    Loader2,
    MoreVertical,
    Trash2,
    Calendar as CalendarIcon,
    ArrowLeft,
    UserMinus,
    Pin,
    Edit,
    CheckSquare,
    Pencil,
    Clock
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    getPatientGroups,
    getPatients,
    createPatientGroup,
    updatePatientGroup,
    deletePatientGroup,
    addPatientToGroup,
    type Patient,
    type PatientGroup
} from '@/lib/supabase';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import * as XLSX from 'xlsx';

export default function PatientGroupsPage() {
    const router = useRouter();
    const [groups, setGroups] = useState<PatientGroup[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState<string | 'all'>('all');
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDesc, setNewGroupDesc] = useState('');
    const [searchGlobalTerm, setSearchGlobalTerm] = useState('');
    const [globalSearchResults, setGlobalSearchResults] = useState<Patient[]>([]);
    const [isAddingMember, setIsAddingMember] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<PatientGroup | null>(null);
    const [selectedPatientIds, setSelectedPatientIds] = useState<string[]>([]);
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [groupsData, patientsData] = await Promise.all([
                getPatientGroups(),
                getPatients()
            ]);
            console.log('Fetched Groups:', groupsData);
            console.log('Fetched Patients Count:', patientsData.length);
            setGroups(groupsData);
            setPatients(patientsData);
        } catch (error) {
            console.error('Veri yükleme hatası:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGroupName.trim()) return;

        try {
            const newGroup = await createPatientGroup(newGroupName, newGroupDesc);
            if (newGroup) {
                setGroups(prev => [...prev, newGroup]);
                setIsCreateModalOpen(false);
                setNewGroupName('');
                setNewGroupDesc('');
                setSelectedGroupId(newGroup.id);
                alert('Grup başarıyla oluşturuldu.');
            }
        } catch (error: any) {
            console.error('Grup oluşturma hatası:', error);
            alert(`Grup oluşturulurken bir hata oluştu: ${error.message || 'Bilinmeyen hata'}`);
        }
    };

    const handleDeleteGroup = async (id: string) => {
        if (!window.confirm('Bu grubu silmek istediğinize emin misiniz?')) return;
        try {
            await deletePatientGroup(id);
            setGroups(prev => prev.filter(g => g.id !== id));
            if (selectedGroupId === id) setSelectedGroupId('all');
        } catch (error) {
            console.error('Grup silme hatası:', error);
        }
    };

    const handleAddPatientToGroup = async (patientId: string) => {
        if (selectedGroupId === 'all') return;
        try {
            await addPatientToGroup(patientId, selectedGroupId);
            // Refresh patient data to reflect new group
            const updatedPatients = await getPatients();
            setPatients(updatedPatients);
        } catch (error) {
            console.error('Hastayı gruba ekleme hatası:', error);
        }
    };

    const handleBulkRemoveFromGroup = async () => {
        if (selectedPatientIds.length === 0) return;
        if (!window.confirm(`${selectedPatientIds.length} hastayı gruptan çıkarmak istediğinize emin misiniz?`)) return;

        try {
            await Promise.all(selectedPatientIds.map(id => addPatientToGroup(id, null)));
            const updatedPatients = await getPatients();
            setPatients(updatedPatients);
            setSelectedPatientIds([]);
            alert('Hastalar başarıyla çıkarıldı.');
        } catch (error) {
            console.error('Toplu çıkarma hatası:', error);
        }
    };

    const handleRemovePatientFromGroup = async (patientId: string) => {
        try {
            await addPatientToGroup(patientId, null);
            const updatedPatients = await getPatients();
            setPatients(updatedPatients);
        } catch (error) {
            console.error('Hastayı gruptan çıkarma hatası:', error);
        }
    };

    useEffect(() => {
        if (searchGlobalTerm.length > 0) {
            const filtered = patients.filter(p =>
                p.full_name.toLowerCase().includes(searchGlobalTerm.toLowerCase()) ||
                p.identity_no.includes(searchGlobalTerm)
            );
            setGlobalSearchResults(filtered.slice(0, 5));
        } else {
            setGlobalSearchResults([]);
        }
    }, [searchGlobalTerm, patients]);

    useEffect(() => {
        setSelectedPatientIds([]);
    }, [selectedGroupId]);

    const handleExportExcel = (group: PatientGroup | { name: string, id: string }) => {
        const groupMembers = patients.filter(p => group.id === 'all' ? true : p.group_id === group.id);

        const exportData = groupMembers.map(m => ({
            'Hasta Adı Soyadı': m.full_name,
            'TC Kimlik No': m.identity_no,
            'Telefon': m.phone || '-',
            'Kayıt Tarihi': new Date(m.created_at!).toLocaleDateString('tr-TR')
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Hastalar");

        XLSX.writeFile(wb, `${group.name}.xlsx`);
    };

    const handleUpdateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingGroup || !editingGroup.name.trim()) return;

        try {
            await updatePatientGroup(editingGroup.id, {
                name: editingGroup.name,
                description: editingGroup.description
            });
            setGroups(prev => prev.map(g => g.id === editingGroup.id ? { ...g, name: editingGroup.name, description: editingGroup.description } : g));
            setIsEditModalOpen(false);
            setEditingGroup(null);
            alert('Grup başarıyla güncellendi.');
        } catch (error) {
            console.error('Grup güncelleme hatası:', error);
            alert('Grup güncellenirken bir hata oluştu.');
        }
    };

    const selectedGroup = selectedGroupId === 'all'
        ? { name: 'Tüm Hastalar', description: 'Sistemdeki bütün kayıtlı hastalar' }
        : groups.find(g => g.id === selectedGroupId);

    const filteredGroupMembers = patients.filter(p => {
        const matchesGroup = selectedGroupId === 'all' ? true : p.group_id === selectedGroupId;

        // Sadece "Tüm Hastalar" sekmesinde arama filtresi uygula. 
        // Özel gruplarda liste kaybolmasın, arama alanı sadece ekleme/grup içi kontrol için kullanılsın.
        if (selectedGroupId !== 'all') return matchesGroup;

        const matchesSearch = p.full_name.toLowerCase().includes(searchGlobalTerm.toLowerCase()) ||
            p.identity_no.includes(searchGlobalTerm);
        return matchesGroup && matchesSearch;
    });

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="animate-spin text-teal-600" size={40} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Hasta Grupları</h1>
                    <p className="text-base text-gray-500 mt-1">Hastalarınızı departmanlara veya özel ihtiyaçlara göre gruplayın.</p>
                </div>
                <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-500/20"
                >
                    <Plus size={18} className="mr-2" />
                    Yeni Grup Oluştur
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Groups Sidebar */}
                <div className="lg:col-span-1 space-y-4">
                    <Card className="border-none shadow-sm dark:bg-slate-900 border border-gray-100 dark:border-slate-800">
                        <CardContent className="p-3 space-y-1">
                            {/* Pinned "All" Group */}
                            <button
                                onClick={() => setSelectedGroupId('all')}
                                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${selectedGroupId === 'all'
                                    ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 font-bold'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${selectedGroupId === 'all' ? 'bg-teal-100 dark:bg-teal-900/30' : 'bg-gray-100 dark:bg-slate-800'}`}>
                                        <Pin size={18} className={selectedGroupId === 'all' ? 'text-teal-600' : 'text-gray-400'} />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-lg font-bold">Tüm Hastalar</p>
                                        <p className="text-sm opacity-70 font-medium">{patients.length} Hasta</p>
                                    </div>
                                </div>
                            </button>

                            <div className="h-px bg-gray-100 dark:bg-slate-800 my-2" />

                            {/* Dynamic Groups */}
                            {groups.map(group => (
                                <div key={group.id} className="relative group">
                                    <button
                                        onClick={() => setSelectedGroupId(group.id)}
                                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${selectedGroupId === group.id
                                            ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 font-bold'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${selectedGroupId === group.id ? 'bg-teal-100 dark:bg-teal-900/30' : 'bg-gray-100 dark:bg-slate-800'}`}>
                                                <Users size={18} className={selectedGroupId === group.id ? 'text-teal-600' : 'text-gray-400'} />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-lg truncate max-w-[200px] font-bold">{group.name}</p>
                                                <p className="text-sm opacity-70 font-medium">
                                                    {patients.filter(p => p.group_id === group.id).length} Hasta
                                                </p>
                                            </div>
                                        </div>
                                    </button>

                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                                    <MoreVertical size={14} />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48 p-1.5 shadow-xl border-gray-100 dark:border-slate-800 rounded-xl">
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        setEditingGroup(group);
                                                        setIsEditModalOpen(true);
                                                    }}
                                                    className="text-gray-700 dark:text-gray-300 focus:text-teal-600 focus:bg-teal-50 dark:focus:bg-teal-900/20 text-xs font-bold px-3 py-2 rounded-lg cursor-pointer transition-colors"
                                                >
                                                    Bilgileri Düzenle
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleExportExcel(group)}
                                                    className="text-gray-700 dark:text-gray-300 focus:text-blue-600 focus:bg-blue-50 dark:focus:bg-blue-900/20 text-xs font-bold px-3 py-2 rounded-lg cursor-pointer transition-colors"
                                                >
                                                    Dışarı Aktar (Excel)
                                                </DropdownMenuItem>
                                                <div className="h-px bg-gray-100 dark:bg-slate-800 my-1" />
                                                <DropdownMenuItem
                                                    onClick={() => handleDeleteGroup(group.id)}
                                                    className="text-red-500 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20 text-xs font-bold px-3 py-2 rounded-lg cursor-pointer transition-colors"
                                                >
                                                    Grubu Sil
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* Group Content */}
                <div className="lg:col-span-3 space-y-6">
                    <Card className="border-none shadow-sm dark:bg-slate-900 overflow-hidden border border-gray-100 dark:border-slate-800">
                        <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-teal-100 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                                    {selectedGroupId === 'all' ? <Pin size={24} /> : <Users size={24} />}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedGroup?.name}</h2>
                                    <p className="text-sm text-gray-500">{selectedGroup?.description}</p>
                                </div>
                            </div>

                            {selectedGroupId === 'all' ? (
                                <Button
                                    onClick={() => handleExportExcel({ name: 'Tüm Hastalar', id: 'all' })}
                                    className="bg-blue-600 hover:bg-blue-700 text-white h-10 px-6 rounded-xl text-sm font-bold gap-2 shadow-lg shadow-blue-500/20"
                                >
                                    Dışarı Aktar (Excel)
                                </Button>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    <div className="flex flex-row items-center justify-between gap-4">
                                        {selectedGroup && 'created_at' in selectedGroup && (
                                            <p className="text-xs text-gray-400 flex items-center gap-1 font-medium bg-white/50 dark:bg-slate-900/50 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-slate-800 shadow-sm">
                                                <Clock size={14} className="text-teal-600" />
                                                Grup Oluşturma: {new Date(selectedGroup.created_at!).toLocaleString('tr-TR')}
                                            </p>
                                        )}

                                        {selectedPatientIds.length > 0 && (
                                            <Button
                                                variant="destructive"
                                                onClick={handleBulkRemoveFromGroup}
                                                className="h-10 px-6 rounded-xl text-sm font-bold gap-2 animate-in fade-in zoom-in duration-200 shadow-lg shadow-red-500/20"
                                            >
                                                <Trash2 size={16} /> {selectedPatientIds.length} Gruptan Çıkar
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <CardContent className="p-0">
                            {selectedGroupId !== 'all' && (
                                <div className="p-4 bg-teal-50/30 dark:bg-teal-900/10 border-b border-gray-100 dark:border-slate-800">
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-600 transition-transform group-focus-within:scale-110">
                                            <Search size={20} />
                                        </div>
                                        <Input
                                            placeholder="Hasta ekle veya Hasta ara"
                                            value={searchGlobalTerm}
                                            onChange={(e) => setSearchGlobalTerm(e.target.value)}
                                            onFocus={() => setIsSearchFocused(true)}
                                            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                                            className="h-12 rounded-xl bg-white dark:bg-slate-950 pl-12 pr-4 border-gray-100 dark:border-slate-800 shadow-sm text-base font-medium focus:ring-4 focus:ring-teal-500/10"
                                        />

                                        {/* Global Search Results Dropdown */}
                                        {globalSearchResults.length > 0 && isSearchFocused && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-100 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                                {globalSearchResults.map(p => {
                                                    const isMember = p.group_id === selectedGroupId;
                                                    return (
                                                        <button
                                                            key={p.id}
                                                            onClick={() => !isMember && handleAddPatientToGroup(p.id)}
                                                            className={`w-full p-3.5 flex items-center justify-between transition-colors border-b last:border-0 border-gray-50 dark:border-slate-800 ${isMember ? 'cursor-default bg-gray-50/30 dark:bg-slate-800/20' : 'hover:bg-teal-50 dark:hover:bg-teal-900/20'}`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isMember ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-600' : 'bg-gray-100 dark:bg-slate-800 text-gray-500'}`}>
                                                                    <User size={18} />
                                                                </div>
                                                                <div className="text-left">
                                                                    <p className={`text-sm font-bold ${isMember ? 'text-teal-700 dark:text-teal-400' : 'text-gray-900 dark:text-white'}`}>{p.full_name}</p>
                                                                    <p className="text-[10px] text-gray-500 font-medium tracking-wider">{p.identity_no}</p>
                                                                </div>
                                                            </div>
                                                            {isMember ? (
                                                                <span className="text-[10px] bg-teal-50 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 px-2.5 py-1.5 rounded-lg font-black tracking-tighter shadow-sm flex items-center">
                                                                    EKLENDİ
                                                                </span>
                                                            ) : (
                                                                <span className="text-[10px] bg-teal-600 text-white px-3 py-1.5 rounded-lg font-black tracking-tighter shadow-md shadow-teal-500/20 transition-transform active:scale-95">
                                                                    GRUBA EKLE
                                                                </span>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50/50 dark:bg-slate-800/50 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-slate-800">
                                        <tr>
                                            {selectedGroupId !== 'all' && (
                                                <th className="px-6 py-5 w-10">
                                                    <input
                                                        type="checkbox"
                                                        checked={filteredGroupMembers.length > 0 && selectedPatientIds.length === filteredGroupMembers.length}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedPatientIds(filteredGroupMembers.map(m => m.id));
                                                            } else {
                                                                setSelectedPatientIds([]);
                                                            }
                                                        }}
                                                        className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 w-4 h-4"
                                                    />
                                                </th>
                                            )}
                                            <th className="px-6 py-5">Ad Soyad</th>
                                            <th className="px-6 py-5">TC Kimlik No</th>
                                            <th className="px-6 py-5 font-bold">Telefon</th>
                                            <th className="px-6 py-5">Kayıt Tarihi</th>
                                            <th className="px-6 py-5 text-center">İşlem</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                        {filteredGroupMembers.map(member => (
                                            <tr key={member.id} className="group hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                {selectedGroupId !== 'all' && (
                                                    <td className="px-6 py-4">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedPatientIds.includes(member.id)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setSelectedPatientIds(prev => [...prev, member.id]);
                                                                } else {
                                                                    setSelectedPatientIds(prev => prev.filter(id => id !== member.id));
                                                                }
                                                            }}
                                                            className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 w-4 h-4"
                                                        />
                                                    </td>
                                                )}
                                                <td className="px-6 py-5">
                                                    <span className="text-lg font-bold text-gray-900 dark:text-white">{member.full_name}</span>
                                                </td>
                                                <td className="px-6 py-5 text-base font-bold text-gray-700 dark:text-gray-300">
                                                    {member.identity_no}
                                                </td>
                                                <td className="px-6 py-5 text-sm text-gray-600 dark:text-gray-400 font-bold">
                                                    {member.phone}
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-1.5 text-sm font-bold text-gray-500">
                                                        <CalendarIcon size={16} />
                                                        {new Date(member.created_at!).toLocaleDateString('tr-TR')}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {selectedGroupId !== 'all' ? (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => window.open(`/admin/hastalar/hasta-karti/${member.id}`, '_blank')}
                                                            className="text-xs font-bold text-teal-600 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-900/20"
                                                        >
                                                            Hasta Kartı
                                                        </Button>
                                                    ) : (
                                                        <button
                                                            onClick={() => window.open(`/admin/hastalar/hasta-karti/${member.id}`, '_blank')}
                                                            className="text-xs font-bold text-teal-600 hover:underline"
                                                        >
                                                            Hasta Kartı
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredGroupMembers.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-20 text-center">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-400">
                                                            <Users size={24} />
                                                        </div>
                                                        <p className="text-sm font-bold text-gray-500">Bu grupta henüz hiç hasta bulunmuyor.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Create Group Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
                        <form onSubmit={handleCreateGroup}>
                            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white">Yeni Grup Oluştur</h3>
                                <Button variant="ghost" size="icon" onClick={() => setIsCreateModalOpen(false)}>
                                    <X size={20} />
                                </Button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Grup İsmi</label>
                                        <span className={`text-xs font-bold ${newGroupName.length > 90 ? 'text-red-500' : 'text-gray-400'}`}>{newGroupName.length}/100</span>
                                    </div>
                                    <Input
                                        placeholder="Örn: Diyabet Hastaları, VIP Üyeler..."
                                        value={newGroupName}
                                        onChange={(e) => setNewGroupName(e.target.value.slice(0, 100))}
                                        className="h-12 rounded-xl text-lg"
                                        autoFocus
                                        maxLength={100}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Açıklama (Opsiyonel)</label>
                                        <span className={`text-xs font-bold ${newGroupDesc.length > 450 ? 'text-red-500' : 'text-gray-400'}`}>{newGroupDesc.length}/500</span>
                                    </div>
                                    <textarea
                                        placeholder="Bu grup hakkında kısa bir not..."
                                        value={newGroupDesc}
                                        onChange={(e) => setNewGroupDesc(e.target.value.slice(0, 500))}
                                        rows={3}
                                        maxLength={500}
                                        className="w-full p-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-base font-medium focus:ring-2 focus:ring-teal-500/20 outline-none resize-none"
                                    />
                                </div>
                            </div>
                            <div className="px-6 py-4 bg-gray-50/50 dark:bg-slate-800/50 flex items-center justify-end gap-3">
                                <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)} className="font-bold text-gray-500">İptal</Button>
                                <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-8 shadow-lg shadow-teal-500/20">Grubu Oluştur</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Edit Group Modal */}
            {isEditModalOpen && editingGroup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
                        <form onSubmit={handleUpdateGroup}>
                            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white">Grup Bilgilerini Düzenle</h3>
                                <Button type="button" variant="ghost" size="icon" onClick={() => setIsEditModalOpen(false)}>
                                    <X size={20} />
                                </Button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Grup İsmi</label>
                                        <span className={`text-xs font-bold ${editingGroup.name.length > 90 ? 'text-red-500' : 'text-gray-400'}`}>{editingGroup.name.length}/100</span>
                                    </div>
                                    <Input
                                        placeholder="Grup ismi..."
                                        value={editingGroup.name}
                                        onChange={(e) => setEditingGroup({ ...editingGroup, name: e.target.value.slice(0, 100) })}
                                        className="h-12 rounded-xl text-lg"
                                        autoFocus
                                        maxLength={100}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Açıklama</label>
                                        <span className={`text-xs font-bold ${(editingGroup.description || '').length > 450 ? 'text-red-500' : 'text-gray-400'}`}>{(editingGroup.description || '').length}/500</span>
                                    </div>
                                    <textarea
                                        placeholder="Açıklama..."
                                        value={editingGroup.description || ''}
                                        onChange={(e) => setEditingGroup({ ...editingGroup, description: e.target.value.slice(0, 500) })}
                                        rows={3}
                                        maxLength={500}
                                        className="w-full p-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-base font-medium focus:ring-2 focus:ring-teal-500/20 outline-none resize-none"
                                    />
                                </div>
                            </div>
                            <div className="px-6 py-4 bg-gray-50/50 dark:bg-slate-800/50 flex items-center justify-end gap-3">
                                <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)} className="font-bold text-gray-500">İptal</Button>
                                <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-8 shadow-lg shadow-teal-500/20">Güncelle</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
