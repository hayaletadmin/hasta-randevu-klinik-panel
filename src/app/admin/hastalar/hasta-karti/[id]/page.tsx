"use client"

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
    User,
    FileText,
    Upload,
    Check,
    Loader2,
    ChevronLeft,
    AlertTriangle,
    Clock,
    Calendar,
    ChevronDown,
    Save,
    Edit,
    Trash2,
    AlertCircle,
    MoreVertical,
    RefreshCw,
    ExternalLink,
    Calendar as CalendarIcon,
    X,
    Plus,
    ZoomIn,
    Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    updatePatient,
    getPatientById,
    getDoctors,
    getAppointmentsByPatientId,
    updateAppointment,
    deleteAppointment,
    getDepartments,
    getPatientGroups,
    getClinicSettings,
    uploadPatientDocument,
    getPatientDocuments,
    deletePatientDocument,
    getDocumentUrl,
    type Doctor,
    type Patient,
    type Appointment,
    type Department,
    type PatientGroup,
    type ClinicSetting,
    type PatientDocument
} from '@/lib/supabase';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";


// Helper: Validations
const validateTCKN = (value: string) => {
    value = value.toString().replace(/\D/g, '');
    if (value.length !== 11) return false;
    if (value[0] === '0') return false;
    const digits = value.split('').map(Number);
    const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
    const evenSum = digits[1] + digits[3] + digits[5] + digits[7];
    const tenthDigit = (((oddSum * 7) - evenSum) % 10 + 10) % 10;
    const eleventhDigit = (digits.slice(0, 10).reduce((a, b) => a + b, 0)) % 10;
    return digits[9] === tenthDigit && digits[10] === eleventhDigit;
};

const formatPhone = (value: string) => {
    if (!value) return '+90 ';
    let raw = value.replace(/\D/g, '');
    if (raw.startsWith('90')) raw = raw.slice(2);
    if (raw.startsWith('0')) raw = raw.slice(1);
    if (raw.length > 10) raw = raw.slice(0, 10);

    if (raw.length === 0) return '+90 ';
    if (raw.length <= 3) return `+90 ${raw}`;
    if (raw.length <= 6) return `+90 ${raw.slice(0, 3)} ${raw.slice(3)}`;
    if (raw.length <= 8) return `+90 ${raw.slice(0, 3)} ${raw.slice(3, 6)} ${raw.slice(6)}`;
    return `+90 ${raw.slice(0, 3)} ${raw.slice(3, 6)} ${raw.slice(6, 8)} ${raw.slice(8)}`;
};

