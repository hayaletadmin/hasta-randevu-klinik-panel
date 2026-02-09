"use client"

// Force dynamic rendering to prevent build-time errors
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, Suspense } from 'react';
import {
    Search,
    Plus,
    MoreVertical,
    Filter,
    Download,
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Clock,
    ChevronDown,
    X,
    RefreshCw,
    Edit,
    Trash2,
    Save,
    AlertCircle,
    FileText,
    ArrowDownWideNarrow,
    ArrowUpWideNarrow,
    Loader2
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
    getAppointments,
    updateAppointment,
    deleteAppointment,
    getDepartments,
    getDoctors,
    getClinicSettings,
    type Department,
    type Doctor,
    type ClinicSetting
} from '@/lib/supabase';

// Initial Mock Data
const initialAppointments: any[] = [];

import { useSearchParams } from 'next/navigation';

function AppointmentListPageContent() {
    const searchParams = useSearchParams();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRows, setSelectedRows] = useState<number[]>([]);
    const [appointments, setAppointments] = useState(initialAppointments);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
    const [calendarViewDate, setCalendarViewDate] = useState(new Date());
    const [highlightId, setHighlightId] = useState<string | null>(null);

    useEffect(() => {
        const id = searchParams.get('highlight');
        if (id) {
            setHighlightId(id);
            // Scroll into view logic could be added here if refs were managed per row

            // Remove highlight after 2 seconds
            const timer = setTimeout(() => {
                setHighlightId(null);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [searchParams]);

    // Modal States
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
    const [editFormData, setEditFormData] = useState<any>({});
    const [originalEditData, setOriginalEditData] = useState<any>(null);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showIdentitySuggestions, setShowIdentitySuggestions] = useState(false);
    const [filteredPatients, setFilteredPatients] = useState<any[]>([]);
    const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
    const [departments, setDepartments] = useState<Department[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [durationSlot, setDurationSlot] = useState(30);
    const [showAppUnsavedModal, setShowAppUnsavedModal] = useState(false);
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

    const mockPatients = [
        { id: 1, fullName: 'Ahmet Yılmaz', identityNo: '12345678901', phone: '+90 555 123 45 67' },
        { id: 2, fullName: 'Ayşe Demir', identityNo: '23456789012', phone: '+90 532 987 65 43' },
        { id: 3, fullName: 'Mehmet Kaya', identityNo: '34567890123', phone: '+90 544 111 22 33' },
        { id: 4, fullName: 'Fatma Çelik', identityNo: '45678901234', phone: '+90 505 555 44 22' },
        { id: 5, fullName: 'Ali Veli', identityNo: '56789012345', phone: '+90 530 000 00 00' }
    ];

    const validateTCKN = (value: string) => {
        if (value.length !== 11) return false;
        if (!/^\d+$/.test(value)) return false;
        if (value[0] === '0') return false;

        let total1 = 0;
        let total2 = 0;
        let total3 = 0;

        for (let i = 0; i < 10; i++) total1 += Number(value[i]);
        for (let i = 0; i < 9; i += 2) total2 += Number(value[i]);
        for (let i = 1; i < 8; i += 2) total3 += Number(value[i]);

        const rule1 = (total2 * 7 - total3) % 10;
        const rule2 = total1 % 10;

        return rule1 === Number(value[9]) && rule2 === Number(value[10]);
    };

    const formatPhone = (value: string) => {
        let raw = value.replace(/\D/g, '');
        if (raw.startsWith('90')) raw = raw.slice(2);
        if (raw.length > 10) raw = raw.slice(0, 10);

        if (raw.length === 0) return '+90 ';
        if (raw.length <= 3) return `+90 ${raw}`;
        if (raw.length <= 6) return `+90 ${raw.slice(0, 3)} ${raw.slice(3)}`;
        if (raw.length <= 8) return `+90 ${raw.slice(0, 3)} ${raw.slice(3, 6)} ${raw.slice(6)}`;
        return `+90 ${raw.slice(0, 3)} ${raw.slice(3, 6)} ${raw.slice(6, 8)} ${raw.slice(8)}`;
    };

    const selectPatient = (patient: any) => {
        setEditFormData((prev: any) => ({
            ...prev,
            name: patient.fullName,
            identityNo: patient.identityNo,
            phone: patient.phone
        }));
        setShowSuggestions(false);
        setShowIdentitySuggestions(false);
    };

    const handleDeleteClick = (app: any) => {
        setSelectedAppointment(app);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!selectedAppointment) return;

        try {
            await deleteAppointment(selectedAppointment.id);
            setAppointments(prev => prev.filter(a => a.id !== selectedAppointment.id));
            setIsDeleteModalOpen(false);
            setSelectedAppointment(null);
        } catch (error) {
            console.error('Silme işlemi başarısız:', error);
            alert('Randevu silinirken bir hata oluştu.');
        }
    };

    const handleEditClick = (app: any) => {
        setSelectedAppointment(app);
        const initialData = {
            ...app,
            date: app.rawDate || app.date.split('.').reverse().join('-'),
            department_id: app.department_id, // Ensure these are passed from mapped object
            doctor_id: app.doctor_id
        };
        setEditFormData(initialData);
        setOriginalEditData(initialData);
        setIsEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        const hasChanges = JSON.stringify(editFormData) !== JSON.stringify(originalEditData);
        if (hasChanges) {
            setShowAppUnsavedModal(true);
            return;
        }
        setIsEditModalOpen(false);
        setSelectedAppointment(null);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (isEditModalOpen) handleCloseEditModal();
                if (isDeleteModalOpen) setIsDeleteModalOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isEditModalOpen, isDeleteModalOpen, editFormData, originalEditData]);

    const handleEditFormChange = (e: any) => {
        const { id, value } = e.target;

        if (id === 'identityNo') {
            if (/^\d*$/.test(value) && value.length <= 11) {
                setEditFormData((prev: any) => ({ ...prev, [id]: value }));

                if (value.length > 2) {
                    const filtered = mockPatients.filter(p => p.identityNo.includes(value));
                    setFilteredPatients(filtered);
                    setShowIdentitySuggestions(true);
                    setShowSuggestions(false);
                } else {
                    setShowIdentitySuggestions(false);
                }

                if (value.length === 11 && !validateTCKN(value)) {
                    setFormErrors(prev => ({ ...prev, identityNo: 'Geçersiz TC' }));
                } else {
                    setFormErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.identityNo;
                        return newErrors;
                    });
                }
            }
        }
        else if (id === 'name') {
            if (/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]*$/.test(value)) {
                setEditFormData((prev: any) => ({ ...prev, [id]: value }));

                if (value.length > 1) {
                    const filtered = mockPatients.filter(p =>
                        p.fullName.toLocaleLowerCase('tr').includes(value.toLocaleLowerCase('tr'))
                    );
                    setFilteredPatients(filtered);
                    setShowSuggestions(true);
                } else {
                    setShowSuggestions(false);
                }
            }
        }
        else if (id === 'phone') {
            if (value.length < 4) return;
            const formatted = formatPhone(value);
            if (formatted.length <= 17) {
                setEditFormData((prev: any) => ({ ...prev, [id]: formatted }));
            }
        }
        else {
            setEditFormData((prev: any) => ({ ...prev, [id]: value }));
        }
    };

    const handleUpdate = async () => {
        try {
            const updates = {
                status: editFormData.status,
                // Combine process into notes if it exists, otherwise just saving editFormData.notes
                notes: editFormData.process ? `İşlem: ${editFormData.process.trim()}. ${editFormData.notes || ''}`.trim() : editFormData.notes,
                appointment_date: editFormData.date,
                appointment_time: editFormData.time,
                priority: editFormData.priority,
                department_id: editFormData.department_id || null,
                doctor_id: editFormData.doctor_id || null
            };

            await updateAppointment(selectedAppointment.id, updates);
            await fetchAppointments();
            setIsEditModalOpen(false);
            setSelectedAppointment(null);
        } catch (error: any) {
            console.error('Güncelleme hatası:', error);
            if (error.message?.includes('appointments_doctor_id_appointment_date_appointment_time_key') || error.code === '23505') {
                alert('UYARI: Seçilen tarih ve saatte doktorun başka bir randevusu bulunmaktadır. Lütfen farklı bir zaman dilimi seçiniz.');
            } else {
                alert(`Güncelleme hatası: ${error.message || JSON.stringify(error)}`);
            }
        }
    };

    const fetchAppointments = async () => {
        setIsRefreshing(true);
        try {
            const data = await getAppointments();

            const mappedApps = data.map((app: any) => {
                const rawDate = app.appointment_date;
                let displayDate = rawDate;
                if (rawDate && rawDate.includes('-')) {
                    const [year, month, day] = rawDate.split('-');
                    displayDate = `${day}.${month}.${year}`;
                }

                return {
                    id: app.id,
                    name: app.patients?.full_name || 'Bilinmiyor',
                    identityNo: app.patients?.identity_no || '',
                    phone: app.patients?.phone || '',
                    department: app.departments?.name || '',
                    doctor: app.doctors ? `${app.doctors.title || ''} ${app.doctors.full_name}`.trim() : '',
                    doctorColor: app.doctors?.color || '#3b82f6',
                    process: app.procedures?.name || (app.notes?.includes('İşlem:') ? app.notes.split('İşlem: ')[1].split('.')[0] : ''),
                    priority: app.priority || 'normal',
                    notes: app.notes || '',
                    time: app.appointment_time ? app.appointment_time.slice(0, 5) : '',
                    date: displayDate,
                    rawDate: rawDate,
                    status: app.status || 'Bekleniyor',
                    department_id: app.department_id,
                    doctor_id: app.doctor_id,
                    created_at: app.created_at,
                    recorded_by: app.recorded_by
                };
            });

            setAppointments(mappedApps);
        } catch (error) {
            console.error('Veriler yüklenirken hata oluştu:', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
        const loadMetadata = async () => {
            const [deps, docs, settings] = await Promise.all([
                getDepartments(),
                getDoctors(),
                getClinicSettings()
            ]);
            setDepartments(deps || []);
            setDoctors(docs || []);

            const durationSetting = settings.find((s: ClinicSetting) => s.key === 'appointment_duration')?.value;
            if (durationSetting) setDurationSlot(parseInt(durationSetting));
        };
        loadMetadata();
    }, []);

    // Tarih Formatlama Yardımcısı (DD.MM.YYYY)
    const formatDateTR = (dateStr: string) => {
        if (!dateStr) return '';
        const [year, month, day] = dateStr.split('-');
        return `${day}.${month}.${year}`;
    };

    const generateTimeSlots = () => {
        const slots = [];
        for (let hour = 8; hour < 19; hour++) {
            for (let min = 0; min < 60; min += durationSlot) {
                const h = hour.toString().padStart(2, '0');
                const m = min.toString().padStart(2, '0');
                slots.push(`${h}:${m}`);
            }
        }
        return slots;
    };

    const getButtonLabel = () => {
        if (selectedPreset) return selectedPreset;
        if (startDate && endDate) return `${formatDateTR(startDate)} - ${formatDateTR(endDate)}`;
        return 'Tarih Aralığı';
    };

    // Filtreleme ve Sıralama Mantığı
    const sortedAndFilteredAppointments = React.useMemo(() => {
        let result = appointments.filter(app => {
            const term = searchTerm.toLocaleLowerCase('tr');
            const matchesSearch =
                app.name.toLocaleLowerCase('tr').includes(term) ||
                app.doctor.toLocaleLowerCase('tr').includes(term) ||
                app.department.toLocaleLowerCase('tr').includes(term) ||
                app.process.toLocaleLowerCase('tr').includes(term);

            if (!matchesSearch) return false;

            // Tarih Filtresi
            if (startDate || endDate) {
                const [day, month, year] = app.date.split('.');
                const appDate = new Date(Number(year), Number(month) - 1, Number(day));

                if (startDate) {
                    const start = new Date(startDate);
                    if (appDate < start) return false;
                }
                if (endDate) {
                    const end = new Date(endDate);
                    if (appDate > end) return false;
                }
            }

            return true;
        });

        // Sıralama (created_at'e göre)
        return result.sort((a, b) => {
            const dateA = new Date(a.created_at || 0).getTime();
            const dateB = new Date(b.created_at || 0).getTime();
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });
    }, [appointments, searchTerm, startDate, endDate, sortOrder]);

    // Pagination Mantığı
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentAppointments = sortedAndFilteredAppointments.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(sortedAndFilteredAppointments.length / itemsPerPage);

    const toggleSelectAll = () => {
        if (selectedRows.length === sortedAndFilteredAppointments.length) {
            setSelectedRows([]);
        } else {
            setSelectedRows(sortedAndFilteredAppointments.map(app => app.id));
        }
    };

    const toggleSelectRow = (id: number) => {
        if (selectedRows.includes(id)) {
            setSelectedRows(selectedRows.filter(rowId => rowId !== id));
        } else {
            setSelectedRows([...selectedRows, id]);
        }
    };

    const updateStatus = async (id: number, newStatus: string) => {
        try {
            await updateAppointment(String(id), { status: newStatus });
            await fetchAppointments();
        } catch (e) {
            console.error(e);
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Tamamlandı':
                return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20';
            case 'Bekleniyor':
                return 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20';
            case 'Gelmedi':
                return 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-500/20';
            case 'İptal':
                return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    // Status Dot Color
    const getStatusDotColor = (status: string) => {
        switch (status) {
            case 'Tamamlandı': return 'bg-emerald-500';
            case 'Bekleniyor': return 'bg-amber-500';
            case 'Gelmedi': return 'bg-rose-500';
            case 'İptal': return 'bg-slate-500';
            default: return 'bg-gray-500';
        }
    };

    const handleExport = async () => {
        const XLSX = await import('xlsx');

        const dataToExport = selectedRows.length > 0
            ? appointments.filter(app => selectedRows.includes(app.id))
            : sortedAndFilteredAppointments;

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Randevular");
        XLSX.writeFile(wb, "randevu_listesi.xlsx");
    };

    return (
        <div className="space-y-6">
            {/* Sayfa Başlığı */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Randevu Listesi</h1>
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                        <CalendarIcon size={14} className="text-teal-500" /> Toplam {sortedAndFilteredAppointments.length} kayıt bulundu
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={fetchAppointments}
                        disabled={isRefreshing}
                        className="h-10 w-10 p-0 rounded-lg border-gray-200 dark:border-slate-700 text-gray-500 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-slate-800 transition-all"
                        title="Listeyi Yenile"
                    >
                        <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} />
                    </Button>
                    <Link href="/admin/randevular/ekle">
                        <Button className="bg-teal-600 hover:bg-teal-700 h-10 px-4 text-xs font-bold rounded-lg gap-2 shadow-lg shadow-teal-500/20 transition-all active:scale-95 uppercase tracking-wider">
                            <Plus size={18} /> Yeni Randevu
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Filtreler ve Arama */}
            <Card className="border-none shadow-sm bg-white dark:bg-slate-900 overflow-visible transition-all duration-300">
                <CardContent className="p-4 space-y-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Hasta adı, doktor, bölüm veya işlem ara..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1); // Aramada ilk sayfaya dön
                                }}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-teal-500/20 transition-all dark:text-white dark:placeholder-gray-500 outline-none"
                            />
                        </div>
                        <div className="flex items-center gap-2">
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
                                    <Button variant="outline" className={`border-gray-100 dark:border-slate-800 h-10 px-4 rounded-lg gap-2 font-bold text-xs uppercase tracking-wider transition-all
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
                                    <div className="flex h-[400px]">
                                        {/* Presets Sidebar */}
                                        <div className="w-[160px] bg-gray-50/50 dark:bg-slate-800/50 border-r border-gray-100 dark:border-slate-800 p-2 flex flex-col gap-1">
                                            {[
                                                { label: 'Bugün', days: 0 },
                                                { label: 'Dün', days: 1 },
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
                                                            if (preset.label === 'Dün') {
                                                                start.setDate(today.getDate() - 1);
                                                                end.setDate(today.getDate() - 1);
                                                            } else {
                                                                start.setDate(today.getDate() - (preset.days || 0));
                                                            }
                                                        }

                                                        // Format Date to YYYY-MM-DD
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

                                        {/* Custom Calendar Inline */}
                                        <div className="flex-1 p-4 bg-white dark:bg-slate-900 border-l border-gray-100 dark:border-slate-800">
                                            {/* Calendar Header Nav */}
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
                                                    const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0: Sunday
                                                    const startingEmptyDays = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Convert to Mon=0

                                                    return (
                                                        <div key={offset} className="w-[300px]">
                                                            {/* Weekday Headers */}
                                                            <div className="grid grid-cols-7 mb-2">
                                                                {['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Cm', 'Pa'].map(d => (
                                                                    <div key={d} className="text-center text-xs font-bold text-gray-400 py-1">{d}</div>
                                                                ))}
                                                            </div>
                                                            {/* Days Grid */}
                                                            <div className="grid grid-cols-7 gap-y-1 gap-x-1">
                                                                {Array.from({ length: startingEmptyDays }).map((_, i) => (
                                                                    <div key={`empty-${i}`} />
                                                                ))}

                                                                {Array.from({ length: daysInMonth }).map((_, i) => {
                                                                    const day = i + 1;
                                                                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

                                                                    const isStart = startDate === dateStr;
                                                                    const isEnd = endDate === dateStr;
                                                                    const isInRange = startDate && endDate && dateStr > startDate && dateStr < endDate;
                                                                    const isToday = new Date().toISOString().split('T')[0] === dateStr;

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
                                                                                ${isStart || isEnd
                                                                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                                                                                    : isInRange
                                                                                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 rounded-none'
                                                                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                                                                                }
                                                                                ${isToday && !isStart && !isEnd && !isInRange ? 'ring-1 ring-indigo-600 text-indigo-600' : ''}
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
                                                        {selectedPreset ? (
                                                            <span>Seçili: <span className="text-teal-600 font-bold">{selectedPreset}</span></span>
                                                        ) : startDate && endDate ? (
                                                            <span>Seçili: <span className="text-indigo-600 font-bold">{formatDateTR(startDate)}</span> - <span className="text-indigo-600 font-bold">{formatDateTR(endDate)}</span></span>
                                                        ) : (
                                                            <span>Tarih aralığı seçiniz</span>
                                                        )}
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            setStartDate('');
                                                            setEndDate('');
                                                            setSelectedPreset(null);
                                                        }}
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

                    {/* Selection Actions - Container Sağ Alt */}
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
                                <th className="p-4 w-[50px]">
                                    <Checkbox
                                        checked={selectedRows.length === sortedAndFilteredAppointments.length && sortedAndFilteredAppointments.length > 0}
                                        onCheckedChange={toggleSelectAll}
                                        className="border-gray-300 dark:border-slate-600 data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                                    />
                                </th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider w-[22%] min-w-[180px]">Hasta Adı</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider w-[22%] min-w-[180px]">Bölüm / İşlem</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider w-[18%] min-w-[150px]">Doktor</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider w-[14%] min-w-[120px]">Tarih</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider w-[10%] min-w-[100px]">Saat</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider w-[12%] min-w-[120px]">Oluşturan</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider w-[14%] min-w-[140px]">Durum</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center w-[60px]">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50">
                            {currentAppointments.length > 0 ? (
                                currentAppointments.map((app) => (
                                    <tr key={app.id} id={`row-${app.id}`} className={`hover:bg-teal-500/2 dark:hover:bg-teal-500/4 transition-all duration-500 group ${highlightId === app.id ? 'bg-yellow-100 dark:bg-yellow-900/20' : ''}`}>
                                        <td className="p-4">
                                            <Checkbox
                                                checked={selectedRows.includes(app.id)}
                                                onCheckedChange={() => toggleSelectRow(app.id)}
                                                className="border-gray-300 dark:border-slate-600 data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                                            />
                                        </td>
                                        <td className="p-4">
                                            <span className="text-base font-bold text-gray-900 dark:text-white group-hover:text-teal-600 transition-colors">{app.name}</span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{app.department}</span>
                                                <span className="text-xs text-gray-400 font-medium">{app.process}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-2.5 h-2.5 rounded-full border border-white dark:border-slate-800 shadow-sm"
                                                    style={{ backgroundColor: app.doctorColor }}
                                                />
                                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{app.doctor}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-sm font-bold text-gray-600 dark:text-gray-300">{app.date}</span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1.5 text-sm font-bold text-gray-600 dark:text-gray-300">
                                                <Clock size={12} className="text-teal-500" />
                                                {app.time}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className={`
                                                inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-tight
                                                ${(app.recorded_by === 'Kullanıcı')
                                                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20'
                                                    : 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-500/20'
                                                }
                                            `}>
                                                {app.recorded_by || 'Sistem'}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <DropdownMenu modal={false}>
                                                <DropdownMenuTrigger asChild>
                                                    <button
                                                        className={`
                                                            w-full px-2.5 py-1.5 rounded-lg text-xs font-bold border cursor-pointer select-none transition-all active:scale-95 flex items-center justify-between gap-2 outline-none
                                                            ${getStatusStyle(app.status)}
                                                        `}
                                                    >
                                                        {app.status}
                                                        <ChevronDown size={10} className="opacity-50" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="start" className="w-[120px]">
                                                    {['Bekleniyor', 'Gelmedi', 'İptal', 'Tamamlandı'].map((status) => (
                                                        <DropdownMenuItem
                                                            key={status}
                                                            onClick={() => updateStatus(app.id, status)}
                                                            className="text-xs font-bold gap-2 cursor-pointer"
                                                        >
                                                            <div className={`w-1.5 h-1.5 rounded-full ${getStatusDotColor(status)}`} />
                                                            {status}
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                        <td className="p-4 text-center">
                                            <DropdownMenu modal={false}>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-lg">
                                                        <MoreVertical size={16} />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleEditClick(app)} className="cursor-pointer font-bold text-xs">
                                                        Düzenle
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDeleteClick(app)} className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-900/10 font-bold text-xs">
                                                        Sil
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-500 text-sm">
                                        Aramanızla eşleşen randevu bulunamadı.
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
                        {sortedAndFilteredAppointments.length} KAYITTAN {sortedAndFilteredAppointments.length > 0 ? indexOfFirstItem + 1 : 0}-{Math.min(indexOfLastItem, sortedAndFilteredAppointments.length)} ARASI GÖSTERİLİYOR
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

                        {/* Sayfa Numaraları */}
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(page => {
                                // Basit mantık: İlk, son, ve mevcut sayfanın etrafındakileri göster
                                return page === 1 ||
                                    page === totalPages ||
                                    (page >= currentPage - 1 && page <= currentPage + 1);
                            })
                            .map((page, index, array) => {
                                // Araya ... koymak için kontrol (bir öncekiyle fark 1'den büyükse)
                                const showEllipsis = index > 0 && page - array[index - 1] > 1;

                                return (
                                    <React.Fragment key={page}>
                                        {showEllipsis && <span className="text-gray-400 text-xs px-1">...</span>}
                                        <Button
                                            variant="ghost"
                                            onClick={() => setCurrentPage(page)}
                                            className={`h-8 w-8 rounded-lg font-black text-[10px] ${currentPage === page ? 'bg-teal-600 text-white' : 'text-gray-400 hover:text-teal-600'}`}
                                        >
                                            {page}
                                        </Button>
                                    </React.Fragment>
                                );
                            })}

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

            {/* Appointment Unsaved Changes Modal */}
            {showAppUnsavedModal && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <Card className="w-full max-w-sm bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-2xl animate-in zoom-in-95 duration-300 rounded-3xl overflow-hidden">
                        <CardContent className="pt-8 px-8 pb-4 text-center space-y-4">
                            <div className="mx-auto w-16 h-16 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center text-amber-500 shadow-inner">
                                <AlertCircle size={32} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Emin misiniz?</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                                    Yaptığınız değişiklikler kaydedilmedi. Çıkmak istediğinize emin misiniz?
                                </p>
                            </div>
                        </CardContent>
                        <div className="p-6 pt-2 flex flex-col gap-2">
                            <Button
                                onClick={() => {
                                    setShowAppUnsavedModal(false);
                                    setIsEditModalOpen(false);
                                    setSelectedAppointment(null);
                                }}
                                className="w-full h-12 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg shadow-lg shadow-teal-500/20 transition-all active:scale-95"
                            >
                                Değişiklikleri At ve Çık
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => setShowAppUnsavedModal(false)}
                                className="w-full h-12 text-gray-500 dark:text-gray-400 font-bold hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg transition-all"
                            >
                                Düzenlemeye Devam Et
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <Card className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 max-w-sm w-full space-y-4 border border-gray-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3 text-red-600">
                            <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                                <Trash2 size={20} />
                            </div>
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white tracking-tight">Randevuyu Sil</h3>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                            <span className="font-bold text-gray-900 dark:text-white">{selectedAppointment?.name}</span> isimli hastanın randevusunu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                        </p>
                        <div className="flex items-center justify-end gap-3 pt-2">
                            <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)} className="h-10 px-4 text-sm font-bold rounded-lg text-gray-500">
                                Vazgeç
                            </Button>
                            <Button onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white h-10 px-6 text-sm font-bold rounded-lg shadow-lg shadow-red-500/20 transition-all active:scale-95">
                                Evet, Sil
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
            {/* Edit Modal (Popup) */}
            {isEditModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                    onClick={handleCloseEditModal}
                >
                    <div
                        className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-100 dark:border-slate-800"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-gray-50/50 dark:bg-slate-800/50">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-teal-100 dark:bg-teal-900/20 flex items-center justify-center text-teal-600">
                                    <Edit size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">Randevu Düzenle</h3>
                                    <p className="text-xs text-gray-500">Hasta ve randevu bilgilerini güncelleyin</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={handleCloseEditModal} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </Button>
                        </div>

                        {/* Content Scrollable */}
                        <div className="p-6 overflow-y-auto space-y-6 flex-1">
                            {/* Hasta Bilgileri */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-800 pb-2">Hasta Bilgileri</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5 relative">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Ad Soyad</label>
                                        <input
                                            id="name"
                                            value={editFormData?.name || ''}
                                            readOnly
                                            className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50 text-gray-500 dark:text-gray-400 text-sm focus:ring-0 outline-none cursor-not-allowed"
                                        />
                                    </div>
                                    <div className="space-y-1.5 relative">
                                        <label className="text-xs font-bold text-gray-500 uppercase">TC Kimlik No</label>
                                        <input
                                            id="identityNo"
                                            value={editFormData?.identityNo || ''}
                                            readOnly
                                            className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50 text-gray-500 dark:text-gray-400 text-sm focus:ring-0 outline-none cursor-not-allowed"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Telefon</label>
                                        <input
                                            id="phone"
                                            value={editFormData?.phone || ''}
                                            readOnly
                                            className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50 text-gray-500 dark:text-gray-400 text-sm focus:ring-0 outline-none cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Randevu Bilgileri */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-800 pb-2">Randevu Detayları</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Bölüm</label>
                                        <select
                                            id="department_id"
                                            value={editFormData?.department_id || ''}
                                            onChange={(e) => setEditFormData((prev: any) => ({ ...prev, department_id: e.target.value, doctor_id: '' }))}
                                            className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500/20 outline-none"
                                        >
                                            <option value="">Seçiniz</option>
                                            {departments.map(dept => (
                                                <option key={dept.id} value={dept.id}>{dept.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Doktor</label>
                                        <select
                                            id="doctor_id"
                                            value={editFormData?.doctor_id || ''}
                                            onChange={(e) => setEditFormData((prev: any) => ({ ...prev, doctor_id: e.target.value }))}
                                            className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500/20 outline-none"
                                        >
                                            <option value="">Seçiniz</option>
                                            {doctors
                                                .filter(doc => !editFormData?.department_id || doc.department_id === editFormData.department_id)
                                                .map(doc => (
                                                    <option key={doc.id} value={doc.id}>{doc.title} {doc.full_name}</option>
                                                ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase">İşlem</label>
                                        <input
                                            id="process"
                                            value={editFormData?.process || ''}
                                            onChange={handleEditFormChange}
                                            maxLength={50}
                                            className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500/20 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Öncelik</label>
                                        <select
                                            id="priority"
                                            value={editFormData?.priority || 'normal'}
                                            onChange={handleEditFormChange}
                                            className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500/20 outline-none"
                                        >
                                            <option value="normal">Normal</option>
                                            <option value="acil">Acil</option>
                                            <option value="vip">VIP</option>
                                            <option value="engelli">Engelli / 65+</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Tarih</label>
                                        <input
                                            type="date"
                                            id="date"
                                            value={editFormData?.date || ''}
                                            onChange={handleEditFormChange}
                                            className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500/20 outline-none dark:scheme-dark"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Saat</label>
                                        <select
                                            id="time"
                                            value={editFormData?.time || ''}
                                            onChange={handleEditFormChange}
                                            className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500/20 outline-none dark:scheme-dark"
                                        >
                                            <option value="">Seçiniz</option>
                                            {generateTimeSlots().map(slot => (
                                                <option key={slot} value={slot}>{slot}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Durum</label>
                                        <select
                                            id="status"
                                            value={editFormData?.status || 'Bekleniyor'}
                                            onChange={handleEditFormChange}
                                            className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500/20 outline-none"
                                        >
                                            <option value="Bekleniyor">Bekleniyor</option>
                                            <option value="Tamamlandı">Tamamlandı</option>
                                            <option value="Gelmedi">Gelmedi</option>
                                            <option value="İptal">İptal</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Notlar */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <FileText size={14} className="text-gray-500" />
                                    Notlar
                                </label>
                                <textarea
                                    id="notes"
                                    value={editFormData?.notes || ''}
                                    onChange={handleEditFormChange}
                                    placeholder="Hastanın şikayeti veya ek notlar..."
                                    maxLength={1000}
                                    rows={3}
                                    className="w-full p-3 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500/20 resize-none outline-none"
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between bg-gray-50/50 dark:bg-slate-800/50">
                            <div className="flex items-center gap-4">
                                {selectedAppointment?.created_at && (
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Oluşturulma</span>
                                        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                                            <span>{new Date(selectedAppointment.created_at).toLocaleDateString('tr-TR')}</span>
                                            <span className="w-px h-3 bg-gray-200 dark:bg-slate-700" />
                                            <span>{new Date(selectedAppointment.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </div>
                                )}
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Düzenleyen</span>
                                    <div className="flex items-center gap-2 bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 px-2.5 py-1 rounded-lg border border-teal-100 dark:border-teal-500/20 text-[11px] font-bold uppercase tracking-tight shadow-sm">
                                        <span>{selectedAppointment?.recorded_by || 'Sistem'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Button variant="outline" onClick={handleCloseEditModal} className="h-10 px-6 font-bold text-sm rounded-lg">
                                    İptal
                                </Button>
                                <Button onClick={handleUpdate} className="bg-teal-600 hover:bg-teal-700 text-white h-10 px-6 shadow-lg shadow-teal-500/20 gap-2 font-bold text-sm rounded-lg">
                                    <Save size={16} /> Kaydet
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function AppointmentListPage() {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center min-h-screen">
                    <Loader2 className="animate-spin text-teal-600" size={32} />
                </div>
            }
        >
            <AppointmentListPageContent />
        </Suspense>
    );
}
