"use client"

import React, { useState, useEffect } from 'react';
import {
    Building2,
    Stethoscope,
    Plus,
    Edit2,
    Trash2,
    Save,
    X,
    Loader2,
    Check,
    Settings,
    Phone,
    Image as ImageIcon,
    Upload,
    Globe,
    MapPin,
    Clock,
    Users,
    Calendar,
    Copy,
    CalendarX,
    AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    getDepartments,
    getDoctors,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    createDoctor,
    updateDoctor,
    deleteDoctor,
    getClinicSettings,
    updateClinicSetting,
    getClosures,
    createClosure,
    deleteClosure,
    type Department,
    type Doctor,
    type ClinicSetting,
    type WorkHour,
    type Closure,
    uploadClinicLogo
} from '@/lib/supabase';
import { cn } from '@/lib/utils';

// Force dynamic rendering to prevent build-time errors
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

const defaultWorkHours: WorkHour[] = [
    { day: 1, start: '09:00', end: '18:00', isOpen: true, hasLunchBreak: true, lunchStart: '12:00', lunchEnd: '13:30' },
    { day: 2, start: '09:00', end: '18:00', isOpen: true, hasLunchBreak: true, lunchStart: '12:00', lunchEnd: '13:30' },
    { day: 3, start: '09:00', end: '18:00', isOpen: true, hasLunchBreak: true, lunchStart: '12:00', lunchEnd: '13:30' },
    { day: 4, start: '09:00', end: '18:00', isOpen: true, hasLunchBreak: true, lunchStart: '12:00', lunchEnd: '13:30' },
    { day: 5, start: '09:00', end: '18:00', isOpen: true, hasLunchBreak: true, lunchStart: '12:00', lunchEnd: '13:30' },
    { day: 6, start: '09:00', end: '18:00', isOpen: true, hasLunchBreak: true, lunchStart: '12:00', lunchEnd: '13:30' },
    { day: 0, start: '09:00', end: '18:00', isOpen: false, hasLunchBreak: true, lunchStart: '12:00', lunchEnd: '13:30' },
];

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<'clinic' | 'staff' | 'appointment' | 'workhours'>('clinic');
    // Edit/Create State
    const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
    const [isDocModalOpen, setIsDocModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');
    const [selectedColor, setSelectedColor] = useState('#3b82f6');

    const colors = [
        { name: 'blue', value: '#3b82f6' },
        { name: 'red', value: '#ef4444' },
        { name: 'orange', value: '#f97316' },
        { name: 'amber', value: '#f59e0b' },
        { name: 'green', value: '#10b981' },
        { name: 'emerald', value: '#059669' },
        { name: 'cyan', value: '#06b6d4' },
        { name: 'indigo', value: '#6366f1' },
        { name: 'violet', value: '#8b5cf6' },
        { name: 'fuchsia', value: '#d946ef' },
        { name: 'pink', value: '#ec4899' },
        { name: 'slate', value: '#64748b' },
    ];

    const [departments, setDepartments] = useState<Department[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(true);

    // Appointment Settings State
    const [appointmentSettings, setAppointmentSettings] = useState({
        duration: '30'
    });

    const [savingSettings, setSavingSettings] = useState(false);
    const [originalDuration, setOriginalDuration] = useState('30');
    const [durationConfirmModal, setDurationConfirmModal] = useState<{ open: boolean, value: string }>({ open: false, value: '' });

    // Work Hours State
    const [clinicWorkHours, setClinicWorkHours] = useState<WorkHour[]>(defaultWorkHours);
    const [isWorkHoursModalOpen, setIsWorkHoursModalOpen] = useState(false);
    const [editingWorkHoursTarget, setEditingWorkHoursTarget] = useState<'clinic' | string>('clinic'); // 'clinic' for clinic, doctor_id for doctor
    const [workHoursForm, setWorkHoursForm] = useState<WorkHour[]>([]);
    const [originalWorkHours, setOriginalWorkHours] = useState<WorkHour[]>([]);
    const [savingWorkHours, setSavingWorkHours] = useState(false);

    // Clinic Info State
    const [clinicInfo, setClinicInfo] = useState({
        name: '',
        logo: '',
        phone1: '',
        website: '',
        description: '',
        address: ''
    });
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [savingClinicInfo, setSavingClinicInfo] = useState(false);

    // Closures State
    const [closures, setClosures] = useState<Closure[]>([]);
    const [isClosureModalOpen, setIsClosureModalOpen] = useState(false);

    // Yardımcı fonksiyon: Yerel tarih stringi (YYYY-MM-DD)
    const getTodayString = () => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    };

    const [closureForm, setClosureForm] = useState({
        closure_date: getTodayString(),
        target_type: 'clinic' as 'clinic' | 'doctor',
        doctor_id: '' as string,
        is_full_day: true,
        start_time: '09:00',
        end_time: '18:00',
        reason: ''
    });
    const [savingClosure, setSavingClosure] = useState(false);

    // Load Data
    const loadData = async () => {
        setLoading(true);
        try {
            const [depsData, docsData, settingsData, closuresData] = await Promise.all([
                getDepartments(),
                getDoctors(),
                getClinicSettings(),
                getClosures()
            ]);
            setDepartments(depsData || []);
            setDoctors(docsData || []);
            setClosures(closuresData || []);

            // Map settings
            const settingsMap = {
                duration: '30'
            };
            settingsData.forEach(s => {
                if (s.key === 'appointment_duration') settingsMap.duration = s.value;
                if (s.key === 'clinic_work_hours') {
                    try {
                        const parsed = JSON.parse(s.value);
                        // Eksik lunchStart/lunchEnd varsa default'ları ekle
                        const withDefaults = parsed.map((h: WorkHour) => ({
                            ...h,
                            hasLunchBreak: h.hasLunchBreak ?? true,
                            lunchStart: h.lunchStart || '12:00',
                            lunchEnd: h.lunchEnd || '13:30'
                        }));
                        setClinicWorkHours(withDefaults);
                    } catch (e) {
                        console.error('Klinik saatleri parse edilemedi:', e);
                        setClinicWorkHours(defaultWorkHours);
                    }
                }
                if (s.key === 'clinic_name') setClinicInfo(prev => ({ ...prev, name: s.value }));
                if (s.key === 'clinic_logo') { setClinicInfo(prev => ({ ...prev, logo: s.value })); setLogoPreview(s.value); }
                if (s.key === 'clinic_phone1') setClinicInfo(prev => ({ ...prev, phone1: s.value }));
                if (s.key === 'clinic_website') setClinicInfo(prev => ({ ...prev, website: s.value }));
                if (s.key === 'clinic_description') setClinicInfo(prev => ({ ...prev, description: s.value }));
                if (s.key === 'clinic_address') setClinicInfo(prev => ({ ...prev, address: s.value }));
            });
            setAppointmentSettings(settingsMap);
            // Mevcut değeri veritabanından gelen değer olarak sakla
            setOriginalDuration(settingsMap.duration);
        } catch (error) {
            console.error('Veri yüklenme hatası:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Handlers
    const handleAddDept = () => {
        setEditingItem(null);
        setErrors({});
        setSaveStatus('idle');
        setIsDeptModalOpen(true);
    };

    const handleAddDoc = () => {
        setEditingItem(null);
        setErrors({});
        setSaveStatus('idle');
        setSelectedColor('#3b82f6');
        setIsDocModalOpen(true);
    };

    const handleEditDept = (dept: any) => {
        setEditingItem(dept);
        setErrors({});
        setSaveStatus('idle');
        setIsDeptModalOpen(true);
    };

    const handleEditDoc = (doc: any) => {
        setEditingItem(doc);
        setErrors({});
        setSaveStatus('idle');
        setSelectedColor(doc.color || '#3b82f6');
        setIsDocModalOpen(true);
    };

    const handleDelete = async (id: string, type: 'department' | 'doctor') => {
        if (!confirm('Bu kaydı silmek istediğinize emin misiniz?')) return;

        try {
            if (type === 'department') {
                // Check if department has doctors
                const hasDoctors = doctors.some(doc => doc.department_id === id);
                if (hasDoctors) {
                    alert('Bu bölümde kayıtlı doktorlar bulunmaktadır. Bölümü silebilmek için önce ilgili doktorları silmeli veya başka bir bölüme taşımalısınız.');
                    return;
                }
                await deleteDepartment(id);
                setDepartments(prev => prev.filter(d => d.id !== id));
            } else {
                await deleteDoctor(id);
                setDoctors(prev => prev.filter(d => d.id !== id));
            }
        } catch (error) {
            console.error('Silme hatası:', error);
            alert('Silme işlemi başarısız oldu.');
        }
    };

    const handleSaveDept = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaveStatus('saving');
        const formData = new FormData(e.target as HTMLFormElement);
        const name = formData.get('name') as string;

        if (!name?.trim()) {
            setErrors({ name: 'Bölüm adı zorunludur' });
            setSaveStatus('idle');
            return;
        }

        try {
            if (editingItem) {
                const updated = await updateDepartment(editingItem.id, { name });
                setDepartments(prev => prev.map(d => d.id === updated!.id ? updated! : d));
            } else {
                const created = await createDepartment(name);
                setDepartments(prev => [...prev, created!]);
            }
            setSaveStatus('success');
            setTimeout(() => {
                setIsDeptModalOpen(false);
                setSaveStatus('idle');
            }, 500);
        } catch (error: any) {
            console.error('Bölüm kaydetme hatası:', error);
            setSaveStatus('idle');
            alert(`Hata: ${error.message}`);
        }
    };

    const handleSaveDoc = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaveStatus('saving');
        const formData = new FormData(e.target as HTMLFormElement);
        const full_name = formData.get('full_name') as string;
        const title = formData.get('title') as string;
        const department_id = formData.get('department_id') as string;

        const newErrors: { [key: string]: string } = {};
        if (!title) newErrors.title = 'Ünvan seçilmesi zorunludur';
        if (!full_name?.trim()) newErrors.full_name = 'Ad soyad girilmesi zorunludur';
        if (!department_id) newErrors.department_id = 'Bölüm seçimi zorunludur';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setSaveStatus('idle');
            return;
        }

        const docData = { full_name, title, department_id, color: selectedColor };

        try {
            if (editingItem) {
                await updateDoctor(editingItem.id, docData);
            } else {
                await createDoctor(docData);
            }
            const newDocs = await getDoctors();
            setDoctors(newDocs);
            setSaveStatus('success');
            setTimeout(() => {
                setIsDocModalOpen(false);
                setSaveStatus('idle');
            }, 500);
        } catch (error: any) {
            console.error('Doktor kaydetme hatası:', error);
            setSaveStatus('idle');
            alert(`Hata: ${error.message}`);
        }
    };

    const handleSaveSettings = async () => {
        // Eğer süre değişmişse onay modalını aç
        if (appointmentSettings.duration !== originalDuration) {
            setDurationConfirmModal({ open: true, value: appointmentSettings.duration });
            return;
        }

        // Değişiklik yoksa ama yine de basılmışsa (veya başka bir ayar varsa)
        performSaveSettings();
    };

    const performSaveSettings = async () => {
        setSavingSettings(true);
        try {
            await Promise.all([
                updateClinicSetting('appointment_duration', appointmentSettings.duration)
            ]);
            setOriginalDuration(appointmentSettings.duration);
            alert('Ayarlar başarıyla kaydedildi.');
        } catch (error: any) {
            console.error('Ayarlar kaydedilirken hata:', error);
            alert(`Ayarlar kaydedilirken bir hata oluştu: ${error.message || 'Bilinmeyen hata'}`);
        } finally {
            setSavingSettings(false);
        }
    };

    const handleSaveClinicInfo = async () => {
        setSavingClinicInfo(true);
        try {
            let logoUrl = clinicInfo.logo;
            if (logoFile) {
                logoUrl = await uploadClinicLogo(logoFile);
            }

            await Promise.all([
                updateClinicSetting('clinic_name', clinicInfo.name),
                updateClinicSetting('clinic_logo', logoUrl),
                updateClinicSetting('clinic_phone1', clinicInfo.phone1),
                updateClinicSetting('clinic_website', clinicInfo.website),
                updateClinicSetting('clinic_description', clinicInfo.description),
                updateClinicSetting('clinic_address', clinicInfo.address)
            ]);

            setClinicInfo(prev => ({ ...prev, logo: logoUrl }));
            setLogoFile(null);
            alert('Klinik bilgileri başarıyla kaydedildi.');
        } catch (error: any) {
            console.error('Klinik bilgileri kaydedilirken hata:', error);
            alert(`Hata: ${error.message}`);
        } finally {
            setSavingClinicInfo(false);
        }
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                alert('Logo boyutu 10MB\'dan küçük olmalıdır.');
                return;
            }
            if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
                alert('Sadece PNG ve JPG formatları kabul edilir.');
                return;
            }
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleEditWorkHours = (target: 'clinic' | Doctor) => {
        setEditingWorkHoursTarget(typeof target === 'string' ? target : target.id);
        let hours: WorkHour[];
        if (target === 'clinic') {
            hours = JSON.parse(JSON.stringify(clinicWorkHours));
        } else {
            hours = JSON.parse(JSON.stringify(target.work_hours || defaultWorkHours));
        }
        setWorkHoursForm(hours);
        setOriginalWorkHours(JSON.parse(JSON.stringify(hours)));
        setIsWorkHoursModalOpen(true);
    };

    const handleSaveWorkHours = async () => {
        setSavingWorkHours(true);
        try {
            if (editingWorkHoursTarget === 'clinic') {
                await updateClinicSetting('clinic_work_hours', JSON.stringify(workHoursForm));
                setClinicWorkHours(workHoursForm);
            } else {
                await updateDoctor(editingWorkHoursTarget, { work_hours: workHoursForm });
                setDoctors(prev => prev.map(d => d.id === editingWorkHoursTarget ? { ...d, work_hours: workHoursForm } : d));
            }
            setIsWorkHoursModalOpen(false);
        } catch (error) {
            console.error('Kaydetme hatası:', error);
        } finally {
            setSavingWorkHours(false);
        }
    };

    const handleCloseModal = () => {
        if (JSON.stringify(workHoursForm) !== JSON.stringify(originalWorkHours)) {
            if (!confirm('Kaydedilmemiş değişiklikler var. Çıkmak istediğinize emin misiniz?')) {
                return;
            }
        }
        setIsWorkHoursModalOpen(false);
    };

    // Closure Handlers
    const handleOpenClosureModal = () => {
        setClosureForm({
            closure_date: getTodayString(),
            target_type: 'clinic',
            doctor_id: '',
            is_full_day: true,
            start_time: '09:00',
            end_time: '18:00',
            reason: ''
        });
        setIsClosureModalOpen(true);
    };

    const handleSaveClosure = async () => {
        if (!closureForm.closure_date) {
            alert('Lütfen bir tarih seçin.');
            return;
        }

        if (closureForm.target_type === 'doctor' && !closureForm.doctor_id) {
            alert('Lütfen bir doktor seçin.');
            return;
        }

        if (!closureForm.is_full_day) {
            if (!closureForm.start_time || !closureForm.end_time) {
                alert('Lütfen başlangıç ve bitiş saatlerini girin.');
                return;
            }
            if (closureForm.start_time >= closureForm.end_time) {
                alert('Başlangıç saati bitiş saatinden küçük olmalıdır.');
                return;
            }
        }

        setSavingClosure(true);
        try {
            // Veriyi hazırla - Boş stringleri null'a çevir
            const closureData: any = {
                closure_date: closureForm.closure_date,
                target_type: closureForm.target_type,
                reason: closureForm.reason || null,
                is_active: true
            };

            // Doctor ID kontrolü
            if (closureForm.target_type === 'doctor' && closureForm.doctor_id) {
                closureData.doctor_id = closureForm.doctor_id;
            } else {
                closureData.doctor_id = null;
            }

            // Saat kontrolü
            if (closureForm.is_full_day) {
                closureData.start_time = null;
                closureData.end_time = null;
            } else {
                closureData.start_time = closureForm.start_time || null;
                closureData.end_time = closureForm.end_time || null;
            }

            const newClosure = await createClosure(closureData);

            if (newClosure) {
                setClosures(prev => [...prev, newClosure]);
            }

            setIsClosureModalOpen(false);
            setClosureForm({
                closure_date: getTodayString(),
                target_type: 'clinic',
                doctor_id: '',
                is_full_day: true,
                start_time: '09:00',
                end_time: '18:00',
                reason: ''
            });

            // Listeyi yenile ki doktor ilişkisi doğru gelsin
            await loadData();

        } catch (error: any) {
            console.error('Kapatma kaydetme hatası:', error);
            // Hatayı kullanıcıya göster
            const errorMessage = error?.message || error?.error_description || (typeof error === 'object' ? JSON.stringify(error) : String(error));
            alert(`Kaydetme sırasında bir hata oluştu: ${errorMessage}`);
        } finally {
            setSavingClosure(false);
        }
    };

    const handleDeleteClosure = async (id: string) => {
        if (!confirm('Bu kapatmayı silmek istediğinize emin misiniz?')) return;
        try {
            await deleteClosure(id);
            setClosures(prev => prev.filter(c => c.id !== id));
        } catch (error) {
            console.error('Kapatma silme hatası:', error);
            alert('Kapatma silinirken bir hata oluştu.');
        }
    };

    return (
        <div className="space-y-6 w-full px-4 md:px-6 pb-20">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    Ayarlar
                </h1>
                <p className="text-gray-500 dark:text-gray-400">Sistem genel ayarları ve yapılandırmaları</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-5">
                {/* Sidebar Navigation */}
                <div className="w-full lg:w-72 shrink-0 space-y-2">
                    <button
                        onClick={() => setActiveTab('clinic')}
                        className={cn(
                            "w-full flex items-center gap-3 px-5 py-3.5 text-sm font-bold rounded-lg transition-all duration-200",
                            activeTab === 'clinic'
                                ? "bg-teal-600 text-white shadow-lg shadow-teal-500/20"
                                : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-800"
                        )}
                    >
                        <Building2 size={18} />
                        Klinik Bilgileri
                    </button>
                    <button
                        onClick={() => setActiveTab('staff')}
                        className={cn(
                            "w-full flex items-center gap-3 px-5 py-3.5 text-sm font-bold rounded-lg transition-all duration-200",
                            activeTab === 'staff'
                                ? "bg-teal-600 text-white shadow-lg shadow-teal-500/20"
                                : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-800"
                        )}
                    >
                        <Stethoscope size={18} />
                        Bölüm & Doktorlar
                    </button>
                    <button
                        onClick={() => setActiveTab('workhours')}
                        className={cn(
                            "w-full flex items-center gap-3 px-5 py-3.5 text-sm font-bold rounded-lg transition-all duration-200",
                            activeTab === 'workhours'
                                ? "bg-teal-600 text-white shadow-lg shadow-teal-500/20"
                                : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-800"
                        )}
                    >
                        <Calendar size={18} />
                        Çalışma Saatleri
                    </button>


                </div>

                {/* Content Area */}
                <div className="flex-1">
                    {activeTab === 'clinic' && (
                        <div className="space-y-6">
                            <Card className="border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden rounded-xl bg-white dark:bg-slate-900">
                                <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-gray-100 dark:border-gray-800/50 pb-4 md:pb-6 px-4 md:px-6 pt-4 md:pt-6">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 rounded-xl shadow-sm">
                                            <Building2 size={24} />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg md:text-xl font-bold tracking-tight">Klinik Bilgileri</CardTitle>
                                            <CardDescription className="mt-1 font-medium text-gray-400 text-sm md:text-base">
                                                Genel klinik ayarları ve dijital kimlik bilgilerini buradan güncelleyebilirsiniz.
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={handleSaveClinicInfo}
                                        disabled={savingClinicInfo}
                                        className="w-full md:w-auto bg-teal-600 hover:bg-teal-700 text-white h-11 md:h-11 px-4 md:px-6 rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-teal-500/20 gap-2 text-sm md:text-base"
                                    >
                                        {savingClinicInfo ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                        Değişiklikleri Kaydet
                                    </Button>
                                </CardHeader>
                                <CardContent className="p-8">
                                    <div className="flex flex-col xl:flex-row gap-10">
                                        {/* Right Side: Form Fields */}
                                        <div className="flex-1 space-y-8">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {/* Clinic Name */}
                                                <div className="space-y-2.5">
                                                    <Label className="text-[11px] font-black text-gray-400 tracking-widest px-1">Klinik Adı</Label>
                                                    <div className="relative">
                                                        <Building2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600" />
                                                        <Input
                                                            placeholder="HealthBridge Clinic..."
                                                            value={clinicInfo.name}
                                                            maxLength={100}
                                                            onChange={(e) => setClinicInfo(prev => ({ ...prev, name: e.target.value }))}
                                                            className="h-12 pl-11 bg-white dark:bg-slate-950 border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-teal-500/20 font-bold text-gray-800 dark:text-white transition-all shadow-sm"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Phone */}
                                                <div className="space-y-2.5">
                                                    <Label className="text-[11px] font-black text-gray-400 tracking-widest px-1">Telefon Numarası</Label>
                                                    <div className="relative">
                                                        <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600" />
                                                        <Input
                                                            placeholder="05XXXXXXXXX"
                                                            value={clinicInfo.phone1}
                                                            maxLength={11}
                                                            onChange={(e) => setClinicInfo(prev => ({ ...prev, phone1: e.target.value.replace(/\D/g, '') }))}
                                                            className="h-12 pl-11 bg-white dark:bg-slate-950 border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-teal-500/20 font-bold text-gray-800 dark:text-white transition-all shadow-sm"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Clinic Address */}
                                                <div className="space-y-2.5">
                                                    <Label className="text-[11px] font-black text-gray-400 tracking-widest px-1">Klinik Adresi</Label>
                                                    <div className="relative">
                                                        <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600" />
                                                        <Input
                                                            placeholder="Klinik tam adresi..."
                                                            value={clinicInfo.address}
                                                            maxLength={200}
                                                            onChange={(e) => setClinicInfo(prev => ({ ...prev, address: e.target.value }))}
                                                            className="h-12 pl-11 bg-white dark:bg-slate-950 border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-teal-500/20 font-bold text-gray-800 dark:text-white transition-all shadow-sm"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Website */}
                                                <div className="space-y-2.5">
                                                    <Label className="text-[11px] font-black text-gray-400 tracking-widest px-1">Web Sitesi</Label>
                                                    <div className="relative">
                                                        <Globe size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600" />
                                                        <Input
                                                            placeholder="www.yourclinic.com"
                                                            value={clinicInfo.website}
                                                            maxLength={500}
                                                            onChange={(e) => setClinicInfo(prev => ({ ...prev, website: e.target.value }))}
                                                            className="h-12 pl-11 bg-white dark:bg-slate-950 border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-teal-500/20 font-bold text-gray-800 dark:text-white transition-all shadow-sm"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Description */}
                                                <div className="md:col-span-2 space-y-2.5">
                                                    <Label className="text-[11px] font-black text-gray-400 tracking-widest px-1">Klinik Açıklaması</Label>
                                                    <textarea
                                                        placeholder="Klinik hakkında kısa bir açıklama yazın..."
                                                        value={clinicInfo.description}
                                                        maxLength={500}
                                                        rows={4}
                                                        onChange={(e) => setClinicInfo(prev => ({ ...prev, description: e.target.value }))}
                                                        className="w-full p-4 bg-white dark:bg-slate-950 border-gray-200 dark:border-gray-800 rounded-2xl focus:ring-4 focus:ring-teal-500/10 font-medium text-gray-800 dark:text-white transition-all shadow-sm resize-none outline-none text-sm leading-relaxed"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Left Side: Logo & Visual */}
                                        <div className="w-full xl:w-64 shrink-0">
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between px-1">
                                                    <Label className="text-[11px] font-black text-gray-400 tracking-widest">Klinik Logosu</Label>
                                                    {logoPreview && (
                                                        <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-500/10 px-2 py-0.5 rounded-full uppercase tracking-tighter">Aktif</span>
                                                    )}
                                                </div>
                                                <div className="relative group aspect-square rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-slate-950/50 flex flex-col items-center justify-center overflow-hidden transition-all hover:border-teal-500/50 hover:bg-white dark:hover:bg-slate-950 shadow-inner">
                                                    {logoPreview ? (
                                                        <>
                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px] z-10">
                                                                <button
                                                                    onClick={() => { setLogoPreview(null); setLogoFile(null); setClinicInfo(prev => ({ ...prev, logo: '' })); }}
                                                                    className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-xl transition-all hover:scale-110 active:scale-90"
                                                                >
                                                                    <Trash2 size={20} />
                                                                </button>
                                                            </div>
                                                            <img src={logoPreview} alt="Clinic Logo" className="w-full h-full object-contain p-6 group-hover:scale-110 transition-transform duration-500" />
                                                        </>
                                                    ) : (
                                                        <div className="flex flex-col items-center text-gray-300 dark:text-gray-700">
                                                            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm mb-4">
                                                                <ImageIcon size={32} className="text-gray-200 dark:text-gray-800" />
                                                            </div>
                                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Logo Yok</p>
                                                        </div>
                                                    )}

                                                    <label className="absolute bottom-3 left-3 right-3 z-20">
                                                        <div className="w-full h-10 bg-white dark:bg-slate-900 border border-gray-100 dark:border-gray-800 shadow-xl rounded-xl flex items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-all font-bold text-[11px] text-gray-600 dark:text-gray-300 uppercase tracking-tight">
                                                            <Upload size={14} />
                                                            {logoPreview ? 'Güncelle' : 'Yükle'}
                                                        </div>
                                                        <input type="file" className="hidden" accept="image/png,image/jpeg,image/jpg" onChange={handleLogoChange} />
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {activeTab === 'staff' && (
                        <Card className="border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden rounded-xl">
                            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800/50 pb-6 px-6 pt-6">
                                <div>
                                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                                        Bölüm & Doktor Yönetimi
                                    </CardTitle>
                                    <CardDescription className="mt-1">
                                        Bölümler ve bu bölümlere bağlı doktorların listesini yönetin.
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button onClick={handleAddDept} variant="outline" className="border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 gap-2 h-10 px-4 rounded-lg font-semibold">
                                        <Plus size={16} />
                                        Bölüm Ekle
                                    </Button>
                                    <Button onClick={handleAddDoc} className="bg-teal-600 hover:bg-teal-700 text-white gap-2 h-10 px-5 rounded-lg font-semibold shadow-sm">
                                        <Plus size={16} />
                                        Doktor Ekle
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                {loading ? (
                                    <div className="flex justify-center p-12">
                                        <Loader2 className="animate-spin text-teal-600 h-10 w-10" />
                                    </div>
                                ) : (
                                    <div className="space-y-8">
                                        {/* Staff Grouped View */}
                                        <div className="grid gap-6">
                                            {departments.length === 0 ? (
                                                <div className="text-center p-12 text-gray-400 bg-gray-50 dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-100 dark:border-gray-800">
                                                    <Building2 className="mx-auto mb-3 opacity-20" size={48} />
                                                    <p className="font-medium">Henüz tanımlı bölüm veya doktor bulunmuyor.</p>
                                                    <Button onClick={handleAddDept} variant="link" className="text-teal-600 font-semibold mt-1">İlk Bölümü Ekle</Button>
                                                </div>
                                            ) : (
                                                departments.map(dept => {
                                                    const deptDoctors = doctors.filter(doc => doc.department_id === dept.id);
                                                    return (
                                                        <div key={dept.id} className="space-y-3 group/dept">
                                                            <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-gray-100 dark:border-slate-800 transition-all">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="p-1.5 bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 rounded-lg shadow-sm">
                                                                        <Building2 size={16} />
                                                                    </div>
                                                                    <span className="font-bold text-gray-900 dark:text-white text-base tracking-tight">{dept.name}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1 opacity-0 group-hover/dept:opacity-100 transition-all">
                                                                    <Button size="icon" variant="ghost" onClick={() => handleEditDept(dept)} className="h-8 w-8 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/40 rounded-lg">
                                                                        <Edit2 size={14} />
                                                                    </Button>
                                                                    <Button size="icon" variant="ghost" onClick={() => handleDelete(dept.id, 'department')} className="h-8 w-8 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/40 rounded-lg">
                                                                        <Trash2 size={14} />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                            <div className="ml-4 space-y-1 border-l border-gray-100 dark:border-slate-800">
                                                                {deptDoctors.length === 0 ? (
                                                                    <div className="text-xs text-gray-400 italic py-1.5 pl-6 flex items-center gap-2">
                                                                        Bu bölüme atanmış doktor bulunmuyor.
                                                                    </div>
                                                                ) : (
                                                                    deptDoctors.map(doc => (
                                                                        <div key={doc.id} className="flex items-center justify-between group/doc pl-6 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-800/30 rounded-lg transition-all border border-transparent">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="flex items-center gap-2">
                                                                                    <div
                                                                                        className="w-2.5 h-2.5 rounded-full shadow-sm border border-white dark:border-slate-800"
                                                                                        style={{ backgroundColor: doc.color || '#3b82f6' }}
                                                                                    />
                                                                                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                                                                                        {doc.title} {doc.full_name}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex items-center gap-1 opacity-0 group-hover/doc:opacity-100 transition-all">
                                                                                <Button size="icon" variant="ghost" onClick={() => handleEditDoc(doc)} className="h-8 w-8 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/40 rounded-lg">
                                                                                    <Edit2 size={14} />
                                                                                </Button>
                                                                                <Button size="icon" variant="ghost" onClick={() => handleDelete(doc.id, 'doctor')} className="h-8 w-8 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/40 rounded-lg">
                                                                                    <Trash2 size={14} />
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    ))
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}


                    {activeTab === 'workhours' && (
                        <div className="space-y-4">
                            <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden rounded-xl">
                                <CardHeader className="border-b border-gray-100 dark:border-gray-800/50 px-6 py-4">
                                    <CardTitle className="text-base font-bold flex items-center gap-2">
                                        Çalışma Saatleri
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Kliniğin ve doktorların çalışma saatlerini buradan düzenleyebilirsiniz.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-0 overflow-x-auto">
                                    <div className="min-w-[1000px]">
                                        <div className="grid grid-cols-9 gap-4 px-6 py-4 bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800 text-[10px] font-bold text-gray-400 uppercase tracking-wider items-center">
                                            <div className="col-span-1 pl-2">BİRİM</div>
                                            {['PZT', 'SAL', 'ÇAR', 'PER', 'CUM', 'CMT', 'PAZ'].map(d => <div key={d} className="col-span-1 text-center">{d}</div>)}
                                            <div className="col-span-1 text-right pr-2">İŞLEM</div>
                                        </div>
                                        <div className="divide-y divide-gray-100 dark:divide-slate-800">
                                            {/* Klinik Satırı */}
                                            <div className="grid grid-cols-9 gap-4 px-6 py-4 items-center hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                <div className="col-span-1 font-bold text-teal-600 dark:text-teal-400 pl-2">
                                                    <span className="bg-teal-50 dark:bg-teal-900/30 px-2 py-1 rounded text-xs">Klinik</span>
                                                </div>
                                                {[1, 2, 3, 4, 5, 6, 0].map(day => {
                                                    const hour = clinicWorkHours.find(h => h.day === day);
                                                    return (
                                                        <div key={day} className="col-span-1 text-center text-[10px] font-medium leading-tight">
                                                            {hour?.isOpen ? (
                                                                <>
                                                                    <div className="text-gray-700 dark:text-gray-300">{hour.start}-{hour.end}</div>
                                                                    {hour.hasLunchBreak && (
                                                                        <div className="text-gray-400 text-[9px] mt-0.5">Ara: {hour.lunchStart}-{hour.lunchEnd}</div>
                                                                    )}
                                                                </>
                                                            ) : (
                                                                <span className="text-red-500 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded text-[10px] font-bold">KAPALI</span>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                                <div className="col-span-1 text-right pr-2">
                                                    <Button size="icon" variant="ghost" onClick={() => handleEditWorkHours('clinic')} className="h-8 w-8 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/40 rounded-lg">
                                                        <Edit2 size={14} />
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Doktorlar */}
                                            {doctors.map(doc => (
                                                <div key={doc.id} className="grid grid-cols-9 gap-4 px-6 py-4 items-center hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                    <div className="col-span-1 pl-2 truncate" title={doc.full_name}>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: doc.color }} />
                                                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">{doc.full_name}</span>
                                                        </div>
                                                    </div>
                                                    {[1, 2, 3, 4, 5, 6, 0].map(day => {
                                                        const hours = doc.work_hours || defaultWorkHours;
                                                        const hour = hours.find(h => h.day === day);
                                                        // Eğer klinik kapalıysa ve doktorun ayarı da buna bağlıysa görselleştirme yapılabilir ama şimdilik sadece kendi ayarını gösteriyoruz.
                                                        return (
                                                            <div key={day} className="col-span-1 text-center text-[10px] font-medium leading-tight">
                                                                {hour?.isOpen ? (
                                                                    <div className="text-gray-700 dark:text-gray-300">{hour.start}-{hour.end}</div>
                                                                ) : (
                                                                    <span className="text-red-500 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded text-[10px] font-bold">KAPALI</span>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                    <div className="col-span-1 text-right pr-2">
                                                        <Button size="icon" variant="ghost" onClick={() => handleEditWorkHours(doc)} className="h-8 w-8 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/40 rounded-lg">
                                                            <Edit2 size={14} />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Randevu Ayarları (Artık Çalışma Saatleri sekmesinde) */}
                            <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden rounded-xl">
                                <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 dark:border-gray-800/50 px-6 py-4">
                                    <div>
                                        <CardTitle className="text-base font-bold flex items-center gap-2">
                                            Randevu Süresi
                                        </CardTitle>
                                        <CardDescription className="text-xs">
                                            Takvimdeki her bir randevu diliminin uzunluğunu belirler.
                                        </CardDescription>
                                    </div>
                                    <Button
                                        onClick={handleSaveSettings}
                                        disabled={savingSettings}
                                        className="bg-teal-600 hover:bg-teal-700 text-white h-9 px-4 rounded-lg text-xs font-bold shadow-sm gap-1.5"
                                    >
                                        {savingSettings ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                        Kaydet
                                    </Button>
                                </CardHeader>
                                <CardContent className="p-5 pt-1">
                                    <div className="max-w-xl">
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                            {['15', '30', '45', '60'].map(m => (
                                                <button
                                                    key={m}
                                                    onClick={() => setAppointmentSettings(prev => ({ ...prev, duration: m }))}
                                                    className={cn(
                                                        "h-10 rounded-lg border text-sm font-bold transition-all",
                                                        appointmentSettings.duration === m
                                                            ? "bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-500/20"
                                                            : "bg-white dark:bg-slate-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800 hover:border-teal-300"
                                                    )}
                                                >
                                                    {m} dk.
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Saat & Gün Kapat Bölümü */}
                            <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden rounded-xl">
                                <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 dark:border-gray-800 px-6 py-4">
                                    <div>
                                        <CardTitle className="text-base font-bold">Saat & Gün Kapat</CardTitle>
                                        <CardDescription className="text-xs">Özel günlerde klinik veya doktor kapatmaları</CardDescription>
                                    </div>
                                    <Button onClick={handleOpenClosureModal} className="bg-teal-600 hover:bg-teal-700 text-white h-9 px-4 rounded-lg text-xs font-bold shadow-sm">
                                        <Plus size={14} className="mr-1" /> Yeni Kapatma
                                    </Button>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {closures.length === 0 ? (
                                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                            <CalendarX size={40} className="mx-auto mb-3 opacity-30" />
                                            <p className="text-sm font-medium">Henüz kapatma eklenmedi</p>
                                            <p className="text-xs mt-1">Özel günlerde klinik veya doktor kapatması ekleyebilirsiniz</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-100 dark:divide-slate-800">
                                            {closures.map(closure => (
                                                <div key={closure.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`p-2 rounded-lg ${closure.target_type === 'clinic' ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
                                                            {closure.target_type === 'clinic' ? <Building2 size={16} /> : <Stethoscope size={16} />}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                                                    {new Date(closure.closure_date).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                                                </span>
                                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${closure.target_type === 'clinic' ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                                                                    {closure.target_type === 'clinic' ? 'KLİNİK' : closure.doctors?.full_name || 'Doktor'}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                {closure.start_time && closure.end_time ? (
                                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                        Saat: {closure.start_time.slice(0, 5)} - {closure.end_time.slice(0, 5)}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-xs text-red-500 font-medium">Tüm Gün Kapalı</span>
                                                                )}
                                                                {closure.reason && (
                                                                    <span className="text-xs text-gray-400">• {closure.reason}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Button size="icon" variant="ghost" onClick={() => handleDeleteClosure(closure.id)} className="h-8 w-8 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                                                        <Trash2 size={14} />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>

                {/* Department Modal */}
                {
                    isDeptModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                            <Card className="w-full max-w-md bg-white dark:bg-slate-900 border-none shadow-xl animate-in zoom-in-95 duration-200 rounded-xl overflow-hidden">
                                <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 dark:border-gray-800 p-6">
                                    <CardTitle className="text-lg font-bold">
                                        {editingItem ? 'Bölüm Düzenle' : 'Yeni Bölüm Ekle'}
                                    </CardTitle>
                                    <Button size="icon" variant="ghost" onClick={() => setIsDeptModalOpen(false)} className="h-8 w-8 rounded-lg">
                                        <X size={18} />
                                    </Button>
                                </CardHeader>
                                <form onSubmit={handleSaveDept}>
                                    <CardContent className="p-6 space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Bölüm Adı</Label>
                                            <Input
                                                id="name"
                                                name="name"
                                                maxLength={100}
                                                defaultValue={editingItem?.name}
                                                placeholder="Örn: Kardiyoloji"
                                                className={cn(
                                                    "h-10 px-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-teal-500/20",
                                                    errors.name ? 'border-red-500 bg-red-50/10' : 'border-gray-200 dark:border-gray-800 focus:border-teal-500'
                                                )}
                                                autoFocus
                                            />
                                            {errors.name && <p className="text-xs text-red-500 font-medium pl-1">{errors.name}</p>}
                                        </div>
                                    </CardContent>
                                    <div className="p-6 pt-0 flex justify-end gap-3 font-semibold">
                                        <Button type="button" variant="ghost" onClick={() => setIsDeptModalOpen(false)} className="h-10 px-4 rounded-lg">İptal</Button>
                                        <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white h-10 px-6 rounded-lg shadow-sm transition-all active:scale-95" disabled={saveStatus === 'saving' || saveStatus === 'success'}>
                                            {saveStatus === 'saving' ? <Loader2 size={18} className="animate-spin" /> :
                                                saveStatus === 'success' ? <Check size={18} /> :
                                                    'Kaydet'}
                                        </Button>
                                    </div>
                                </form>
                            </Card>
                        </div>
                    )
                }

                {/* Doctor Modal */}
                {
                    isDocModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                            <Card className="w-full max-w-lg bg-white dark:bg-slate-900 border-none shadow-xl animate-in zoom-in-95 duration-200 rounded-xl overflow-hidden">
                                <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 dark:border-gray-800 p-6">
                                    <CardTitle className="text-lg font-bold">
                                        {editingItem ? 'Doktor Düzenle' : 'Yeni Doktor Ekle'}
                                    </CardTitle>
                                    <Button size="icon" variant="ghost" onClick={() => setIsDocModalOpen(false)} className="h-8 w-8 rounded-lg">
                                        <X size={18} />
                                    </Button>
                                </CardHeader>
                                <form onSubmit={handleSaveDoc}>
                                    <CardContent className="p-6 space-y-5">
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="col-span-1 space-y-2">
                                                <Label htmlFor="title" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Ünvan</Label>
                                                <select
                                                    id="title"
                                                    name="title"
                                                    className={cn(
                                                        "w-full h-10 rounded-lg border bg-transparent px-3 py-1 text-sm shadow-sm transition-all focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-gray-900 dark:text-gray-100",
                                                        errors.title ? 'border-red-500 bg-red-50/10' : 'border-gray-200 dark:border-gray-800 dark:bg-slate-800'
                                                    )}
                                                    defaultValue={editingItem?.title || ''}
                                                >
                                                    <option value="" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100">Seçiniz</option>
                                                    <option value="Dr." className="bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100">Dr.</option>
                                                    <option value="Uzm. Dr." className="bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100">Uzm. Dr.</option>
                                                    <option value="Op. Dr." className="bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100">Op. Dr.</option>
                                                    <option value="Doç. Dr." className="bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100">Doç. Dr.</option>
                                                    <option value="Prof. Dr." className="bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100">Prof. Dr.</option>
                                                </select>
                                                {errors.title && <p className="text-xs text-red-500 font-medium pl-1">{errors.title}</p>}
                                            </div>
                                            <div className="col-span-2 space-y-2">
                                                <Label htmlFor="full_name" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Ad Soyad</Label>
                                                <Input
                                                    id="full_name"
                                                    name="full_name"
                                                    maxLength={50}
                                                    defaultValue={editingItem?.full_name}
                                                    placeholder="Ad Soyad"
                                                    className={cn(
                                                        "h-10 px-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-teal-500/20",
                                                        errors.full_name ? 'border-red-500 bg-red-50/10' : 'border-gray-200 dark:border-gray-800 focus:border-teal-500'
                                                    )}
                                                />
                                                {errors.full_name && <p className="text-xs text-red-500 font-medium pl-1">{errors.full_name}</p>}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="department_id" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Bölüm Ataması</Label>
                                            <select
                                                id="department_id"
                                                name="department_id"
                                                className={cn(
                                                    "w-full h-10 rounded-lg border px-3 py-1 text-sm shadow-sm transition-all focus:ring-2 focus:ring-teal-500/20 outline-none text-gray-900 dark:text-gray-100",
                                                    errors.department_id ? 'border-red-500 bg-red-50/10' : 'border-gray-200 dark:border-gray-800 bg-transparent dark:bg-slate-800'
                                                )}
                                                defaultValue={editingItem?.department_id || ''}
                                            >
                                                <option value="" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100">Bölüm Seçiniz...</option>
                                                {departments.map(d => (
                                                    <option key={d.id} value={d.id} className="bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100">{d.name}</option>
                                                ))}
                                            </select>
                                            {errors.department_id && <p className="text-xs text-red-500 font-medium pl-1">{errors.department_id}</p>}
                                        </div>

                                        <div className="space-y-3">
                                            <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Randevu Rengi</Label>
                                            <div className="flex flex-wrap gap-2.5 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
                                                {colors.map((color) => (
                                                    <button
                                                        key={color.value}
                                                        type="button"
                                                        onClick={() => setSelectedColor(color.value)}
                                                        className={cn(
                                                            "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm",
                                                            selectedColor === color.value ? "ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-slate-900" : ""
                                                        )}
                                                        style={{ backgroundColor: color.value }}
                                                    >
                                                        {selectedColor === color.value && (
                                                            <Check className="text-white drop-shadow-sm" size={14} />
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                            <p className="text-[11px] text-gray-500 italic pl-1">Takvimde bu doktora ait randevular bu renkle gösterilecektir.</p>
                                        </div>
                                    </CardContent>
                                    <div className="p-6 pt-0 flex justify-end gap-3 font-semibold">
                                        <Button type="button" variant="ghost" onClick={() => setIsDocModalOpen(false)} className="h-10 px-4 rounded-lg">İptal</Button>
                                        <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white h-10 px-6 rounded-lg shadow-sm transition-all active:scale-95" disabled={saveStatus === 'saving' || saveStatus === 'success'}>
                                            {saveStatus === 'saving' ? <Loader2 size={18} className="animate-spin" /> :
                                                saveStatus === 'success' ? <Check size={18} /> :
                                                    'Kaydet'}
                                        </Button>
                                    </div>
                                </form>
                            </Card>
                        </div>
                    )
                }
                {/* Work Hours Modal */}
                {isWorkHoursModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                        <Card className="w-full max-w-2xl bg-white dark:bg-slate-900 border-none shadow-xl animate-in zoom-in-95 duration-200 rounded-xl overflow-hidden">
                            <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 dark:border-gray-800 px-6 py-4">
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <Clock size={20} className="text-teal-600" />
                                    {editingWorkHoursTarget === 'clinic'
                                        ? 'Klinik - Çalışma Saatleri'
                                        : `${doctors.find(d => d.id === editingWorkHoursTarget)?.full_name || 'Doktor'} - Çalışma Saatleri`
                                    }
                                </CardTitle>
                                <Button size="icon" variant="ghost" onClick={handleCloseModal} className="h-8 w-8 rounded-lg">
                                    <X size={18} />
                                </Button>
                            </CardHeader>
                            <CardContent className="p-0 max-h-[70vh] overflow-y-auto">
                                <div className="space-y-0 p-4">
                                    <div className="grid grid-cols-12 gap-2 px-4 pb-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-slate-800 mb-2">
                                        <div className={`col-span-2 ${editingWorkHoursTarget !== 'clinic' ? 'col-span-3' : ''}`}>GÜN</div>
                                        <div className="col-span-2 text-center">DURUM</div>
                                        <div className={`${editingWorkHoursTarget === 'clinic' ? 'col-span-4' : 'col-span-7'} text-center`}>ÇALIŞMA SAATLERİ</div>
                                        {editingWorkHoursTarget === 'clinic' && <div className="col-span-4 text-center text-teal-600">ÖĞLE ARASI</div>}
                                    </div>
                                    {[1, 2, 3, 4, 5, 6, 0].map(day => {
                                        const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
                                        const hour = workHoursForm.find(h => h.day === day) || { day, start: '09:00', end: '18:00', isOpen: false };

                                        return (
                                            <div key={day} className={`grid grid-cols-12 gap-2 px-4 py-2 items-center rounded-lg transition-colors ${hour.isOpen ? 'bg-white dark:bg-slate-900' : 'bg-gray-50/50 dark:bg-slate-800/30'}`}>
                                                <div className={`${editingWorkHoursTarget === 'clinic' ? 'col-span-2' : 'col-span-3'} font-bold text-xs text-gray-700 dark:text-gray-300 flex items-center gap-2`}>
                                                    {dayNames[day]}
                                                </div>
                                                <div className="col-span-2 flex justify-center">
                                                    <button
                                                        onClick={() => {
                                                            // Doktor düzenleniyorsa klinik kontrolü yap
                                                            if (editingWorkHoursTarget !== 'clinic') {
                                                                const clinicDay = clinicWorkHours.find(c => c.day === day);
                                                                // Klinik kapalıysa ve doktor açmaya çalışıyorsa engelle
                                                                if (clinicDay && !clinicDay.isOpen && !hour.isOpen) {
                                                                    alert('Klinik bu gün kapalı olduğu için doktor çalışma saati açılamaz.');
                                                                    return;
                                                                }
                                                            }
                                                            const newForm = workHoursForm.map(h => h.day === day ? { ...h, isOpen: !h.isOpen } : h);
                                                            setWorkHoursForm(newForm);
                                                        }}
                                                        className={`w-9 h-5 rounded-full transition-colors relative ${hour.isOpen ? 'bg-teal-600' : 'bg-gray-200 dark:bg-slate-700'}`}
                                                    >
                                                        <span className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform ${hour.isOpen ? 'translate-x-4' : 'translate-x-0'}`} />
                                                    </button>
                                                </div>
                                                <div className={`${editingWorkHoursTarget === 'clinic' ? 'col-span-4' : 'col-span-7'} flex items-center gap-1.5`}>
                                                    <input
                                                        type="time"
                                                        value={hour.start}
                                                        disabled={!hour.isOpen}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            if (editingWorkHoursTarget !== 'clinic') {
                                                                const clinicDay = clinicWorkHours.find(c => c.day === day);
                                                                if (clinicDay && clinicDay.isOpen && (val < clinicDay.start || val > clinicDay.end)) {
                                                                    alert(`Başlangıç saati, klinik çalışma saatleri (${clinicDay.start} - ${clinicDay.end}) sınırları içinde olmalıdır.`);
                                                                }
                                                            }
                                                            const newForm = workHoursForm.map(h => h.day === day ? { ...h, start: val } : h);
                                                            setWorkHoursForm(newForm);
                                                        }}
                                                        className={`w-full h-8 rounded border px-1 text-[11px] text-center outline-none transition-all ${!hour.isOpen ? 'opacity-50 cursor-not-allowed bg-transparent border-gray-100 dark:border-slate-800 text-gray-400' : 'border-gray-200 dark:border-slate-700 focus:border-teal-500 bg-white dark:bg-slate-950 text-gray-900 dark:text-white'}`}
                                                    />
                                                    <span className="text-gray-300 font-bold">-</span>
                                                    <input
                                                        type="time"
                                                        value={hour.end}
                                                        disabled={!hour.isOpen}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            if (editingWorkHoursTarget !== 'clinic') {
                                                                const clinicDay = clinicWorkHours.find(c => c.day === day);
                                                                if (clinicDay && clinicDay.isOpen && (val < clinicDay.start || val > clinicDay.end)) {
                                                                    alert(`Bitiş saati, klinik çalışma saatleri (${clinicDay.start} - ${clinicDay.end}) sınırları içinde olmalıdır.`);
                                                                }
                                                            }
                                                            const newForm = workHoursForm.map(h => h.day === day ? { ...h, end: val } : h);
                                                            setWorkHoursForm(newForm);
                                                        }}
                                                        className={`w-full h-8 rounded border px-1 text-[11px] text-center outline-none transition-all ${!hour.isOpen ? 'opacity-50 cursor-not-allowed bg-transparent border-gray-100 dark:border-slate-800 text-gray-400' : 'border-gray-200 dark:border-slate-700 focus:border-teal-500 bg-white dark:bg-slate-950 text-gray-900 dark:text-white'}`}
                                                    />
                                                </div>
                                                {editingWorkHoursTarget === 'clinic' && (
                                                    <div className="col-span-4 flex items-center gap-1.5 bg-teal-50/30 dark:bg-teal-900/10 p-1 rounded-md">
                                                        <button
                                                            onClick={() => {
                                                                if (!hour.isOpen) return;
                                                                const newForm = workHoursForm.map(h => h.day === day ? { ...h, hasLunchBreak: !h.hasLunchBreak } : h);
                                                                setWorkHoursForm(newForm);
                                                            }}
                                                            disabled={!hour.isOpen}
                                                            className={`shrink-0 w-7 h-4 rounded-full transition-colors relative ${hour.hasLunchBreak && hour.isOpen ? 'bg-teal-600' : 'bg-gray-300 dark:bg-slate-700'} ${!hour.isOpen ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                                                            title={!hour.isOpen ? 'Gün kapalıyken öğle arası düzenlenemez' : (hour.hasLunchBreak ? 'Öğle arasını kapat' : 'Öğle arasını aç')}
                                                        >
                                                            <span className={`absolute top-0.5 left-0.5 bg-white w-3 h-3 rounded-full transition-transform ${hour.hasLunchBreak && hour.isOpen ? 'translate-x-3' : 'translate-x-0'}`} />
                                                        </button>
                                                        <input
                                                            type="time"
                                                            value={hour.lunchStart || '12:00'}
                                                            disabled={!hour.isOpen || !hour.hasLunchBreak}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                const newForm = workHoursForm.map(h => h.day === day ? { ...h, lunchStart: val } : h);
                                                                setWorkHoursForm(newForm);
                                                            }}
                                                            className={`w-full h-8 rounded border px-1 text-[11px] text-center outline-none transition-all ${(!hour.isOpen || !hour.hasLunchBreak) ? 'opacity-50 cursor-not-allowed bg-transparent border-gray-100 dark:border-slate-800 text-gray-400' : 'border-teal-200/50 dark:border-teal-800/50 focus:border-teal-500 bg-white dark:bg-slate-950 text-gray-900 dark:text-white'}`}
                                                        />
                                                        <span className="text-teal-300 font-bold">-</span>
                                                        <input
                                                            type="time"
                                                            value={hour.lunchEnd || '13:30'}
                                                            disabled={!hour.isOpen || !hour.hasLunchBreak}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                const newForm = workHoursForm.map(h => h.day === day ? { ...h, lunchEnd: val } : h);
                                                                setWorkHoursForm(newForm);
                                                            }}
                                                            className={`w-full h-8 rounded border px-1 text-[11px] text-center outline-none transition-all ${(!hour.isOpen || !hour.hasLunchBreak) ? 'opacity-50 cursor-not-allowed bg-transparent border-gray-100 dark:border-slate-800 text-gray-400' : 'border-teal-200/50 dark:border-teal-800/50 focus:border-teal-500 bg-white dark:bg-slate-950 text-gray-900 dark:text-white'}`}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                            <div className="p-6 pt-0 flex justify-end gap-3 font-semibold bg-gray-50/50 dark:bg-slate-800/30 py-4 border-t border-gray-100 dark:border-slate-800">
                                <Button variant="ghost" onClick={handleCloseModal} className="h-10 px-4 rounded-lg hover:bg-white dark:hover:bg-slate-700">İptal</Button>
                                <Button onClick={handleSaveWorkHours} className="bg-teal-600 hover:bg-teal-700 text-white h-10 px-6 rounded-lg shadow-sm" disabled={savingWorkHours}>
                                    {savingWorkHours ? <Loader2 size={18} className="animate-spin" /> : 'Kaydet'}
                                </Button>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Closure Modal */}
                {isClosureModalOpen && (
                    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                        <Card className="w-full max-w-lg bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-2xl animate-in zoom-in-95 duration-300 rounded-3xl overflow-hidden">
                            <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 dark:border-slate-800 px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-teal-50 dark:bg-teal-900/30 rounded-lg">
                                        <CalendarX size={20} className="text-teal-600 dark:text-teal-400" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-black text-gray-900 dark:text-gray-100 tracking-tight">
                                            Yeni Kapatma Ekle
                                        </CardTitle>
                                        <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Kliniği veya bir doktoru belirli bir tarihte kapatın</p>
                                    </div>
                                </div>
                                <Button size="icon" variant="ghost" onClick={() => setIsClosureModalOpen(false)} className="h-8 w-8 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                                    <X size={18} />
                                </Button>
                            </CardHeader>

                            <CardContent className="p-6 space-y-4">
                                {/* Hedef Tipi */}
                                <div className="space-y-3">
                                    <Label className="text-[11px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest pl-1">KAPATMA HEDEFİ</Label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setClosureForm(prev => ({ ...prev, target_type: 'clinic', doctor_id: '' }))}
                                            className={`group relative p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-3 ${closureForm.target_type === 'clinic' ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-900/20' : 'border-gray-100 dark:border-slate-800 hover:border-teal-200 dark:hover:border-teal-900/50 bg-white dark:bg-slate-950'}`}
                                        >
                                            <div className={`p-2.5 rounded-lg transition-colors ${closureForm.target_type === 'clinic' ? 'bg-teal-600 text-white shadow-lg shadow-teal-500/30' : 'bg-gray-50 dark:bg-slate-900 text-gray-400 group-hover:bg-teal-50 dark:group-hover:bg-teal-900/30 group-hover:text-teal-600'}`}>
                                                <Building2 size={20} />
                                            </div>
                                            <span className={`text-xs font-black tracking-tight ${closureForm.target_type === 'clinic' ? 'text-teal-700 dark:text-teal-400' : 'text-gray-500 group-hover:text-teal-600'}`}>Klinik</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setClosureForm(prev => ({ ...prev, target_type: 'doctor' }))}
                                            className={`group relative p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-3 ${closureForm.target_type === 'doctor' ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20' : 'border-gray-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900/50 bg-white dark:bg-slate-950'}`}
                                        >
                                            <div className={`p-2.5 rounded-lg transition-colors ${closureForm.target_type === 'doctor' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-gray-50 dark:bg-slate-900 text-gray-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600'}`}>
                                                <Stethoscope size={20} />
                                            </div>
                                            <span className={`text-xs font-black tracking-tight ${closureForm.target_type === 'doctor' ? 'text-blue-700 dark:text-blue-400' : 'text-gray-500 group-hover:text-blue-600'}`}>Doktor</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Tarih */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <Label className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest pl-1">KAPATMA TARİHİ</Label>
                                        <div className="relative group">
                                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-teal-600 dark:text-teal-400 pointer-events-none group-focus-within:scale-110 transition-transform">
                                                <Calendar size={18} />
                                            </div>
                                            <Input
                                                type="date"
                                                value={closureForm.closure_date}
                                                onChange={(e) => setClosureForm(prev => ({ ...prev, closure_date: e.target.value }))}
                                                min={new Date().toISOString().split('T')[0]}
                                                className="h-12 pl-11 pr-4 rounded-lg border-gray-200 dark:border-slate-800 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 bg-white dark:bg-slate-950 text-gray-900 dark:text-white font-bold text-sm scheme-light dark:scheme-dark"
                                            />
                                        </div>
                                    </div>

                                    {/* Kapatma Tipi (Tüm Gün / Saatli) */}
                                    <div className="space-y-3">
                                        <Label className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest pl-1">KAPATMA TİPİ</Label>
                                        <div className="flex bg-gray-100 dark:bg-slate-950 p-1 rounded-xl border border-gray-100 dark:border-slate-900">
                                            <button
                                                type="button"
                                                onClick={() => setClosureForm(prev => ({ ...prev, is_full_day: true }))}
                                                className={`flex-1 py-2.5 rounded-lg text-xs font-black transition-all ${closureForm.is_full_day ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                            >
                                                TÜM GÜN
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setClosureForm(prev => ({ ...prev, is_full_day: false }))}
                                                className={`flex-1 py-2.5 rounded-lg text-xs font-black transition-all ${!closureForm.is_full_day ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                            >
                                                SAATLİ
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Doktor Seçimi (sadece doctor seçiliyse) */}
                                {closureForm.target_type === 'doctor' && (
                                    <div className="space-y-3 animate-in fade-in slide-in-from-top-3 duration-300">
                                        <Label className="text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest pl-1">DOKTOR SEÇİN</Label>
                                        <div className="relative group">
                                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-600 dark:text-blue-400 pointer-events-none group-focus-within:scale-110 transition-transform">
                                                <Stethoscope size={18} />
                                            </div>
                                            <select
                                                value={closureForm.doctor_id}
                                                onChange={(e) => setClosureForm(prev => ({ ...prev, doctor_id: e.target.value }))}
                                                className="w-full h-12 pl-11 pr-4 rounded-lg bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-sm appearance-none"
                                            >
                                                <option value="">Lütfen seçim yapın...</option>
                                                {doctors.map(doc => (
                                                    <option key={doc.id} value={doc.id}>{doc.title} {doc.full_name}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                                <Users size={16} />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Saat Aralığı */}
                                {!closureForm.is_full_day && (
                                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-3 duration-300 border-t border-gray-50 dark:border-slate-800 pt-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] uppercase tracking-wider pl-1 font-black text-gray-400">BAŞLANGIÇ SAATİ</Label>
                                            <div className="relative">
                                                <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-600/50" />
                                                <Input
                                                    type="time"
                                                    value={closureForm.start_time}
                                                    onChange={(e) => setClosureForm(prev => ({ ...prev, start_time: e.target.value }))}
                                                    className="h-11 pl-10 pr-3 rounded-lg border-gray-200 dark:border-slate-800 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 bg-gray-50/50 dark:bg-slate-950 font-bold"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] uppercase tracking-wider pl-1 font-black text-gray-400">BİTİŞ SAATİ</Label>
                                            <div className="relative">
                                                <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-600/50" />
                                                <Input
                                                    type="time"
                                                    value={closureForm.end_time}
                                                    onChange={(e) => setClosureForm(prev => ({ ...prev, end_time: e.target.value }))}
                                                    className="h-11 pl-10 pr-3 rounded-lg border-gray-200 dark:border-slate-800 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 bg-gray-50/50 dark:bg-slate-950 font-bold"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>

                            <div className="px-6 py-4 bg-gray-50/50 dark:bg-slate-900/50 border-t border-gray-100 dark:border-slate-800 flex justify-end gap-3">
                                <Button
                                    variant="ghost"
                                    onClick={() => setIsClosureModalOpen(false)}
                                    className="h-10 px-5 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-gray-500 font-bold transition-all text-sm"
                                >
                                    Vazgeç
                                </Button>
                                <Button
                                    onClick={handleSaveClosure}
                                    className="bg-teal-600 hover:bg-teal-700 text-white h-10 px-6 rounded-lg shadow-lg shadow-teal-500/25 font-bold tracking-tight transition-all active:scale-95 disabled:grayscale text-sm"
                                    disabled={savingClosure || (closureForm.target_type === 'doctor' && !closureForm.doctor_id)}
                                >
                                    {savingClosure ? (
                                        <div className="flex items-center gap-2">
                                            <Loader2 size={18} className="animate-spin" />
                                            <span>İŞLENİYOR...</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <CalendarX size={18} />
                                            <span>KAPATMAYI ONAYLA</span>
                                        </div>
                                    )}
                                </Button>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Duration Confirmation Modal */}
                {durationConfirmModal.open && (
                    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                        <Card className="w-full max-w-sm bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-2xl animate-in zoom-in-95 duration-300 rounded-3xl overflow-hidden">
                            <CardContent className="pt-6 px-6 pb-2 text-center space-y-3">
                                <div className="mx-auto w-12 h-12 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center">
                                    <AlertTriangle size={24} />
                                </div>
                                <h3 className="text-lg font-black text-gray-900 dark:text-white">Emin misiniz?</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium px-2">
                                    Randevu süresini <span className="font-black text-teal-600 dark:text-teal-400">{durationConfirmModal.value} dakika</span> olarak değiştirmek istediğinize emin misiniz?
                                    Bu işlem takvim yapısını ve mevcut planlamayı etkileyebilir.
                                </p>
                            </CardContent>
                            <div className="p-4 bg-gray-50/50 dark:bg-slate-900/50 border-t border-gray-100 dark:border-slate-800 flex flex-col gap-2">
                                <Button
                                    onClick={() => {
                                        setDurationConfirmModal({ open: false, value: '' });
                                        performSaveSettings();
                                    }}
                                    className="w-full bg-teal-600 hover:bg-teal-700 text-white h-10 rounded-lg font-bold shadow-lg shadow-teal-500/20 text-xs"
                                >
                                    EVET, DEĞİŞTİR VE KAYDET
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => setDurationConfirmModal({ open: false, value: '' })}
                                    className="w-full h-10 rounded-lg text-gray-400 font-bold hover:bg-white dark:hover:bg-slate-700 text-xs"
                                >
                                    İPTAL
                                </Button>
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
