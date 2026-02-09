"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import {
    Search,
    Plus,
    MoreVertical,
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    X,
    RefreshCw,
    Download,
    User,
    Phone,
    CreditCard,
    ArrowDownWideNarrow,
    ArrowUpWideNarrow
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from "@/components/ui/checkbox";
import Link from 'next/link';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
    getPatients,
    deletePatient,
    type Patient
} from '@/lib/supabase';

export default function PatientListPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRows, setSelectedRows] = useState<string[]>([]);

    const formatPhone = (value: string | undefined) => {
        if (!value) return '-';
        let raw = value.replace(/\D/g, '');
        if (raw.startsWith('90')) raw = raw.slice(2);
        if (raw.length > 10) raw = raw.slice(0, 10);

        if (raw.length === 0) return value;
        if (raw.length < 10) return value;

        return `+90 ${raw.slice(0, 3)} ${raw.slice(3, 6)} ${raw.slice(6, 8)} ${raw.slice(8)}`;
    };
    const [patients, setPatients] = useState<Patient[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
    const [calendarViewDate, setCalendarViewDate] = useState(new Date());
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

    // Initial Fetch
    const fetchPatients = async () => {
        setIsRefreshing(true);
        try {
            const data = await getPatients();
            setPatients(data);
        } catch (error) {
            console.error('Veriler yüklenirken hata oluştu:', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchPatients();
    }, []);

    // Removed server-side search effect
    // useEffect(() => { ... }, [searchTerm]);

    // Format Date
    const formatDateTR = (dateStr?: string) => {
        if (!dateStr) return '-';
        // Handle various formats if needed, assuming ISO string or YYYY-MM-DD
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        return date.toLocaleDateString('tr-TR');
    };

    const getButtonLabel = () => {
        if (selectedPreset) return selectedPreset;
        if (startDate && endDate) return `${formatDateTR(startDate)} - ${formatDateTR(endDate)}`;
        return 'Tarih Aralığı';
    };

    // Filter and Sort Logic
    const sortedAndFilteredPatients = React.useMemo(() => {
        let result = patients.filter(patient => {
            const term = searchTerm.toLocaleLowerCase('tr');
            const matchesSearch =
                (patient.full_name && patient.full_name.toLocaleLowerCase('tr').includes(term)) ||
                (patient.identity_no && patient.identity_no.includes(term));

            if (!matchesSearch) return false;

            if (startDate || endDate) {
                if (!patient.created_at) return false;
                const patientDate = new Date(patient.created_at);
                patientDate.setHours(0, 0, 0, 0);

                if (startDate) {
                    const start = new Date(startDate);
                    if (patientDate < start) return false;
                }
                if (endDate) {
                    const end = new Date(endDate);
                    if (patientDate > end) return false;
                }
            }
            return true;
        });

        // Sorting
        return result.sort((a, b) => {
            const dateA = new Date(a.created_at || 0).getTime();
            const dateB = new Date(b.created_at || 0).getTime();
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });
    }, [patients, searchTerm, startDate, endDate, sortOrder]);

    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentPatients = sortedAndFilteredPatients.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(sortedAndFilteredPatients.length / itemsPerPage);

    const toggleSelectAll = () => {
        if (selectedRows.length === sortedAndFilteredPatients.length && sortedAndFilteredPatients.length > 0) {
            setSelectedRows([]);
        } else {
            setSelectedRows(sortedAndFilteredPatients.map(p => p.id));
        }
    };

    const toggleSelectRow = (id: string) => {
        if (selectedRows.includes(id)) {
            setSelectedRows(selectedRows.filter(rowId => rowId !== id));
        } else {
            setSelectedRows([...selectedRows, id]);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Bu hastayı silmek istediğinize emin misiniz?')) return;
        try {
            await deletePatient(id);
            setPatients(prev => prev.filter(p => p.id !== id));
            setSelectedRows(prev => prev.filter(rowId => rowId !== id));
        } catch (error) {
            alert('Silme işlemi başarısız oldu.');
        }
    };

    const handleExport = () => {
        const dataToExport = selectedRows.length > 0
            ? patients.filter(p => selectedRows.includes(p.id))
            : sortedAndFilteredPatients;

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Hastalar");
        XLSX.writeFile(wb, "hasta_listesi.xlsx");
    };

    return (
        <div className="space-y-6">
            {/* Sayfa Başlığı */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Hasta Listesi</h1>
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                        <User size={14} className="text-teal-500" /> Toplam {sortedAndFilteredPatients.length} kayıt bulundu
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={() => fetchPatients()}
                        disabled={isRefreshing}
                        className="h-10 w-10 p-0 rounded-lg border-gray-200 dark:border-slate-700 text-gray-500 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-slate-800 transition-all"
                        title="Listeyi Yenile"
                    >
                        <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} />
                    </Button>
                    <Link href="/admin/hastalar/ekle">
                        <Button className="bg-teal-600 hover:bg-teal-700 h-10 px-4 text-xs font-bold rounded-lg gap-2 shadow-lg shadow-teal-500/20 transition-all active:scale-95 uppercase tracking-wider">
                            <Plus size={18} /> Yeni Hasta
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Filtreler ve Arama */}
            <Card className="border-none shadow-sm bg-white dark:bg-slate-900 overflow-visible transition-all duration-300">
                <CardContent className="p-4 space-y-4">
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Hasta adı veya TC Kimlik No ara..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-teal-500/20 transition-all dark:text-white dark:placeholder-gray-500 outline-none"
                            />
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                            <Button
                                variant="outline"
                                onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
                                className="border-gray-100 dark:border-slate-800 h-10 px-4 rounded-lg gap-2 font-bold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 hover:bg-teal-50 hover:text-teal-600 transition-all shrink-0"
                            >
                                {sortOrder === 'newest' ? <ArrowDownWideNarrow size={16} /> : <ArrowUpWideNarrow size={16} />}
                                {sortOrder === 'newest' ? 'En Yeni' : 'En Eski'}
                            </Button>

                            <DropdownMenu modal={false}>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className={`border-gray-100 dark:border-slate-800 h-10 px-4 rounded-lg gap-2 font-bold text-xs uppercase tracking-wider transition-all shrink-0
                                        ${startDate || endDate || selectedPreset
                                            ? 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-500/10 dark:text-teal-400'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-teal-50 hover:text-teal-600 hover:border-teal-200'
                                        }`}
                                    >
                                        <CalendarIcon size={16} />
                                        {getButtonLabel()}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[800px] p-0 overflow-hidden shadow-2xl border-0 ring-1 ring-gray-200 dark:ring-gray-800" sideOffset={8}>
                                    {/* (Calendar Logic Simplified Reuse from AppointmentList - Can componentize later) */}
                                    <div className="flex h-[400px]">
                                        {/* Presets Sidebar */}
                                        <div className="w-[160px] bg-gray-50/50 dark:bg-slate-800/50 border-r border-gray-100 dark:border-slate-800 p-2 flex flex-col gap-1">
                                            {[
                                                { label: 'Bugün', days: 0 },
                                                { label: 'Son 7 Gün', days: 7 },
                                                { label: 'Son 30 Gün', days: 30 },
                                                { label: 'Bu Ay', type: 'month' },
                                                { label: 'Tüm Zamanlar', type: 'all' }
                                            ].map((preset) => (
                                                <button
                                                    key={preset.label}
                                                    onClick={() => {
                                                        setSelectedPreset(preset.label);
                                                        const today = new Date();
                                                        let start = new Date();
                                                        let end = new Date();

                                                        if (preset.type === 'all') {
                                                            setStartDate('');
                                                            setEndDate('');
                                                            return;
                                                        }

                                                        if (preset.type === 'month') {
                                                            start = new Date(today.getFullYear(), today.getMonth(), 1);
                                                            end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                                                        } else {
                                                            start.setDate(today.getDate() - (preset.days || 0));
                                                        }

                                                        const formatDate = (d: Date) => {
                                                            const year = d.getFullYear();
                                                            const month = String(d.getMonth() + 1).padStart(2, '0');
                                                            const day = String(d.getDate()).padStart(2, '0');
                                                            return `${year}-${month}-${day}`;
                                                        };

                                                        setStartDate(formatDate(start));
                                                        setEndDate(formatDate(end));
                                                    }}
                                                    className={`w-full text-left px-3 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-between group ${selectedPreset === preset.label
                                                        ? 'bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400'
                                                        : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-700 hover:text-teal-600 dark:hover:text-teal-400'
                                                        }`}
                                                >
                                                    {preset.label}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Custom Calendar Inline for Month View */}
                                        <div className="flex-1 p-4 bg-white dark:bg-slate-900 border-l border-gray-100 dark:border-slate-800">
                                            <div className="flex items-center justify-between mb-4 px-2">
                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                                                    const d = new Date(calendarViewDate);
                                                    d.setMonth(d.getMonth() - 1);
                                                    setCalendarViewDate(d);
                                                }}>
                                                    <ChevronLeft size={16} />
                                                </Button>
                                                <div className="flex gap-8 font-bold text-sm text-gray-700 dark:text-gray-200">
                                                    <span>{calendarViewDate.toLocaleString('tr-TR', { month: 'long', year: 'numeric' })}</span>
                                                    <span>{new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1).toLocaleString('tr-TR', { month: 'long', year: 'numeric' })}</span>
                                                </div>
                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                                                    const d = new Date(calendarViewDate);
                                                    d.setMonth(d.getMonth() + 1);
                                                    setCalendarViewDate(d);
                                                }}>
                                                    <ChevronRight size={16} />
                                                </Button>
                                            </div>

                                            <div className="flex gap-8">
                                                {[0, 1].map(offset => {
                                                    const currentMonthDate = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + offset, 1);
                                                    const year = currentMonthDate.getFullYear();
                                                    const month = currentMonthDate.getMonth();
                                                    const daysInMonth = new Date(year, month + 1, 0).getDate();
                                                    const firstDayOfWeek = new Date(year, month, 1).getDay();
                                                    const startingEmptyDays = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

                                                    return (
                                                        <div key={offset} className="w-[300px]">
                                                            <div className="grid grid-cols-7 mb-2">
                                                                {['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Cm', 'Pa'].map(d => (
                                                                    <div key={d} className="text-center text-xs font-bold text-gray-400 py-1">{d}</div>
                                                                ))}
                                                            </div>
                                                            <div className="grid grid-cols-7 gap-y-1 gap-x-1">
                                                                {Array.from({ length: startingEmptyDays }).map((_, i) => (
                                                                    <div key={`empty-${i}`} />
                                                                ))}
                                                                {Array.from({ length: daysInMonth }).map((_, i) => {
                                                                    const day = i + 1;
                                                                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                                                    return (
                                                                        <button
                                                                            key={day}
                                                                            onClick={() => {
                                                                                setSelectedPreset(null);
                                                                                if (!startDate || (startDate && endDate)) {
                                                                                    setStartDate(dateStr);
                                                                                    setEndDate('');
                                                                                } else {
                                                                                    if (dateStr < startDate) {
                                                                                        setEndDate(startDate);
                                                                                        setStartDate(dateStr);
                                                                                    } else {
                                                                                        setEndDate(dateStr);
                                                                                    }
                                                                                }
                                                                            }}
                                                                            className={`
                                                                                h-9 w-9 flex items-center justify-center text-xs font-bold rounded-lg transition-all relative z-10
                                                                                ${(startDate === dateStr || endDate === dateStr)
                                                                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                                                                                    : (startDate && endDate && dateStr > startDate && dateStr < endDate)
                                                                                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 rounded-none'
                                                                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                                                                                }
                                                                            `}
                                                                        >
                                                                            {day}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {(startDate || endDate) && (
                                                <div className="mt-auto pt-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
                                                    <div className="text-xs text-gray-500 font-medium">
                                                        Seçili: <span className="text-indigo-600 font-bold">{startDate ? formatDateTR(startDate) : ''} - {endDate ? formatDateTR(endDate) : ''}</span>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => { setStartDate(''); setEndDate(''); setSelectedPreset(null); }}
                                                        className="h-8 text-xs font-bold text-red-500 hover:bg-red-50 hover:text-red-600"
                                                    >
                                                        Temizle
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {/* Selection Actions */}
                    {selectedRows.length > 0 && (
                        <div className="flex items-center justify-end gap-3 pt-2 animate-in fade-in slide-in-from-top-2 border-t border-gray-50 dark:border-slate-800/50">
                            <div className="flex items-center gap-2 mr-auto md:mr-0">
                                <div className="bg-teal-500/10 text-teal-600 dark:text-teal-400 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ring-1 ring-teal-500/20">
                                    {selectedRows.length}
                                </div>
                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Seçildi</span>
                            </div>

                            <Button
                                variant="ghost"
                                onClick={() => setSelectedRows([])}
                                className="h-8 text-xs font-bold text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                            >
                                <X size={14} className="mr-1.5" />
                                Vazgeç
                            </Button>

                            <Button
                                onClick={handleExport}
                                className="h-8 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg shadow-sm shadow-teal-500/20 gap-1.5"
                            >
                                <Download size={14} />
                                Excel'e Aktar
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Liste Tablosu */}
            <Card className="border-none shadow-sm bg-white dark:bg-slate-900 overflow-visible">
                <div className="overflow-x-auto overflow-y-visible">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-slate-800/30 border-b border-gray-100 dark:border-slate-800 transition-colors">
                                <th className="px-3 py-3 w-[40px]">
                                    <Checkbox
                                        checked={selectedRows.length === sortedAndFilteredPatients.length && sortedAndFilteredPatients.length > 0}
                                        onCheckedChange={toggleSelectAll}
                                        className="border-gray-300 dark:border-slate-600 data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                                    />
                                </th>
                                <th className="px-3 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider min-w-[150px]">Hasta Adı</th>
                                <th className="px-3 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider min-w-[120px]">Telefon</th>
                                <th className="px-3 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider min-w-[120px]">TC Kimlik No</th>
                                <th className="px-3 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider min-w-[150px]">İlgili Doktor</th>
                                <th className="px-3 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider min-w-[100px]">Kayıt Tarihi</th>
                                <th className="px-3 py-3 pr-8 text-xs font-bold text-gray-400 uppercase tracking-wider text-center w-[50px]">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50">
                            {currentPatients.length > 0 ? (
                                currentPatients.map((patient) => (
                                    <tr key={patient.id} className="hover:bg-teal-500/2 dark:hover:bg-teal-500/4 transition-colors group">
                                        <td className="px-3 py-3">
                                            <Checkbox
                                                checked={selectedRows.includes(patient.id)}
                                                onCheckedChange={() => toggleSelectRow(patient.id)}
                                                className="border-gray-300 dark:border-slate-600 data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                                            />
                                        </td>
                                        <td className="px-3 py-3 cursor-pointer" onClick={() => router.push(`/admin/hastalar/hasta-karti/${patient.id}`)}>
                                            <span className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-teal-600 transition-colors">{patient.full_name}</span>
                                        </td>
                                        <td className="px-3 py-3">
                                            <span className="text-gray-600 dark:text-gray-300 font-medium text-xs">
                                                {formatPhone(patient.phone)}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3">
                                            <span className="text-gray-600 dark:text-gray-300 font-medium text-xs">
                                                {patient.identity_no}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3">
                                            <span className="text-gray-600 dark:text-gray-300 font-medium text-xs">
                                                {patient.doctors?.full_name || '-'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3">
                                            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                                                {formatDateTR(patient.created_at)}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 pr-8 text-center">
                                            <DropdownMenu modal={false}>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-lg">
                                                        <MoreVertical size={16} />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem className="cursor-pointer font-bold text-xs" onClick={() => router.push(`/admin/hastalar/hasta-karti/${patient.id}`)}>
                                                        Hasta Kartı
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDelete(patient.id)} className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-900/10 font-bold text-xs">
                                                        Sil
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500 text-sm">
                                        Aramanızla eşleşen hasta bulunamadı.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-gray-50 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Sol Taraf: Sayfa Başına Gösterim */}
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">SAYFA BAŞINA:</span>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => {
                                setItemsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-teal-500/20 cursor-pointer"
                        >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </div>

                    {/* Orta: Bilgi Metni */}
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        {sortedAndFilteredPatients.length} KAYITTAN {sortedAndFilteredPatients.length > 0 ? indexOfFirstItem + 1 : 0}-{Math.min(indexOfLastItem, sortedAndFilteredPatients.length)} ARASI GÖSTERİLİYOR
                    </p>

                    {/* Sağ: Pagination Butonları */}
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        >
                            <ChevronLeft size={16} />
                        </Button>
                        <div className="flex items-center justify-center min-w-[30px] h-8 bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 text-xs font-bold rounded-lg">
                            {currentPage}
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg"
                            disabled={currentPage === totalPages || totalPages === 0}
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        >
                            <ChevronRight size={16} />
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
