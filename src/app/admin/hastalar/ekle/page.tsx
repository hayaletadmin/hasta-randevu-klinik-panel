"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    User,
    FileText,
    Upload,
    Save,
    Check,
    Loader2,
    ChevronLeft
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createPatient, getDoctors, getPatientGroups, type Doctor, type PatientGroup } from '@/lib/supabase';

export default function AddPatientPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'info' | 'docs'>('info');
    const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [groups, setGroups] = useState<PatientGroup[]>([]);

    // Dirty State Check
    const [isDirty, setIsDirty] = useState(false);
    const [showExitDialog, setShowExitDialog] = useState(false);

    // Handle Browser Close/Refresh
    React.useEffect(() => {
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

    // Load Data
    React.useEffect(() => {
        const loadInitialData = async () => {
            const [doctorsData, groupsData] = await Promise.all([
                getDoctors(),
                getPatientGroups()
            ]);
            setDoctors(doctorsData);
            setGroups(groupsData);
        };
        loadInitialData();
    }, []);

    // Form Data
    const [formData, setFormData] = useState({
        full_name: '',
        identity_no: '',
        phone: '+90 ',
        gender: '',
        birth_date: '',
        blood_type: '',
        notes: '',
        doctor_id: '',
        group_id: ''
    });

    // Mock Document State (Visual Only for now)
    const [anamnezFile, setAnamnezFile] = useState<File | null>(null);
    const [onamFile, setOnamFile] = useState<File | null>(null);

    // Helper: TCKN Validation
    const validateTCKN = (value: string) => {
        value = value.toString();
        if (!/^\d{11}$/.test(value)) return false;
        if (value[0] === '0') return false;

        const digits = value.split('').map(Number);
        const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
        const evenSum = digits[1] + digits[3] + digits[5] + digits[7];
        const tenthDigit = ((oddSum * 7) - evenSum) % 10;
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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setIsDirty(true); // Mark as dirty

        if (id === 'identity_no') {
            if (/^\d*$/.test(value) && value.length <= 11) {
                setFormData(prev => ({ ...prev, [id]: value }));

                if (value.length === 11) {
                    if (!validateTCKN(value)) {
                        setErrors(prev => ({ ...prev, identity_no: 'Geçersiz TC Kimlik No' }));
                    } else {
                        setErrors(prev => {
                            const newErr = { ...prev };
                            delete newErr.identity_no;
                            return newErr;
                        });
                    }
                } else {
                    if (errors.identity_no) {
                        setErrors(prev => {
                            const newErr = { ...prev };
                            delete newErr.identity_no;
                            return newErr;
                        });
                    }
                }
            }
        } else if (id === 'phone') {
            if (value.length < 4) return;
            const formatted = formatPhone(value);
            setFormData(prev => ({ ...prev, [id]: formatted }));
            if (errors.phone) setErrors(prev => {
                const newErr = { ...prev };
                delete newErr.phone;
                return newErr;
            });
        } else if (id === 'full_name') {
            // Letters and spaces only
            if (/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]*$/.test(value)) {
                setFormData(prev => ({ ...prev, [id]: value }));
                if (errors.full_name) setErrors(prev => {
                    const newErr = { ...prev };
                    delete newErr.full_name;
                    return newErr;
                });
            }
        } else {
            setFormData(prev => ({ ...prev, [id]: value }));
            if (errors[id]) {
                setErrors(prev => {
                    const newErr = { ...prev };
                    delete newErr[id];
                    return newErr;
                });
            }
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'anamnez' | 'onam') => {
        if (e.target.files && e.target.files[0]) {
            setIsDirty(true); // Mark as dirty
            if (type === 'anamnez') setAnamnezFile(e.target.files[0]);
            else setOnamFile(e.target.files[0]);
        }
    };

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        if (!formData.full_name.trim()) newErrors.full_name = 'Ad Soyad zorunludur.';
        if (!formData.phone.trim() || formData.phone.length < 10) newErrors.phone = 'Geçerli bir telefon numarası giriniz.';
        if (!formData.identity_no.trim()) newErrors.identity_no = 'TC Kimlik No zorunludur.';
        else if (formData.identity_no.length !== 11) newErrors.identity_no = '11 haneli olmalıdır.';
        else if (!validateTCKN(formData.identity_no)) newErrors.identity_no = 'Geçersiz TC Kimlik No.';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validateForm()) {
            setActiveTab('info'); // Switch back to info tab if errors exist there
            return;
        }

        setStatus('saving');

        try {
            // Save Patient Data
            await createPatient({
                full_name: formData.full_name,
                identity_no: formData.identity_no,
                phone: formData.phone,
                gender: formData.gender || 'belirtilmemiş',
                birth_date: formData.birth_date || undefined,
                blood_type: formData.blood_type || undefined,
                notes: formData.notes || undefined,
                doctor_id: formData.doctor_id || undefined,
                group_id: formData.group_id || undefined,
                is_active: true
            });

            // Note: Document upload logic would go here in a real implementation

            setIsDirty(false); // Reset dirty state
            setStatus('success');
            setTimeout(() => {
                router.push('/admin/hastalar/liste'); // Redirect to list
            }, 1500);

        } catch (error: any) {
            console.error('Kayıt hatası:', error);
            setStatus('error');

            if (error.message?.includes('duplicate key value') || error.code === '23505') {
                alert('Bu TC Kimlik numarası ile kayıtlı bir hasta zaten mevcut. Lütfen kontrol ediniz.');
            } else {
                alert(`Hata: ${error.message || 'Bir hata oluştu'}`);
            }
        }
    };

    return (
        <div className="max-w-7xl mx-auto pb-20 space-y-6" suppressHydrationWarning>

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
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Yeni Hasta Ekle</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Yeni bir hasta kaydı oluşturun ve dökümanlarını yükleyin.</p>
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
                            <Check size={18} className="mr-2" /> Hasta Kaydedildi
                        </>
                    ) : (
                        'Kaydet'
                    )}
                </Button>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
                {activeTab === 'info' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Kişisel Bilgiler */}
                        <Card className="border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
                            <CardHeader className="bg-gray-50/50 dark:bg-slate-900/50 border-b border-gray-100 dark:border-slate-800 pb-4">
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
                            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <Label htmlFor="full_name" className="text-xs font-bold text-gray-500 uppercase">AD SOYAD <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="full_name"
                                        value={formData.full_name}
                                        onChange={handleInputChange}
                                        placeholder="Örn: Ahmet Yılmaz"
                                        className={errors.full_name ? "border-red-500 animate-shake" : ""}
                                    />
                                    {errors.full_name && <span className="text-[10px] text-red-500 font-bold">{errors.full_name}</span>}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="identity_no" className="text-xs font-bold text-gray-500 uppercase">TC KİMLİK NO <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="identity_no"
                                        value={formData.identity_no}
                                        onChange={handleInputChange}
                                        placeholder="11 haneli TCKN"
                                        maxLength={11}
                                        className={errors.identity_no ? "border-red-500 animate-shake" : ""}
                                    />
                                    {errors.identity_no && <span className="text-[10px] text-red-500 font-bold">{errors.identity_no}</span>}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="phone" className="text-xs font-bold text-gray-500 uppercase">TELEFON <span className="text-red-500">*</span></Label>
                                    <div className="relative">
                                        <Input
                                            id="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            className={errors.phone ? "border-red-500 animate-shake" : ""}
                                        />
                                    </div>
                                    {errors.phone && <span className="text-[10px] text-red-500 font-bold">{errors.phone}</span>}
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
                        </Card>

                        {/* Detay Bilgileri & Notlar */}
                        <Card className="border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
                            <CardHeader className="bg-gray-50/50 dark:bg-slate-900/50 border-b border-gray-100 dark:border-slate-800 pb-4">
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
                            <CardContent className="p-6 space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="birth_date" className="text-xs font-bold text-gray-500 uppercase">DOĞUM TARİHİ</Label>
                                        <div className="relative">
                                            <Input
                                                id="birth_date"
                                                type="date"
                                                value={formData.birth_date}
                                                onChange={handleInputChange}
                                                className="block dark:scheme-dark"
                                            />
                                        </div>
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
                                        placeholder="Hasta hakkında alınması gereken özel notlar..."
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === 'docs' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <Card className="border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
                            <CardHeader className="bg-gray-50/50 dark:bg-slate-900/50 border-b border-gray-100 dark:border-slate-800 pb-4">
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
                            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Anamnez Formu Area */}
                                <div className="space-y-3">
                                    <Label className="text-xs font-bold text-gray-900 dark:text-white">ANAMNEZ FORMU</Label>
                                    <div className="border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer relative">
                                        <input
                                            type="file"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={(e) => handleFileChange(e, 'anamnez')}
                                            accept=".pdf,.doc,.docx,.jpg,.png"
                                        />
                                        <div className="h-12 w-12 bg-teal-50 dark:bg-teal-900/20 rounded-full flex items-center justify-center text-teal-600 dark:text-teal-400 mb-3 group-hover:scale-110 transition-transform">
                                            <FileText size={24} />
                                        </div>
                                        {anamnezFile ? (
                                            <div className="space-y-1">
                                                <p className="text-sm font-bold text-teal-600 truncate max-w-[200px]">{anamnezFile.name}</p>
                                                <p className="text-xs text-gray-400">{(anamnezFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-1">
                                                <p className="text-sm font-bold text-gray-600 dark:text-gray-300">Dosya Seçin veya Sürükleyin</p>
                                                <p className="text-[10px] text-gray-400">PDF, Word veya Görsel (Max 10MB)</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Onam Formu Area */}
                                <div className="space-y-3">
                                    <Label className="text-xs font-bold text-gray-900 dark:text-white">ONAM FORMU</Label>
                                    <div className="border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer relative">
                                        <input
                                            type="file"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={(e) => handleFileChange(e, 'onam')}
                                            accept=".pdf,.doc,.docx,.jpg,.png"
                                        />
                                        <div className="h-12 w-12 bg-purple-50 dark:bg-purple-900/20 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 mb-3 group-hover:scale-110 transition-transform">
                                            <Check size={24} />
                                        </div>
                                        {onamFile ? (
                                            <div className="space-y-1">
                                                <p className="text-sm font-bold text-teal-600 truncate max-w-[200px]">{onamFile.name}</p>
                                                <p className="text-xs text-gray-400">{(onamFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-1">
                                                <p className="text-sm font-bold text-gray-600 dark:text-gray-300">Dosya Seçin veya Sürükleyin</p>
                                                <p className="text-[10px] text-gray-400">PDF, Word veya Görsel (Max 10MB)</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>

            {/* Exit Confirmation Dialog */}
            {showExitDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <Card className="w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl border-0">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">Kaydedilmemiş Değişiklikler</CardTitle>
                            <CardDescription>
                                Yaptığınız değişiklikler kaydedilmedi. Çıkmak istediğinize emin misiniz?
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex justify-end gap-3 pt-0">
                            <Button
                                variant="outline"
                                onClick={() => setShowExitDialog(false)}
                                className="font-medium"
                            >
                                İptal Et
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={confirmExit}
                                className="font-bold bg-red-600 hover:bg-red-700 text-white"
                            >
                                Kaydetmeden Çık
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}

        </div>
    );
}