export default function EditPatientPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);

    const [activeTab, setActiveTab] = useState<'info' | 'docs' | 'appointments'>('info');
    const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'success' | 'error'>('loading');
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isDirty, setIsDirty] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [groups, setGroups] = useState<PatientGroup[]>([]);
    const [durationSlot, setDurationSlot] = useState(30);

    // Appointment Modal States
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
    const [editFormData, setEditFormData] = useState<any>({});
    const [originalEditData, setOriginalEditData] = useState<any>(null);
    const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
    const [showAppUnsavedModal, setShowAppUnsavedModal] = useState(false);
    const [patientDocs, setPatientDocs] = useState<PatientDocument[]>([]);
    const [uploadingDoc, setUploadingDoc] = useState<'anamnez' | 'onam' | 'ekbilgiler' | null>(null);
    const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
    const [uploadingFiles, setUploadingFiles] = useState<{ [key: string]: string }>({});
    const [previewDoc, setPreviewDoc] = useState<PatientDocument | null>(null);
    const [isDragging, setIsDragging] = useState<'anamnez' | 'onam' | 'ekbilgiler' | null>(null);

    // Form Data
    const [formData, setFormData] = useState({
        full_name: '',
        identity_no: '',
        phone: '',
        gender: '',
        birth_date: '',
        blood_type: '',
        notes: '',
        doctor_id: '',
        group_id: '',
        created_at: ''
    });

    // Mock Document State
    const [anamnezFile, setAnamnezFile] = useState<File | null>(null);
    const [onamFile, setOnamFile] = useState<File | null>(null);

    // Load Initial Data
    useEffect(() => {
        const loadData = async () => {
            try {
                const [patientData, doctorsData, appointmentsData, departmentsData, groupsData, settingsData, documentsData] = await Promise.all([
                    getPatientById(id),
                    getDoctors(),
                    getAppointmentsByPatientId(id),
                    getDepartments(),
                    getPatientGroups(),
                    getClinicSettings(),
                    getPatientDocuments(id)
                ]);

                if (!patientData) {
                    alert('Hasta bulunamadı!');
                    router.push('/admin/hastalar/liste');
                    return;
                }

                setFormData({
                    full_name: patientData.full_name || '',
                    identity_no: patientData.identity_no || '',
                    phone: formatPhone(patientData.phone || ''),
                    gender: patientData.gender || '',
                    birth_date: patientData.birth_date || '',
                    blood_type: patientData.blood_type || '',
                    notes: patientData.notes || '',
                    doctor_id: patientData.doctor_id || '',
                    group_id: patientData.group_id || '',
                    created_at: patientData.created_at || ''
                });

                setDoctors(doctorsData);
                const mappedApps = appointmentsData.map((app: any) => ({
                    ...app,
                    recorded_by: app.recorded_by // Ensure it's included
                })).sort((a: any, b: any) => {
                    const dateA = new Date(a.created_at || 0).getTime();
                    const dateB = new Date(b.created_at || 0).getTime();
                    return dateB - dateA;
                });
                setAppointments(mappedApps);
                setDepartments(departmentsData);
                setGroups(groupsData);
                setPatientDocs(documentsData);

                const durationSetting = settingsData.find((s: ClinicSetting) => s.key === 'appointment_duration')?.value;
                if (durationSetting) setDurationSlot(parseInt(durationSetting));

                setStatus('idle');
            } catch (error) {
                console.error('Veri yükleme hatası:', error);
                setStatus('error');
            }
        };

        loadData();
    }, [id, router]);

    // Handle Unsaved Changes Warning
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};
        if (!formData.full_name.trim()) newErrors.full_name = 'Ad Soyad zorunludur.';
        if (!formData.phone.trim() || formData.phone.length < 10) newErrors.phone = 'Geçerli bir telefon numarası giriniz.';
        if (!formData.identity_no.trim()) newErrors.identity_no = 'TC Kimlik No zorunludur.';
        else if (formData.identity_no.length !== 11) newErrors.identity_no = 'GEÇERSİZ TC KİMLİK NO';
        else if (!validateTCKN(formData.identity_no)) newErrors.identity_no = 'GEÇERSİZ TC KİMLİK NO';
        if (formData.birth_date) {
            const birthYear = parseInt(formData.birth_date.split('-')[0]);
            const currentYear = new Date().getFullYear();
            if (birthYear < 1900 || birthYear > currentYear) {
                newErrors.birth_date = 'Geçerli bir doğum tarihi giriniz (1900 - Bugün arası).';
            }
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setIsDirty(true);

        if (id === 'full_name') {
            // Rakam içermemeli, sadece harf ve boşluk (Türkçe karakterler dahil)
            if (/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]*$/.test(value) && value.length <= 50) {
                setFormData(prev => ({ ...prev, [id]: value }));
            }
        } else if (id === 'phone') {
            if (value.length < 4) {
                setFormData(prev => ({ ...prev, [id]: '+90 ' }));
            } else {
                const formatted = formatPhone(value);
                setFormData(prev => ({ ...prev, [id]: formatted }));
            }
        } else if (id === 'identity_no') {
            if (/^\d*$/.test(value) && value.length <= 11) {
                setFormData(prev => ({ ...prev, [id]: value }));
            }
        } else {
            setFormData(prev => ({ ...prev, [id]: value }));
        }

        // Clear errors on change
        if (errors[id]) {
            setErrors(prev => {
                const newErr = { ...prev };
                delete newErr[id];
                return newErr;
            });
        }
    };

    const handleRefreshAppointments = async () => {
        setIsRefreshing(true);
        try {
            const data = await getAppointmentsByPatientId(id);
            const mappedApps = data.map((app: any) => ({
                ...app,
                recorded_by: app.recorded_by
            })).sort((a: any, b: any) => {
                const dateA = new Date(a.created_at || 0).getTime();
                const dateB = new Date(b.created_at || 0).getTime();
                return dateB - dateA;
            });
            setAppointments(mappedApps);
        } catch (error) {
            console.error('Randevular yenilenirken hata:', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleEditClick = (app: any) => {
        setSelectedAppointment(app);
        const initialData = {
            ...app,
            name: app.patients?.full_name || formData.full_name,
            identityNo: app.patients?.identity_no || formData.identity_no,
            phone: app.patients?.phone || formData.phone,
            date: app.appointment_date,
            time: app.appointment_time?.slice(0, 5) || '',
            department_id: app.department_id,
            doctor_id: app.doctor_id,
            process: app.procedures?.name || (app.notes?.includes('İşlem:') ? app.notes.split('İşlem: ')[1].split('.')[0] : '')
        };
        setEditFormData(initialData);
        setOriginalEditData(initialData);
        setIsEditModalOpen(true);
    };

    const handleDeleteClick = (app: any) => {
        setSelectedAppointment(app);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!selectedAppointment) return;
        try {
            await deleteAppointment(selectedAppointment.id);
            await handleRefreshAppointments();
            setIsDeleteModalOpen(false);
            setSelectedAppointment(null);
        } catch (error) {
            console.error('Silme hatası:', error);
        }
    };

    const handleUpdate = async () => {
        try {
            // Ensure time is in HH:mm:ss format for DB
            let formattedTime = editFormData.time;
            if (formattedTime && formattedTime.length === 5) {
                formattedTime = `${formattedTime}:00`;
            }

            const updates = {
                status: editFormData.status,
                // Combine process into notes if it exists
                notes: editFormData.process ? `İşlem: ${editFormData.process.trim()}. ${editFormData.notes || ''}`.trim() : editFormData.notes,
                appointment_date: editFormData.date,
                appointment_time: formattedTime,
                priority: editFormData.priority,
                department_id: editFormData.department_id || null,
                doctor_id: editFormData.doctor_id || null
            };

            await updateAppointment(selectedAppointment.id, updates);
            await handleRefreshAppointments();
            setIsEditModalOpen(false);
            setSelectedAppointment(null);
            setShowAppUnsavedModal(false);
        } catch (error: any) {
            console.error('Güncelleme hatası:', error);
            if (error.message?.includes('appointments_doctor_id_appointment_date_appointment_time_key') || error.code === '23505') {
                alert('UYARI: Seçilen tarih ve saatte doktorun başka bir randevusu bulunmaktadır. Lütfen farklı bir zaman dilimi seçiniz.');
            } else {
                alert(`Güncelleme hatası: ${error.message || 'Bir hata oluştu'}`);
            }
        }
    };

    const handleEditFormChange = (e: any) => {
        const { id, value } = e.target;
        setEditFormData((prev: any) => ({ ...prev, [id]: value }));
    };

    const handleCloseEditModal = () => {
        const hasChanges = JSON.stringify(editFormData) !== JSON.stringify(originalEditData);
        if (hasChanges) {
            setShowAppUnsavedModal(true);
        } else {
            setIsEditModalOpen(false);
            setSelectedAppointment(null);
        }
    };

    const updateStatus = async (appointmentId: string, newStatus: string) => {
        try {
            await updateAppointment(appointmentId, { status: newStatus });
            await handleRefreshAppointments();
        } catch (error) {
            console.error('Durum güncelleme hatası:', error);
        }
    };

    const getStatusDotColor = (status: string) => {
        switch (status) {
            case 'Tamamlandı': return 'bg-emerald-500';
            case 'Bekleniyor': return 'bg-amber-500';
            case 'Gelmedi': return 'bg-rose-500';
            case 'İptal': return 'bg-slate-500';
            default: return 'bg-gray-500';
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



    const handleSave = async () => {
        if (!validateForm()) {
            setActiveTab('info');
            return;
        }

        setStatus('saving');
        try {
            await updatePatient(id, {
                full_name: formData.full_name,
                identity_no: formData.identity_no,
                phone: formData.phone,
                gender: formData.gender || 'belirtilmemiş',
                birth_date: formData.birth_date || undefined,
                blood_type: formData.blood_type || undefined,
                notes: formData.notes || undefined,
                doctor_id: formData.doctor_id || undefined,
                group_id: formData.group_id || undefined,
            });

            setIsDirty(false);
            setStatus('success');
            setTimeout(() => {
                router.push('/admin/hastalar/liste');
            }, 1000);
        } catch (error: any) {
            console.error('Güncelleme hatası:', error);
            setStatus('error');
            if (error.message?.includes('duplicate key value') || error.code === '23505') {
                alert('Bu TC Kimlik numarası ile kayıtlı başka bir hasta zaten mevcut.');
            } else {
                alert(`Hata: ${error.message || 'Bir hata oluştu'}`);
            }
        }
    };

    const handleBack = () => {
        if (isDirty) {
            if (window.confirm("Henüz kaydetmediğiniz değişiklikler var. Sayfadan ayrılmak istediğinize emin misiniz?")) {
                router.back();
            }
        } else {
            router.back();
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'anamnez' | 'onam' | 'ekbilgiler') => {
        const file = e.target.files?.[0];
        if (!file) return;
        await handleFileUploadFromFile(file, type);
    };

    const handleDeleteDocument = async (docId: string, path: string) => {
        if (!confirm('Bu dökümanı silmek istediğinize emin misiniz?')) return;

        try {
            await deletePatientDocument(docId, path);
            setPatientDocs(prev => prev.filter(d => d.id !== docId));
        } catch (error) {
            console.error('Silme hatası:', error);
            alert('Döküman silinirken bir hata oluştu.');
        }
    };

    const handleDownloadDocument = async (filePath: string, fileName: string) => {
        try {
            const url = getDocumentUrl(filePath);
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Cleanup
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('İndirme hatası:', error);
            alert('Dosya indirilirken bir hata oluştu.');
        }
    };

    const handleDragOver = (e: React.DragEvent, type: 'anamnez' | 'onam' | 'ekbilgiler') => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(type);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(null);
    };

    const handleDrop = async (e: React.DragEvent, type: 'anamnez' | 'onam' | 'ekbilgiler') => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(null);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            // Dosya yükleme işlemini simüle et
            await handleFileUploadFromFile(file, type);
        }
    };

    const handleFileUploadFromFile = async (file: File, type: 'anamnez' | 'onam' | 'ekbilgiler') => {
        // Boyut kontrolü (10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert('Dosya boyutu 10MB\'dan büyük olamaz.');
            return;
        }

        setUploadingDoc(type);
        setUploadingFiles(prev => ({ ...prev, [type]: file.name }));
        setUploadProgress(prev => ({ ...prev, [type]: 0 }));

        const progressInterval = setInterval(() => {
            setUploadProgress(prev => {
                const current = prev[type] || 0;
                if (current >= 95) return prev;
                return { ...prev, [type]: current + Math.floor(Math.random() * 15) + 5 };
            });
        }, 150);

        try {
            await uploadPatientDocument(file, id, type);
            setUploadProgress(prev => ({ ...prev, [type]: 100 }));

            setTimeout(async () => {
                const updatedDocs = await getPatientDocuments(id);
                setPatientDocs(updatedDocs);
                setUploadingDoc(null);
                setUploadingFiles(prev => {
                    const next = { ...prev };
                    delete next[type];
                    return next;
                });
            }, 500);
        } catch (error: any) {
            console.error('Yükleme hatası:', error);
            const errorMsg = error.message || error.error_description || 'Bilinmeyen bir hata oluştu';
            alert(`Dosya yüklenirken hata oluştu: ${errorMsg}`);
            setUploadingDoc(null);
        } finally {
            clearInterval(progressInterval);
        }
    };

    if (status === 'loading') {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-teal-600" size={40} /></div>;
    }

    return (
        <div className="max-w-7xl mx-auto pb-20 space-y-6">
            <style dangerouslySetInnerHTML={{
                __html: `
                    @keyframes shake {
                        0%, 100% { transform: translateX(0); }
                        25% { transform: translateX(-5px); }
                        75% { transform: translateX(5px); }
                    }
                    .animate-shake {
                        animation: shake 0.2s ease-in-out 3;
                    }
                `
            }} />

            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-6">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleBack}
                        className="h-10 w-10 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                    >
                        <ChevronLeft size={24} />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Hasta Kartı</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Hasta bilgilerini görüntüleyebilir ve düzenleyebilirsiniz.</p>
                    </div>
                </div>
            </div>

            {/* Tabs & Action */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex gap-2 bg-gray-100 dark:bg-slate-900 p-1 rounded-xl w-fit">
                    <button
                        onClick={() => setActiveTab('info')}
                        className={`
                            flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all
                            ${activeTab === 'info'
                                ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}
                        `}
                    >
                        <User size={18} />
                        Hasta Bilgileri
                    </button>
                    <button
                        onClick={() => setActiveTab('appointments')}
                        className={`
                            flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all
                            ${activeTab === 'appointments'
                                ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}
                        `}
                    >
                        <Clock size={18} />
                        Randevular
                    </button>
                    <button
                        onClick={() => setActiveTab('docs')}
                        className={`
                            flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all
                            ${activeTab === 'docs'
                                ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}
                        `}
                    >
                        <FileText size={18} />
                        Dökümanlar
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        onClick={handleBack}
                        className="font-bold px-6 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                    >
                        İptal
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={status === 'saving' || status === 'success' || !formData.full_name || !formData.identity_no || !formData.phone}
                        className={`
                            font-bold px-8 shadow-lg transition-all duration-300
                            ${status === 'success'
                                ? 'bg-green-600 hover:bg-green-700 text-white shadow-green-500/20'
                                : 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-500/20'}
                            disabled:opacity-50 disabled:cursor-not-allowed
                        `}
                    >
                        {status === 'saving' ? (
                            <>
                                <Loader2 size={18} className="mr-2 animate-spin" /> Kaydediliyor...
                            </>
                        ) : status === 'success' ? (
                            <>
                                <Check size={18} className="mr-2" /> Değişiklikler Kaydedildi
                            </>
                        ) : (
                            'Değişiklikleri Kaydet'
                        )}
                    </Button>
                </div>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
                {activeTab === 'info' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Kişisel Bilgiler */}
                        <Card className="border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                            <CardHeader className="border-b border-gray-100 dark:border-slate-800 pb-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-teal-100 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 rounded-lg">
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-bold text-gray-900 dark:text-white">Kişisel Bilgiler</CardTitle>
                                        <CardDescription className="text-xs">Hastanın temel kimlik ve iletişim bilgileri</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4 px-6 pb-4 grid grid-cols-1 md:grid-cols-2 gap-5 flex-1">
                                <div className="space-y-1.5">
                                    <Label htmlFor="full_name" className="text-xs font-bold text-gray-500 uppercase">AD SOYAD <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="full_name"
                                        value={formData.full_name}
                                        onChange={handleInputChange}
                                        maxLength={50}
                                        className={errors.full_name ? "border-red-500 animate-shake" : ""}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="identity_no" className="text-xs font-bold text-gray-500 uppercase">TC KİMLİK NO <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="identity_no"
                                        value={formData.identity_no}
                                        onChange={handleInputChange}
                                        maxLength={11}
                                        className={errors.identity_no ? "border-red-500 animate-shake" : ""}
                                    />
                                    {errors.identity_no && <p className="text-[10px] text-red-500 font-bold mt-1 uppercase tracking-tight">{errors.identity_no}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="phone" className="text-xs font-bold text-gray-500 uppercase">TELEFON <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        className={errors.phone ? "border-red-500 animate-shake" : ""}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="gender" className="text-xs font-bold text-gray-500 uppercase">CİNSİYET</Label>
                                    <select
                                        id="gender"
                                        value={formData.gender}
                                        onChange={handleInputChange}
                                        className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-slate-800 bg-background text-sm outline-none focus:ring-2 focus:ring-teal-500/20"
                                    >
                                        <option value="">Seçiniz</option>
                                        <option value="Erkek">Erkek</option>
                                        <option value="Kadın">Kadın</option>
                                    </select>
                                </div>
                            </CardContent>

                            {/* Metadata Footer */}
                            <div className="px-6 py-3 bg-gray-50/20 dark:bg-slate-900/50 border-t border-gray-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 mt-auto">
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Oluşturulma Tarihi</span>
                                    <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-slate-800 shadow-sm text-xs font-semibold text-gray-600 dark:text-gray-300">
                                        <span>{formData.created_at ? new Date(formData.created_at).toLocaleDateString('tr-TR') : '-'}</span>
                                        <span className="w-px h-3 bg-gray-200 dark:bg-slate-700 mx-1" />
                                        <span>{formData.created_at ? new Date(formData.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '-'}</span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5 items-end">
                                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Düzenleyen</span>
                                    <div className="flex items-center gap-2 bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 px-3 py-1.5 rounded-lg border border-teal-100 dark:border-teal-500/20 text-xs font-bold uppercase tracking-tight shadow-sm">
                                        <span>Sistem</span>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Detay Bilgileri & Notlar */}
                        <Card className="border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                            <CardHeader className="border-b border-gray-100 dark:border-slate-800 pb-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-teal-100 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 rounded-lg">
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-bold text-gray-900 dark:text-white">Ek Bilgiler</CardTitle>
                                        <CardDescription className="text-xs">Medikal detaylar ve özel notlar</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4 px-6 pb-4 space-y-5 flex-1">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="birth_date" className="text-xs font-bold text-gray-500 uppercase">DOĞUM TARİHİ</Label>
                                        <Input
                                            id="birth_date"
                                            type="date"
                                            min="1900-01-01"
                                            max={new Date().toISOString().split('T')[0]} // Bugünün tarihi
                                            value={formData.birth_date}
                                            onChange={handleInputChange}
                                            className="dark:scheme-dark"
                                        />
                                        {errors.birth_date && <p className="text-[10px] text-red-500 font-medium mt-1">{errors.birth_date}</p>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="blood_type" className="text-xs font-bold text-gray-500 uppercase">KAN GRUBU</Label>
                                        <select
                                            id="blood_type"
                                            value={formData.blood_type}
                                            onChange={handleInputChange}
                                            className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-slate-800 bg-background text-sm outline-none focus:ring-2 focus:ring-teal-500/20"
                                        >
                                            <option value="">Seçiniz</option>
                                            <option value="A+">A Rh(+)</option>
                                            <option value="A-">A Rh(-)</option>
                                            <option value="B+">B Rh(+)</option>
                                            <option value="B-">B Rh(-)</option>
                                            <option value="AB+">AB Rh(+)</option>
                                            <option value="AB-">AB Rh(-)</option>
                                            <option value="0+">0 Rh(+)</option>
                                            <option value="0-">0 Rh(-)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="doctor_id" className="text-xs font-bold text-gray-500 uppercase">İLGİLİ DOKTOR</Label>
                                        <select
                                            id="doctor_id"
                                            value={formData.doctor_id}
                                            onChange={handleInputChange}
                                            className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-slate-800 bg-background text-sm outline-none focus:ring-2 focus:ring-teal-500/20"
                                        >
                                            <option value="">Seçiniz</option>
                                            {doctors.map(doc => (
                                                <option key={doc.id} value={doc.id}>{doc.full_name} ({doc.departments?.name || '-'})</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="group_id" className="text-xs font-bold text-gray-500 uppercase">HASTA GRUBU</Label>
                                        <select
                                            id="group_id"
                                            value={formData.group_id}
                                            onChange={handleInputChange}
                                            className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-slate-800 bg-background text-sm outline-none focus:ring-2 focus:ring-teal-500/20"
                                        >
                                            <option value="">Seçiniz</option>
                                            {groups.map(group => (
                                                <option key={group.id} value={group.id}>{group.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="notes" className="text-xs font-bold text-gray-500 uppercase">HASTA NOTLARI</Label>
                                    <textarea
                                        id="notes"
                                        value={formData.notes}
                                        onChange={handleInputChange}
                                        rows={4}
                                        maxLength={1000}
                                        className="w-full p-3 rounded-lg border border-gray-200 dark:border-slate-800 bg-background text-sm outline-none focus:ring-2 focus:ring-teal-500/20 resize-none"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === 'appointments' && (
                    <Card className="border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 dark:border-slate-800/50 pb-3 px-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-teal-100 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 rounded-lg">
                                    <Clock size={20} />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-bold text-gray-900 dark:text-white">Hastanın Randevuları</CardTitle>
                                    <CardDescription className="text-xs">Hastaya ait tüm geçmiş ve gelecek randevular listelenir.</CardDescription>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    onClick={handleRefreshAppointments}
                                    disabled={isRefreshing}
                                    className="h-9 w-9 p-0 rounded-lg border-gray-200 dark:border-slate-700 text-gray-500 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-slate-800 transition-all"
                                >
                                    <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
                                </Button>
                                <Button
                                    onClick={() => router.push(`/admin/randevular/ekle?patientId=${id}`)}
                                    className="bg-teal-600 hover:bg-teal-700 h-9 px-4 text-xs font-bold rounded-lg gap-2 shadow-sm transition-all active:scale-95"
                                >
                                    Yeni Randevu
                                </Button>
                            </div>
                        </CardHeader>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/50 dark:bg-slate-800/30 border-b border-gray-100 dark:border-slate-800 transition-colors text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                        <th className="py-3 px-4">Oluşturma Tarihi</th>
                                        <th className="py-3 px-4">Bölüm</th>
                                        <th className="py-3 px-4">Doktor</th>
                                        <th className="py-3 px-4">Randevu Tarih/Saat</th>
                                        <th className="py-3 px-4 text-center w-[120px]">Oluşturan</th>
                                        <th className="py-3 px-4 text-center w-[120px]">Durum</th>
                                        <th className="py-3 px-4 text-right w-[100px]">İşlem</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50">
                                    {appointments.length > 0 ? (
                                        appointments.map((app) => (
                                            <tr key={app.id} className="hover:bg-teal-500/2 dark:hover:bg-teal-500/4 transition-colors group">
                                                <td className="p-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                                                    {app.created_at ? new Date(app.created_at).toLocaleDateString('tr-TR') : '-'}
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{app.departments?.name || '-'}</span>
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                                        {app.doctors ? `${app.doctors.title || ''} ${app.doctors.full_name}`.trim() : '-'}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-1.5 text-sm font-bold text-gray-900 dark:text-white">
                                                        <CalendarIcon size={14} className="text-teal-500" />
                                                        {formatDateTR(app.appointment_date)}
                                                        <span className="text-gray-300 mx-1">|</span>
                                                        <Clock size={14} className="text-teal-500" />
                                                        {app.appointment_time?.slice(0, 5)}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <div className={`
                                                        inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] font-bold uppercase tracking-tight
                                                        ${(app.recorded_by === 'Kullanıcı')
                                                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20'
                                                            : 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-500/20'
                                                        }
                                                    `}>
                                                        {app.recorded_by || 'Sistem'}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <DropdownMenu modal={false}>
                                                        <DropdownMenuTrigger asChild>
                                                            <button
                                                                className={`
                                                                    w-full px-2.5 py-1.5 rounded-lg text-[11px] font-bold border cursor-pointer select-none transition-all active:scale-95 flex items-center justify-between gap-2 outline-none
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
                                                                    onClick={() => updateStatus(app.id!, status)}
                                                                    className="text-xs font-bold gap-2 cursor-pointer"
                                                                >
                                                                    <div className={`w-1.5 h-1.5 rounded-full ${getStatusDotColor(status)}`} />
                                                                    {status}
                                                                </DropdownMenuItem>
                                                            ))}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </td>
                                                <td className="p-4 text-right">
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
                                            <td colSpan={6} className="p-12 text-center">
                                                <div className="flex flex-col items-center gap-3 text-gray-400">
                                                    <CalendarIcon size={40} className="opacity-20" />
                                                    <p className="text-sm">Bu hastaya ait henüz bir randevu kaydı bulunmamaktadır.</p>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => router.push(`/admin/randevular/ekle?patientId=${id}`)}
                                                        className="mt-2 text-xs font-bold border-teal-200 text-teal-600 hover:bg-teal-50 rounded-lg"
                                                    >
                                                        İlk Randevuyu Oluştur
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}

                {activeTab === 'docs' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <Card className="border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
                            <CardHeader className="border-b border-gray-100 dark:border-slate-800 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-teal-100 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 rounded-lg">
                                        <Upload size={20} />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-bold text-gray-900 dark:text-white">Döküman Yükleme</CardTitle>
                                        <CardDescription className="text-xs">Hastaya ait form ve belgeleri yükleyin</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {/* Anamnez Formu Area */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">ANAMNEZ FORMU</Label>
                                        </div>

                                        <div
                                            className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all group cursor-pointer relative overflow-hidden ${isDragging === 'anamnez'
                                                ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-900/20 scale-[1.02]'
                                                : 'border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800/50'
                                                }`}
                                            onDragOver={(e) => handleDragOver(e, 'anamnez')}
                                            onDragLeave={handleDragLeave}
                                            onDrop={(e) => handleDrop(e, 'anamnez')}
                                        >
                                            <input
                                                type="file"
                                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                                accept=".pdf,.doc,.docx,.jpg,.png"
                                                onChange={(e) => handleFileUpload(e, 'anamnez')}
                                                disabled={!!uploadingDoc}
                                            />
                                            <div className="h-14 w-14 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 mb-4 group-hover:scale-110 group-hover:bg-teal-50 dark:group-hover:bg-teal-900/20 group-hover:text-teal-600 transition-all duration-300">
                                                <Plus size={28} />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                                    {isDragging === 'anamnez' ? 'Dosyayı bırakın' : 'Tıklayın veya sürükleyin'}
                                                </p>
                                                <p className="text-[10px] text-gray-400 font-medium">PDF, DOC, JPG (Maks. 10MB)</p>
                                            </div>
                                        </div>

                                        {/* Yüklenen & Yüklenmekte olan Anamnez Dosyaları */}
                                        <div className="space-y-2">
                                            {/* Uploading State */}
                                            {uploadingDoc === 'anamnez' && (
                                                <div className="p-3 bg-teal-50/50 dark:bg-teal-900/10 rounded-xl border border-teal-100/50 dark:border-teal-500/20 animate-pulse">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="h-8 w-8 rounded-lg bg-teal-500 flex items-center justify-center text-white shrink-0">
                                                            <Loader2 size={16} className="animate-spin" />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-xs font-bold text-teal-700 dark:text-teal-400 truncate">{uploadingFiles['anamnez']}</p>
                                                            <p className="text-[10px] text-teal-600/70 font-bold uppercase tracking-tighter">Yükleniyor... %{uploadProgress['anamnez']}</p>
                                                        </div>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-teal-100 dark:bg-teal-900/30 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-teal-500 transition-all duration-300 ease-out"
                                                            style={{ width: `${uploadProgress['anamnez']}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {patientDocs.filter(d => d.file_type === 'anamnez').map(doc => (
                                                <div key={doc.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-800 hover:shadow-md transition-all group">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className="h-8 w-8 rounded-lg bg-teal-50 dark:bg-teal-950 flex items-center justify-center text-teal-600 shrink-0">
                                                            <FileText size={16} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-bold text-gray-700 dark:text-gray-200 truncate">{doc.file_name}</p>
                                                            <p className="text-[10px] text-gray-400">{(doc.file_size / 1024 / 1024).toFixed(2)} MB • {new Date(doc.created_at).toLocaleDateString('tr-TR')}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-gray-400 hover:text-blue-600" onClick={() => setPreviewDoc(doc)} title="Önizle">
                                                            <ZoomIn size={14} />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-gray-400 hover:text-green-600" onClick={() => handleDownloadDocument(doc.file_path, doc.file_name)} title="İndir">
                                                            <Download size={14} />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-gray-400 hover:text-red-600" onClick={() => handleDeleteDocument(doc.id, doc.file_path)} title="Sil">
                                                            <Trash2 size={14} />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Onam Formu Area */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">ONAM FORMU</Label>
                                        </div>

                                        <div
                                            className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all group cursor-pointer relative overflow-hidden ${isDragging === 'onam'
                                                ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-900/20 scale-[1.02]'
                                                : 'border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800/50'
                                                }`}
                                            onDragOver={(e) => handleDragOver(e, 'onam')}
                                            onDragLeave={handleDragLeave}
                                            onDrop={(e) => handleDrop(e, 'onam')}
                                        >
                                            <input
                                                type="file"
                                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                                accept=".pdf,.doc,.docx,.jpg,.png"
                                                onChange={(e) => handleFileUpload(e, 'onam')}
                                                disabled={!!uploadingDoc}
                                            />
                                            <div className="h-14 w-14 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 mb-4 group-hover:scale-110 group-hover:bg-teal-50 dark:group-hover:bg-teal-900/20 group-hover:text-teal-600 transition-all duration-300">
                                                <Plus size={28} />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                                    {isDragging === 'onam' ? 'Dosyayı bırakın' : 'Tıklayın veya sürükleyin'}
                                                </p>
                                                <p className="text-[10px] text-gray-400 font-medium">PDF, DOC, JPG (Maks. 10MB)</p>
                                            </div>
                                        </div>

                                        {/* Yüklenen & Yüklenmekte Olan Onam Dosyaları */}
                                        <div className="space-y-2">
                                            {/* Uploading State */}
                                            {uploadingDoc === 'onam' && (
                                                <div className="p-3 bg-teal-50/50 dark:bg-teal-900/10 rounded-xl border border-teal-100/50 dark:border-teal-500/20 animate-pulse">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="h-8 w-8 rounded-lg bg-teal-500 flex items-center justify-center text-white shrink-0">
                                                            <Loader2 size={16} className="animate-spin" />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-xs font-bold text-teal-700 dark:text-teal-400 truncate">{uploadingFiles['onam']}</p>
                                                            <p className="text-[10px] text-teal-600/70 font-bold uppercase tracking-tighter">Yükleniyor... %{uploadProgress['onam']}</p>
                                                        </div>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-teal-100 dark:bg-teal-900/30 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-teal-500 transition-all duration-300 ease-out"
                                                            style={{ width: `${uploadProgress['onam']}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {patientDocs.filter(d => d.file_type === 'onam').map(doc => (
                                                <div key={doc.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-800 hover:shadow-md transition-all group">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className="h-8 w-8 rounded-lg bg-teal-50 dark:bg-teal-950 flex items-center justify-center text-teal-600 shrink-0">
                                                            <FileText size={16} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-bold text-gray-700 dark:text-gray-200 truncate">{doc.file_name}</p>
                                                            <p className="text-[10px] text-gray-400">{(doc.file_size / 1024 / 1024).toFixed(2)} MB • {new Date(doc.created_at).toLocaleDateString('tr-TR')}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-gray-400 hover:text-blue-600" onClick={() => setPreviewDoc(doc)} title="Önizle">
                                                            <ZoomIn size={14} />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-gray-400 hover:text-green-600" onClick={() => handleDownloadDocument(doc.file_path, doc.file_name)} title="İndir">
                                                            <Download size={14} />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-gray-400 hover:text-red-600" onClick={() => handleDeleteDocument(doc.id, doc.file_path)} title="Sil">
                                                            <Trash2 size={14} />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Ek Bilgiler Area */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">EK BİLGİLER</Label>
                                        </div>

                                        <div
                                            className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all group cursor-pointer relative overflow-hidden ${isDragging === 'ekbilgiler'
                                                ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-900/20 scale-[1.02]'
                                                : 'border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800/50'
                                                }`}
                                            onDragOver={(e) => handleDragOver(e, 'ekbilgiler')}
                                            onDragLeave={handleDragLeave}
                                            onDrop={(e) => handleDrop(e, 'ekbilgiler')}
                                        >
                                            <input
                                                type="file"
                                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                                accept=".pdf,.doc,.docx,.jpg,.png"
                                                onChange={(e) => handleFileUpload(e, 'ekbilgiler')}
                                                disabled={!!uploadingDoc}
                                            />
                                            <div className="h-14 w-14 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 mb-4 group-hover:scale-110 group-hover:bg-teal-50 dark:group-hover:bg-teal-900/20 group-hover:text-teal-600 transition-all duration-300">
                                                <Plus size={28} />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                                    {isDragging === 'ekbilgiler' ? 'Dosyayı bırakın' : 'Tıklayın veya sürükleyin'}
                                                </p>
                                                <p className="text-[10px] text-gray-400 font-medium">PDF, DOC, JPG (Maks. 10MB)</p>
                                            </div>
                                        </div>

                                        {/* Yüklenen & Yüklenmekte Olan Ek Bilgiler Dosyaları */}
                                        <div className="space-y-2">
                                            {/* Uploading State */}
                                            {uploadingDoc === 'ekbilgiler' && (
                                                <div className="p-3 bg-teal-50/50 dark:bg-teal-900/10 rounded-xl border border-teal-100/50 dark:border-teal-500/20 animate-pulse">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="h-8 w-8 rounded-lg bg-teal-500 flex items-center justify-center text-white shrink-0">
                                                            <Loader2 size={16} className="animate-spin" />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-xs font-bold text-teal-700 dark:text-teal-400 truncate">{uploadingFiles['ekbilgiler']}</p>
                                                            <p className="text-[10px] text-teal-600/70 font-bold uppercase tracking-tighter">Yükleniyor... %{uploadProgress['ekbilgiler']}</p>
                                                        </div>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-teal-100 dark:bg-teal-900/30 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-teal-500 transition-all duration-300 ease-out"
                                                            style={{ width: `${uploadProgress['ekbilgiler']}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {patientDocs.filter(d => d.file_type === 'ekbilgiler').map(doc => (
                                                <div key={doc.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-800 hover:shadow-md transition-all group">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className="h-8 w-8 rounded-lg bg-teal-50 dark:bg-teal-950 flex items-center justify-center text-teal-600 shrink-0">
                                                            <FileText size={16} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-bold text-gray-700 dark:text-gray-200 truncate">{doc.file_name}</p>
                                                            <p className="text-[10px] text-gray-400">{(doc.file_size / 1024 / 1024).toFixed(2)} MB • {new Date(doc.created_at).toLocaleDateString('tr-TR')}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-gray-400 hover:text-blue-600" onClick={() => setPreviewDoc(doc)} title="Önizle">
                                                            <ZoomIn size={14} />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-gray-400 hover:text-green-600" onClick={() => handleDownloadDocument(doc.file_path, doc.file_name)} title="İndir">
                                                            <Download size={14} />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-gray-400 hover:text-red-600" onClick={() => handleDeleteDocument(doc.id, doc.file_path)} title="Sil">
                                                            <Trash2 size={14} />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>

            {/* Unsaved Changes Alerts (Removed in favor of native confirm) */}

            {/* Appointment Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl p-6 max-w-sm w-full space-y-4 border border-gray-100 dark:border-slate-800" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-3 text-red-600">
                            <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                                <AlertCircle size={20} />
                            </div>
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Randevuyu Sil</h3>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            Bu randevuyu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                        </p>
                        <div className="flex items-center justify-end gap-3 pt-2">
                            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} className="h-9 px-4 text-sm font-bold border-gray-200 dark:border-slate-700">
                                Vazgeç
                            </Button>
                            <Button onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white h-9 px-4 text-sm font-bold shadow-lg shadow-red-500/20">
                                Evet, Sil
                            </Button>
                        </div>
                    </div>
                </div>
            )}

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

            {/* Appointment Edit Modal (Popup) */}
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

            {/* File Preview Modal */}
            {previewDoc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setPreviewDoc(null)}>
                    <div className="relative w-full max-w-5xl h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden m-4" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-linear-to-b from-black/60 to-transparent">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/10 backdrop-blur-md rounded-lg">
                                    <FileText size={20} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-white">{previewDoc.file_name}</h3>
                                    <p className="text-xs text-white/70">{(previewDoc.file_size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 rounded-lg bg-white/10 backdrop-blur-md hover:bg-white/20 text-white"
                                    onClick={() => handleDownloadDocument(previewDoc.file_path, previewDoc.file_name)}
                                    title="İndir"
                                >
                                    <Download size={18} />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 rounded-lg bg-white/10 backdrop-blur-md hover:bg-white/20 text-white"
                                    onClick={() => setPreviewDoc(null)}
                                >
                                    <X size={18} />
                                </Button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="w-full h-full flex items-center justify-center p-4">
                            {previewDoc.content_type.startsWith('image/') ? (
                                <img
                                    src={getDocumentUrl(previewDoc.file_path)}
                                    alt={previewDoc.file_name}
                                    className="max-w-full max-h-full object-contain rounded-lg"
                                />
                            ) : previewDoc.content_type === 'application/pdf' ? (
                                <iframe
                                    src={getDocumentUrl(previewDoc.file_path)}
                                    className="w-full h-full rounded-lg border-0"
                                    title={previewDoc.file_name}
                                />
                            ) : (
                                <div className="text-center space-y-4">
                                    <div className="p-6 bg-gray-100 dark:bg-slate-800 rounded-2xl inline-block">
                                        <FileText size={64} className="text-gray-400" />
                                    </div>
                                    <div>
                                        <p className="text-base font-bold text-gray-700 dark:text-gray-300">Önizleme desteklenmiyor</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Dosyayı indirerek görüntüleyebilirsiniz</p>
                                    </div>
                                    <Button
                                        onClick={() => handleDownloadDocument(previewDoc.file_path, previewDoc.file_name)}
                                        className="bg-teal-600 hover:bg-teal-700 text-white gap-2"
                                    >
                                        <Download size={16} />
                                        Dosyayı İndir
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
