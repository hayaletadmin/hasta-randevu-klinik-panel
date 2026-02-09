"use client"

import React, { useState, useEffect, useMemo } from 'react';
import {
    Calendar as CalendarIcon,
    Clock,
    User,
    FileText,
    Save,
    X,
    Stethoscope,
    Phone,
    Mail,
    CreditCard,
    Check,
    Loader2,
    ChevronLeft,
    AlertCircle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    getDepartments,
    getDoctors,
    createAppointment,
    getPatients,
    createPatient,
    getAppointments,
    getClinicSettings,
    getClosures
} from '@/lib/supabase';
import type { Department, Doctor, Patient, WorkHour, Closure } from '@/lib/supabase';

export default function CreateAppointmentPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState('idle');
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [shakingFields, setShakingFields] = useState<string[]>([]);

    // Dirty State Check
    const [isDirty, setIsDirty] = useState(false);
    const [showExitDialog, setShowExitDialog] = useState(false);

    // Handle Browser Close/Refresh
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

    const handleBack = () => {
        if (isDirty) {
            setShowExitDialog(true);
        } else {
            router.back();
        }
    };

    const confirmExit = () => {
        setShowExitDialog(false);
        router.back();
    };

    // Data States
    const [departments, setDepartments] = useState<Department[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
    const [bookedSlots, setBookedSlots] = useState<{ time: string, count: number }[]>([]);
    const [clinicSettings, setClinicSettings] = useState({ duration: 30, capacity: 1 });
    const [clinicWorkHours, setClinicWorkHours] = useState<WorkHour[]>([]);
    const [closures, setClosures] = useState<Closure[]>([]);

    // Patient Search States
    const [patientSearchTerm, setPatientSearchTerm] = useState('');
    const [patientSearchResults, setPatientSearchResults] = useState<Patient[]>([]);
    const [activeSearchField, setActiveSearchField] = useState<'identityNo' | 'fullName' | null>(null);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [isNewPatient, setIsNewPatient] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        identityNo: '',
        fullName: '',
        phone: '+90 ',
        notes: '',
        date: new Date().toLocaleDateString('en-CA'),
        time: '',
        doctor: '',
        department: '',
        process: '',
        gender: '',
        priority: 'normal' as 'normal' | 'acil' | 'vip' | 'engelli'
    });

    // Initialize from URL params
    useEffect(() => {
        const dateParam = searchParams.get('date');
        const timeParam = searchParams.get('time');
        const patientIdParam = searchParams.get('patientId');
        const doctorIdParam = searchParams.get('doctorId');
        const departmentIdParam = searchParams.get('departmentId');

        if (dateParam || timeParam || doctorIdParam || departmentIdParam) {
            setFormData(prev => ({
                ...prev,
                date: dateParam || prev.date,
                time: timeParam || prev.time,
                doctor: doctorIdParam || prev.doctor,
                department: departmentIdParam || prev.department
            }));
        }

        if (patientIdParam) {
            const fetchPatient = async () => {
                try {
                    const { getPatientById } = await import('@/lib/supabase');
                    const patient = await getPatientById(patientIdParam);
                    if (patient) {
                        setSelectedPatient(patient);
                        setFormData(prev => ({
                            ...prev,
                            identityNo: patient.identity_no || '',
                            fullName: patient.full_name || '',
                            phone: patient.phone || '+90 ',
                            gender: patient.gender || ''
                        }));
                    }
                } catch (error) {
                    console.error('Linkten gelen hasta yüklenemedi:', error);
                }
            };
            fetchPatient();
        }
    }, [searchParams]);

    // Helper: TCKN Validation
    const validateTCKN = (value: string) => {
        value = value.toString();
        // 11 hane ve sadece rakam kontrolü
        if (!/^\d{11}$/.test(value)) return false;

        // İlk hane 0 olamaz
        if (value[0] === '0') return false;

        const digits = value.split('').map(Number);

        // 1, 3, 5, 7, 9. haneler (index 0, 2, 4, 6, 8)
        const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
        // 2, 4, 6, 8. haneler (index 1, 3, 5, 7)
        const evenSum = digits[1] + digits[3] + digits[5] + digits[7];

        // 10. hane kontrolü: ((Tekler * 7) - Çiftler) % 10
        const tenthDigit = ((oddSum * 7) - evenSum) % 10;

        // 11. hane kontrolü: İlk 10 hane toplamı % 10
        const eleventhDigit = digits.slice(0, 10).reduce((a, b) => a + b, 0) % 10;

        return digits[9] === tenthDigit && digits[10] === eleventhDigit;
    };

    // Helper: Phone Formatter
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

    // Check Form Validity for Button Disable
    const isFormValid = useMemo(() => {
        const isIdentityValid = formData.identityNo.length === 11 && validateTCKN(formData.identityNo);
        const isFullNameValid = formData.fullName.trim().length > 0;
        const isPhoneValid = formData.phone.replace(/\D/g, '').length >= 10; // +90 + 10 digits usually
        const isDateValid = !!formData.date;
        const isTimeValid = !!formData.time;
        // Department is technically required by the backend logic, so we should check it too to avoid error shakes on click
        const isDepartmentValid = !!formData.department;

        return isIdentityValid && isFullNameValid && isPhoneValid && isDateValid && isTimeValid && isDepartmentValid;
    }, [formData]);

    // Load Initial Data
    useEffect(() => {
        const loadData = async () => {
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

                if (settingsData && settingsData.length > 0) {
                    const duration = settingsData.find((s: any) => s.key === 'appointment_duration')?.value;
                    const capacity = settingsData.find((s: any) => s.key === 'max_appointments_per_slot')?.value;
                    const workHoursStr = settingsData.find((s: any) => s.key === 'clinic_work_hours')?.value;
                    setClinicSettings({
                        duration: duration ? parseInt(duration) : 30,
                        capacity: capacity ? parseInt(capacity) : 1
                    });
                    if (workHoursStr) {
                        try {
                            setClinicWorkHours(JSON.parse(workHoursStr));
                        } catch (e) {
                            console.error('Clinic work hours parse error:', e);
                        }
                    }
                }
            } catch (error) {
                console.error('Veri yüklenme hatası:', error);
            }
        };
        loadData();
    }, []);

    // Filter Doctors by Department
    useEffect(() => {
        if (formData.department) {
            const filtered = doctors.filter(d => d.department_id === formData.department);
            setFilteredDoctors(filtered);

            // Auto-select first doctor if available and current selection is invalid
            if (filtered.length > 0) {
                if (!formData.doctor || !filtered.find(d => d.id === formData.doctor)) {
                    setFormData(prev => ({ ...prev, doctor: filtered[0].id }));
                    setBookedSlots([]);
                }
            } else {
                setFormData(prev => ({ ...prev, doctor: '' }));
                setBookedSlots([]);
            }
        } else {
            // If no department, show no doctors (empty placeholder)
            setFilteredDoctors([]);
            setBookedSlots([]);
        }
    }, [formData.department, doctors]);

    // Fetch Booked Slots
    useEffect(() => {
        const fetchBookedSlots = async () => {
            if (formData.doctor && formData.date) {
                try {
                    const allApps = await getAppointments();

                    const slotsWithCounts = allApps
                        .filter(app =>
                            app.doctor_id === formData.doctor &&
                            app.appointment_date === formData.date &&
                            app.status !== 'İptal'
                        )
                        .reduce((acc: { [key: string]: number }, app) => {
                            const time = app.appointment_time.slice(0, 5);
                            acc[time] = (acc[time] || 0) + 1;
                            return acc;
                        }, {});

                    const booked = Object.entries(slotsWithCounts).map(([time, count]) => ({
                        time,
                        count: count as number
                    }));

                    setBookedSlots(booked);
                } catch (error) {
                    console.error('Error fetching slots:', error);
                }
            } else {
                setBookedSlots([]);
            }
        };
        fetchBookedSlots();
    }, [formData.doctor, formData.date]);

    // Patient Search
    useEffect(() => {
        const delaySearch = setTimeout(async () => {
            if (activeSearchField && patientSearchTerm.length >= 1 && !selectedPatient) {
                try {
                    const results = await getPatients(patientSearchTerm);
                    setPatientSearchResults(results || []);
                } catch (error) {
                    console.error('Hasta arama hatası:', error);
                }
            } else {
                setPatientSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(delaySearch);
    }, [patientSearchTerm, selectedPatient, activeSearchField]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        setIsDirty(true);

        // Reset selected patient if user changes critical fields
        if (selectedPatient && (id === 'identityNo' || id === 'fullName' || id === 'phone')) {
            setSelectedPatient(null);
        }

        if (id === 'identityNo') {
            if (/^\d*$/.test(value) && value.length <= 11) {
                setFormData(prev => ({ ...prev, [id]: value }));
                setPatientSearchTerm(value);
                setActiveSearchField('identityNo');

                // 11 haneye ulaşıldığında otomatik kontrol et
                if (value.length === 11) {
                    if (!validateTCKN(value)) {
                        setErrors(prev => ({ ...prev, identityNo: 'Geçersiz TC Kimlik No' }));
                    } else {
                        setErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.identityNo;
                            return newErrors;
                        });
                    }
                } else {
                    // Yazarken hatayı temizle
                    if (errors.identityNo) {
                        setErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.identityNo;
                            return newErrors;
                        });
                    }
                }
            }
        } else if (id === 'phone') {
            if (value.length < 4) return;
            const formatted = formatPhone(value);
            setFormData(prev => ({ ...prev, [id]: formatted }));
            if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
        } else if (id === 'fullName') {
            // Sadece harf ve boşluk kontrolü (Türkçe karakter destekli)
            if (/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]*$/.test(value)) {
                setFormData(prev => ({ ...prev, [id]: value }));
                setPatientSearchTerm(value);
                setActiveSearchField('fullName');

                if (errors.fullName) setErrors(prev => ({ ...prev, fullName: '' }));
            }
        } else if (id === 'date') {
            const selectedDate = new Date(value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (selectedDate < today) {
                setErrors(prev => ({ ...prev, date: 'Geçmiş bir tarih seçilemez' }));
            } else {
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.date;
                    return newErrors;
                });
            }
            setFormData(prev => ({ ...prev, [id]: value }));
        } else {
            setFormData(prev => ({ ...prev, [id]: value }));
            if (errors[id]) setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.id;
                return newErrors;
            });

            // Reset time if doctor or department changes manually to force re-check
            if (id === 'department' || id === 'doctor') {
                setFormData(prev => ({ ...prev, time: '' }));
            }
        }
    };

    const handleSelectPatient = (patient: Patient) => {
        setIsDirty(true);
        setSelectedPatient(patient);
        setFormData(prev => ({
            ...prev,
            identityNo: patient.identity_no,
            fullName: patient.full_name,
            phone: patient.phone,
            gender: patient.gender || ''
        }));
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.identityNo;
            delete newErrors.fullName;
            delete newErrors.phone;
            return newErrors;
        });
        setActiveSearchField(null);
        setPatientSearchResults([]);
        setIsNewPatient(false);
    };

    const handleClearPatient = () => {
        setIsDirty(true);
        setSelectedPatient(null);
        setFormData(prev => ({
            ...prev,
            identityNo: '',
            fullName: '',
            phone: '+90 ',
            gender: ''
        }));
        setPatientSearchTerm('');
        setActiveSearchField(null);
        setIsNewPatient(true);
    };

    const handleSave = async () => {
        // Validation for past date before saving
        const selectedDate = new Date(formData.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
            alert('Lütfen geçerli bir tarih seçiniz. Geçmişe randevu alınamaz.');
            return;
        }

        const newErrors: { [key: string]: string } = {};

        if (!formData.identityNo || formData.identityNo.length !== 11) newErrors.identityNo = 'Geçerli bir TC Kimlik No giriniz';
        else if (!validateTCKN(formData.identityNo)) newErrors.identityNo = 'Geçersiz TC Kimlik No';

        if (!formData.fullName) newErrors.fullName = 'Ad Soyad zorunludur';
        if (formData.phone.length < 12) newErrors.phone = 'Geçerli bir telefon giriniz';
        if (!formData.date) newErrors.date = 'Tarih seçiniz';
        if (!formData.time) newErrors.time = 'Saat seçiniz';
        else {
            const bookedSlot = bookedSlots.find(s => s.time === formData.time);
            if (bookedSlot && bookedSlot.count >= clinicSettings.capacity) {
                newErrors.time = 'Bu saat doludur. Lütfen başka bir saat seçiniz.';
            }
        }

        if (!formData.department) newErrors.department = 'Bölüm seçiniz';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            const fields = Object.keys(newErrors);
            setShakingFields(fields);

            // Remove shake animation class after it completes
            setTimeout(() => {
                setShakingFields([]);
            }, 600);

            return;
        }

        setStatus('saving');

        try {
            let patientId = selectedPatient?.id;

            if (!patientId) {
                const { getPatientByIdentityNo, updatePatient } = await import('@/lib/supabase');
                const match = await getPatientByIdentityNo(formData.identityNo);

                if (match) {
                    patientId = match.id;
                    // Eğer pasifse tekrar aktifleştir
                    if (!match.is_active) {
                        await updatePatient(patientId, { is_active: true });
                    }
                } else {
                    console.log('Yeni hasta oluşturuluyor...');
                    const newPatient = await createPatient({
                        identity_no: formData.identityNo,
                        full_name: formData.fullName,
                        phone: formData.phone,
                        gender: formData.gender || 'belirtilmemiş',
                        is_active: true
                    });
                    if (newPatient) patientId = newPatient.id;
                    else throw new Error('Hasta oluşturulamadı');
                }
            }

            if (!patientId) throw new Error('Hasta ID bulunamadı');

            console.log('Randevu oluşturuluyor...', { patientId, ...formData });
            await createAppointment({
                patient_id: patientId,
                doctor_id: formData.doctor || undefined,
                department_id: formData.department || undefined,
                appointment_date: formData.date,
                appointment_time: formData.time,
                status: 'Bekleniyor',
                priority: formData.priority,
                notes: `${formData.process ? 'İşlem: ' + formData.process + '. ' : ''}${formData.notes}`
            });

            setStatus('success');
            setIsDirty(false);
            setTimeout(() => {
                router.push('/admin/randevular/liste');
            }, 1000);

        } catch (error: any) {
            console.error('Kaydetme hatası:', error);
            setStatus('error');
            if (error.message?.includes('appointments_doctor_id_appointment_date_appointment_time_key') || error.code === '23505') {
                alert('UYARI: Seçilen tarih ve saatte doktorun başka bir randevusu bulunmaktadır. Lütfen farklı bir zaman dilimi seçiniz.');
            } else {
                alert(`Hata: ${error.message || JSON.stringify(error)}`);
            }
        }
    };

    const getFormattedDate = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    const selectedDoctorName = doctors.find(d => d.id === formData.doctor)?.full_name;

    // Helper to get shake class
    const getShakeClass = (fieldName: string) => {
        return shakingFields.includes(fieldName) ? 'animate-shake' : '';
    };

    // Helper to get input classes
    const getInputClass = (fieldName: string, baseClass: string) => {
        const hasError = !!errors[fieldName];
        let classes = `${baseClass} text-base`;
        if (hasError) classes += ' border-red-500 focus:ring-red-500/20';
        return classes;
    };

    // Helper Component for Search Results
    const SearchResultsDropdown = () => {
        if (!activeSearchField || patientSearchResults.length === 0) return null;

        return (
            <div className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-gray-100 dark:border-gray-800 max-h-60 overflow-y-auto">
                {patientSearchResults.map(patient => (
                    <div
                        key={patient.id}
                        onClick={() => handleSelectPatient(patient)}
                        className="p-3 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer border-b border-gray-50 dark:border-gray-800 last:border-0 transition-colors"
                    >
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{patient.full_name}</p>
                        <p className="text-xs text-gray-500">{patient.identity_no} • {patient.phone}</p>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-5 max-w-7xl mx-auto pb-20">


            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                        <button
                            onClick={handleBack}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors cursor-pointer"
                        >
                            Randevular
                        </button>
                        <ChevronLeft size={14} className="rotate-180 text-gray-400" />
                        <span className="text-gray-900 dark:text-gray-200 font-medium">Yeni Randevu</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-teal-50 dark:bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-500">
                            <span className="text-xl leading-none mb-1">+</span>
                        </div>
                        Yeni Randevu Oluştur
                    </h1>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Sol Kolon - Hasta ve Klinik Bilgileri */}
                <div className="lg:col-span-2 space-y-5">
                    {/* Hasta Bilgileri Kartı */}
                    <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden rounded-xl">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-slate-900/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-teal-50 dark:bg-teal-500/10 rounded-full text-teal-600 dark:text-teal-500">
                                    <User size={20} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-900 dark:text-white">Hasta Bilgileri</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Randevu oluşturulacak hastanın kişisel bilgileri</p>
                                </div>
                            </div>
                        </div>
                        <CardContent className="p-6 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5 relative">
                                    <Label htmlFor="identityNo" className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">TC KİMLİK NO</Label>
                                    <div className={`relative group ${getShakeClass('identityNo')}`}>
                                        <Input
                                            id="identityNo"
                                            placeholder="11 haneli TC NO"
                                            value={formData.identityNo}
                                            onChange={handleInputChange}
                                            maxLength={11}
                                            className={getInputClass('identityNo', "h-11 px-3 bg-white dark:bg-slate-950 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-all")}
                                        />
                                        {selectedPatient && (
                                            <div className="absolute right-3 top-3 text-green-500 bg-transparent pl-2">
                                                <Check size={16} />
                                            </div>
                                        )}
                                        {/* TC Sonuçları */}
                                        {activeSearchField === 'identityNo' && <SearchResultsDropdown />}
                                    </div>
                                    {errors.identityNo && <p className="text-[10px] text-red-500 font-medium">{errors.identityNo}</p>}
                                </div>

                                <div className="space-y-1.5 relative">
                                    <Label htmlFor="fullName" className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">AD SOYAD</Label>
                                    <div className={`relative ${getShakeClass('fullName')}`}>
                                        <Input
                                            id="fullName"
                                            placeholder="Hasta Adı Soyadı"
                                            value={formData.fullName}
                                            onChange={handleInputChange}
                                            className={getInputClass('fullName', "h-11 px-3 bg-white dark:bg-slate-950 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-all")}
                                        />
                                        {/* İsim Sonuçları */}
                                        {activeSearchField === 'fullName' && <SearchResultsDropdown />}
                                    </div>
                                    {errors.fullName && <p className="text-[10px] text-red-500 font-medium">{errors.fullName}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="phone" className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">TELEFON</Label>
                                    <div className={`relative ${getShakeClass('phone')}`}>
                                        <Input
                                            id="phone"
                                            placeholder="0555 555 55 55"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            className={getInputClass('phone', "h-11 px-3 bg-white dark:bg-slate-950 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-all")}
                                        />
                                    </div>
                                    {errors.phone && <p className="text-[10px] text-red-500 font-medium">{errors.phone}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="gender" className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">CİNSİYET (OPSİYONEL)</Label>
                                    <select
                                        id="gender"
                                        value={formData.gender}
                                        onChange={handleInputChange}
                                        className="w-full h-11 px-3 rounded-lg bg-white dark:bg-slate-950 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none text-base appearance-none cursor-pointer"
                                    >
                                        <option value="">Seçiniz</option>
                                        <option value="Kadın">Kadın</option>
                                        <option value="Erkek">Erkek</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="notes" className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">NOTLAR / ŞİKAYET</Label>
                                <textarea
                                    id="notes"
                                    rows={3}
                                    maxLength={500}
                                    value={formData.notes}
                                    onChange={handleInputChange}
                                    className="w-full p-4 rounded-lg bg-white dark:bg-slate-950/50 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none text-base transition-all resize-none placeholder:text-gray-400"
                                    placeholder="Hastanın şikayeti veya ek notlar..."
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Klinik Bilgileri Kartı */}
                    <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden rounded-xl">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-slate-900/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-teal-50 dark:bg-teal-500/10 rounded-full text-teal-600 dark:text-teal-500">
                                    <Stethoscope size={20} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-900 dark:text-white">Klinik Bilgileri</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Bölüm ve doktor seçimi</p>
                                </div>
                            </div>
                        </div>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <Label htmlFor="department" className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">BÖLÜM SEÇİMİ</Label>
                                    <div className={getShakeClass('department')}>
                                        <select
                                            id="department"
                                            value={formData.department}
                                            onChange={handleInputChange}
                                            className={getInputClass('department', "w-full h-11 px-3 rounded-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none appearance-none cursor-pointer")}
                                        >
                                            <option value="" className="text-gray-500">Seçiniz</option>
                                            {departments.map(dept => (
                                                <option key={dept.id} value={dept.id}>{dept.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {errors.department && <p className="text-[10px] text-red-500 font-medium">{errors.department}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="doctor" className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">DOKTOR SEÇİMİ</Label>
                                    <select
                                        id="doctor"
                                        value={formData.doctor}
                                        onChange={handleInputChange}
                                        disabled={!formData.department}
                                        className="w-full h-11 px-3 rounded-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none text-base appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <option value="">{filteredDoctors.length === 0 ? 'Bu bölümde doktor bulunmuyor' : 'Seçiniz'}</option>
                                        {filteredDoctors.map(doc => (
                                            <option key={doc.id} value={doc.id}>{doc.title} {doc.full_name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="process" className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">İŞLEM TÜRÜ (OPSİYONEL)</Label>
                                    <Input
                                        id="process"
                                        value={formData.process}
                                        onChange={handleInputChange}
                                        placeholder="Örn: Muayene, Kontrol..."
                                        maxLength={50}
                                        className="h-11 px-3 bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-all text-base"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="priority" className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">ÖNCELİK DURUMU</Label>
                                    <select
                                        id="priority"
                                        value={formData.priority}
                                        onChange={handleInputChange}
                                        className="w-full h-11 px-3 rounded-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none text-base appearance-none cursor-pointer"
                                    >
                                        <option value="normal">Normal</option>
                                        <option value="acil">Acil</option>
                                        <option value="vip">VIP</option>
                                        <option value="engelli">Engelli</option>
                                    </select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sağ Kolon - Tarih, Saat ve Özet Birleşik Kartı */}
                <div className="space-y-5">
                    <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden rounded-xl h-full flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-slate-900/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-teal-50 dark:bg-teal-500/10 rounded-full text-teal-600 dark:text-teal-500">
                                    <CalendarIcon size={20} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-900 dark:text-white">Randevu Zamanlaması</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Tarih, saat ve özet bilgileri</p>
                                </div>
                            </div>
                        </div>
                        <CardContent className="p-6 space-y-6 flex-1">
                            <div className="space-y-1.5">
                                <Label htmlFor="date" className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">RANDEVU TARİHİ</Label>
                                <div className={`relative ${getShakeClass('date')}`}>
                                    <Input
                                        id="date"
                                        type="date"
                                        min={new Date().toLocaleDateString('en-CA')}
                                        value={formData.date}
                                        onChange={handleInputChange}
                                        className={getInputClass('date', `h-11 bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-all dark:scheme-dark`)}
                                    />
                                </div>
                                {errors.date && <p className="text-[10px] text-red-500 font-medium">{errors.date}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">RANDEVU SAATİ</Label>
                                <div className={`grid grid-cols-3 gap-2 p-1 rounded-xl transition-all ${errors.time ? 'bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30' : ''} ${getShakeClass('time')}`}>
                                    {(() => {
                                        const slots = [];

                                        // Seçilen tarihin gününü bul (0=Pazar, 1=Pazartesi...)
                                        const selectedDate = new Date(formData.date);
                                        const dayOfWeek = selectedDate.getDay(); // 0-6

                                        // Seçilen doktorun çalışma saatlerini al
                                        const selectedDoctor = doctors.find(d => d.id === formData.doctor);
                                        const doctorWorkHour = selectedDoctor?.work_hours?.find(h => h.day === dayOfWeek);
                                        const clinicWorkHour = clinicWorkHours.find(h => h.day === dayOfWeek);

                                        // Klinik veya doktor kapalı mı?
                                        const isClinicClosed = clinicWorkHour ? !clinicWorkHour.isOpen : false;
                                        const isDoctorClosed = doctorWorkHour ? !doctorWorkHour.isOpen : false;
                                        const isDayClosed = isClinicClosed || isDoctorClosed;

                                        // Çalışma saatlerini belirle
                                        let workStart = 9 * 60; // Varsayılan 09:00
                                        let workEnd = 17 * 60; // Varsayılan 17:00

                                        if (doctorWorkHour && doctorWorkHour.isOpen) {
                                            const [startH, startM] = doctorWorkHour.start.split(':').map(Number);
                                            const [endH, endM] = doctorWorkHour.end.split(':').map(Number);
                                            workStart = startH * 60 + startM;
                                            workEnd = endH * 60 + endM;
                                        } else if (clinicWorkHour && clinicWorkHour.isOpen) {
                                            const [startH, startM] = clinicWorkHour.start.split(':').map(Number);
                                            const [endH, endM] = clinicWorkHour.end.split(':').map(Number);
                                            workStart = startH * 60 + startM;
                                            workEnd = endH * 60 + endM;
                                        }

                                        // Öğle arası saatlerini belirle (Sadece klinik)
                                        let hasLunchBreak = false;
                                        let lunchStart = 12 * 60;
                                        let lunchEnd = 13 * 60 + 30; // 13:30

                                        if (clinicWorkHour && clinicWorkHour.isOpen) {
                                            hasLunchBreak = clinicWorkHour.hasLunchBreak ?? false;
                                            if (clinicWorkHour.lunchStart && clinicWorkHour.lunchEnd) {
                                                const [lsH, lsM] = clinicWorkHour.lunchStart.split(':').map(Number);
                                                const [leH, leM] = clinicWorkHour.lunchEnd.split(':').map(Number);
                                                lunchStart = lsH * 60 + lsM;
                                                lunchEnd = leH * 60 + leM;
                                            }
                                        }

                                        for (let time = workStart; time < workEnd; time += clinicSettings.duration) {
                                            // Öğle arası kontrolü (Klinik bazlı)
                                            if (hasLunchBreak && time >= lunchStart && time < lunchEnd) continue;
                                            // Slotun bitiş saati öğle arasına denk geliyor mu? (İsteğe bağlı, şimdilik sadece başlangıç yeterli)

                                            const hours = Math.floor(time / 60);
                                            const minutes = time % 60;
                                            const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

                                            const bookedInfo = bookedSlots.find(s => s.time === timeStr);
                                            const isFull = (bookedInfo?.count || 0) >= clinicSettings.capacity;

                                            // Geçmiş saat kontrolü
                                            const now = new Date();
                                            const todayStr = now.toISOString().split('T')[0];
                                            const isPast = formData.date === todayStr && timeStr < `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

                                            const isDisabledByClosure = closures.some(c => {
                                                if (c.closure_date !== formData.date) return false;

                                                // Hedef kontrolü
                                                if (c.target_type === 'doctor' && c.doctor_id !== formData.doctor) return false;

                                                // Zaman kontrolü
                                                if (!c.start_time || !c.end_time) return true; // Tüm gün kapalı

                                                return timeStr >= c.start_time && timeStr < c.end_time;
                                            });

                                            const isDisabled = isFull || isPast || isDayClosed || isDisabledByClosure;

                                            const closureReason = closures.find(c => {
                                                if (c.closure_date !== formData.date) return false;
                                                if (c.target_type === 'doctor' && c.doctor_id !== formData.doctor) return false;
                                                if (!c.start_time || !c.end_time) return true;
                                                return timeStr >= c.start_time && timeStr < c.end_time;
                                            })?.reason;

                                            slots.push(
                                                <div
                                                    key={timeStr}
                                                    onClick={() => {
                                                        if (isDisabled) return;
                                                        setFormData(prev => ({ ...prev, time: timeStr }));
                                                        if (errors.time) {
                                                            setErrors(prev => {
                                                                const newErrors = { ...prev };
                                                                delete newErrors.time;
                                                                return newErrors;
                                                            });
                                                        }
                                                    }}
                                                    className={`
                                                        py-2.5 text-center rounded-lg text-xs font-bold border transition-all select-none
                                                        ${isDisabled
                                                            ? 'bg-gray-50 dark:bg-slate-800/40 text-gray-400 dark:text-gray-600 border-gray-100 dark:border-slate-800 cursor-not-allowed opacity-50'
                                                            : 'cursor-pointer'}
                                                        ${isDayClosed ? 'line-through' : ''}
                                                        ${!isDisabled && formData.time === timeStr
                                                            ? 'bg-teal-600 text-white border-teal-500 shadow-md shadow-teal-500/20'
                                                            : !isDisabled ? 'bg-white dark:bg-slate-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800 hover:border-teal-300 dark:hover:border-teal-700 hover:text-teal-900 dark:hover:text-teal-200' : ''}
                                                    `}
                                                >
                                                    {timeStr}
                                                    {isDayClosed || isDisabledByClosure ? (
                                                        <span className="block text-[8px] text-red-500 mt-0.5" title={closureReason || ''}>Kapalı</span>
                                                    ) : isPast ? (
                                                        <span className="block text-[8px] opacity-70 mt-0.5 italic">Geçti</span>
                                                    ) : clinicSettings.capacity > 1 && !isFull && (
                                                        <span className="block text-[8px] opacity-70 mt-0.5">
                                                            {clinicSettings.capacity - (bookedInfo?.count || 0)} yer boş
                                                        </span>
                                                    )}
                                                    {isFull && !isPast && !isDayClosed && (
                                                        <span className="block text-[8px] text-red-500 mt-0.5">Dolu</span>
                                                    )}
                                                </div>
                                            );
                                        }

                                        // Eğer gün kapalıysa veya hiç slot yoksa mesaj göster
                                        if (isDayClosed && slots.length === 0) {
                                            return <div className="col-span-3 text-center py-4 text-gray-500 dark:text-gray-400 text-sm">Bu gün için randevu alınamaz (Kapalı)</div>;
                                        }

                                        return slots;
                                    })()}
                                </div>
                                {errors.time && <p className="text-[10px] text-red-500 font-medium">{errors.time}</p>}
                            </div>

                            <div className="border-t border-gray-100 dark:border-gray-800 pt-6 mt-2">
                                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-8">Randevu Özeti</h4>
                                <div className="space-y-3 bg-gray-50 dark:bg-slate-900/50 rounded-xl p-4 border border-gray-100 dark:border-gray-800 mb-8">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500 dark:text-gray-400">Tarih:</span>
                                        <span className="text-gray-900 dark:text-white font-bold">{formData.date ? getFormattedDate(formData.date) : '-'}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500 dark:text-gray-400">Saat:</span>
                                        <span className="text-gray-900 dark:text-white font-bold">{formData.time || '-'}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500 dark:text-gray-400">Doktor:</span>
                                        <span className="text-gray-900 dark:text-white font-bold text-right max-w-[60%] truncate">{selectedDoctorName || '-'}</span>
                                    </div>
                                </div>

                                <Button
                                    onClick={handleSave}
                                    disabled={status === 'saving' || !isFormValid}
                                    className="w-full h-11 bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-lg shadow-teal-500/20 font-bold text-base transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                                >
                                    {status === 'saving' ? (
                                        <>
                                            <Loader2 size={20} className="animate-spin" />
                                            Kaydediliyor...
                                        </>
                                    ) : status === 'success' ? (
                                        <>
                                            <Check size={20} />
                                            Kaydedildi!
                                        </>
                                    ) : (
                                        <>
                                            <Save size={20} />
                                            Randevuyu Kaydet
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
            {/* Exit Confirmation Dialog */}
            {showExitDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <Card className="w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl border-0">
                        <CardContent className="p-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Kaydedilmemiş Değişiklikler</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6">
                                Yaptığınız değişiklikler kaydedilmedi. Çıkmak istediğinize emin misiniz?
                            </p>
                            <div className="flex justify-end gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowExitDialog(false)}
                                    className="font-medium"
                                >
                                    İptal Et
                                </Button>
                                <Button
                                    onClick={confirmExit}
                                    className="font-bold bg-red-600 hover:bg-red-700 text-white"
                                >
                                    Kaydetmeden Çık
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
