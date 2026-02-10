"use client"

import { useState } from "react"
import { PatientSchemaType } from "@/lib/validations"
import { createPatient, updatePatient, createAppointment, getPatientByIdentityNo } from "@/lib/supabase"
import { Info, X, MapPin, Phone, Globe, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

// Steps
import { StepPatientInfo } from "@/components/appointment-steps/StepPatientInfo"
import { StepDepartments } from "@/components/appointment-steps/StepDepartments"
import { StepDoctors } from "@/components/appointment-steps/StepDoctors"
import { StepDateTime } from "@/components/appointment-steps/StepDateTime"
import { StepSummary } from "@/components/appointment-steps/StepSummary"
import { SuccessScreen } from "@/components/appointment-steps/SuccessScreen"
import { AppointmentInquiry } from "@/components/AppointmentInquiry"

interface AppointmentData {
    patient: PatientSchemaType | null;
    departmentId: string;
    departmentName: string;
    doctorId: string;
    doctorName: string;
    dateTime: { date: string; time: string };
}

interface AppointmentClientProps {
    clinicInfo: {
        name: string;
        logo: string;
        phone1: string;
        website: string;
        description: string;
        address: string;
    };
}

export default function AppointmentClient({ clinicInfo }: AppointmentClientProps) {
    const [activeTab, setActiveTab] = useState("new")
    const [currentStep, setCurrentStep] = useState(1)
    const [isSuccess, setIsSuccess] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isInfoOpen, setIsInfoOpen] = useState(false)

    const [formData, setFormData] = useState<AppointmentData>({
        patient: null,
        departmentId: "",
        departmentName: "",
        doctorId: "",
        doctorName: "",
        dateTime: { date: "", time: "" }
    })

    const formatPhone = (phone: string) => {
        if (!phone) return "";
        const clean = phone.replace(/\D/g, "");
        if (clean.length === 11) {
            return `${clean.slice(0, 4)} ${clean.slice(4, 7)} ${clean.slice(7, 9)} ${clean.slice(9, 11)}`;
        }
        return phone;
    }

    const handlePatientSubmit = (data: PatientSchemaType) => {
        setFormData((prev) => ({ ...prev, patient: data }))
        setCurrentStep(2)
    }

    const handleDepartmentSelect = (id: string, name: string) => {
        setFormData((prev) => ({ ...prev, departmentId: id, departmentName: name, doctorId: "", doctorName: "" }))
    }

    const handleDoctorSelect = (id: string, name: string) => {
        setFormData((prev) => ({ ...prev, doctorId: id, doctorName: name }))
    }

    const handleDateTimeSelect = (date: string, time: string) => {
        setFormData((prev) => ({ ...prev, dateTime: { date, time } }))
    }

    const handleFinalConfirm = async () => {
        if (!formData.patient) return;

        setIsSubmitting(true);
        try {
            const rawPhone = formData.patient.phone.replace(/\D/g, '');
            const formattedPhone = `+90 ${rawPhone.slice(0, 3)} ${rawPhone.slice(3, 6)} ${rawPhone.slice(6, 8)} ${rawPhone.slice(8, 10)}`;

            let patientId = "";
            const existingPatient = await getPatientByIdentityNo(formData.patient.tcNumber);

            if (existingPatient) {
                const updatedPatient = await updatePatient(existingPatient.id, {
                    full_name: `${formData.patient.firstName} ${formData.patient.lastName}`,
                    phone: formattedPhone,
                    is_active: true
                });
                patientId = existingPatient.id;
            } else {
                const newPatient = await createPatient({
                    identity_no: formData.patient.tcNumber,
                    full_name: `${formData.patient.firstName} ${formData.patient.lastName}`,
                    phone: formattedPhone,
                    is_active: true
                });
                if (newPatient) patientId = newPatient.id;
            }

            if (!patientId) throw new Error("Hasta kaydı oluşturulamadı.");

            const [day, month, year] = formData.dateTime.date.split('.');
            const isoDate = `${year}-${month}-${day}`;

            await createAppointment({
                patient_id: patientId,
                doctor_id: formData.doctorId,
                department_id: formData.departmentId,
                appointment_date: isoDate,
                appointment_time: formData.dateTime.time,
                status: 'Bekleniyor',
                priority: 'normal',
                recorded_by: 'Kullanıcı'
            });

            setIsSuccess(true);
        } catch (error: any) {
            console.error("Randevu kaydı hatası:", error);
            alert(error.message || "Randevu oluşturulurken bir hata oluştu.");
        } finally {
            setIsSubmitting(false);
        }
    }

    const resetFlow = () => {
        setIsSuccess(false)
        setCurrentStep(1)
        setFormData({
            patient: null,
            departmentId: "",
            departmentName: "",
            doctorId: "",
            doctorName: "",
            dateTime: { date: "", time: "" }
        })
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-teal-50 via-white to-teal-100/50 flex flex-col items-center pt-4 sm:pt-8 pb-12 px-4 sm:px-6">
            <div className="w-full max-w-2xl space-y-4 sm:space-y-6">

                {/* Clinic Header */}
                <div className="relative overflow-hidden bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 group">
                    <div className="absolute top-0 right-0 -mt-2 -mr-2 w-24 h-24 bg-teal-50 rounded-full blur-2xl opacity-40 transition-all group-hover:scale-110" />

                    <div className="relative flex flex-row items-center gap-4 sm:gap-6">
                        {clinicInfo.logo && (
                            <div className="relative shrink-0">
                                <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center w-16 h-16 sm:w-24 sm:h-24 transition-transform group-hover:scale-102">
                                    <img src={clinicInfo.logo} alt={clinicInfo.name} className="max-w-full max-h-full object-contain" />
                                </div>
                                <div className="absolute -top-1.5 -right-1.5 bg-white rounded-full p-0.5 shadow-lg border border-gray-50 flex items-center justify-center z-10 text-blue-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
                                        <path fill="currentColor" fillRule="evenodd" d="M10.586 2.1a2 2 0 0 1 2.7-.116l.128.117L15.314 4H18a2 2 0 0 1 1.994 1.85L20 6v2.686l1.9 1.9a2 2 0 0 1 .116 2.701l-.117.127l-1.9 1.9V18a2 2 0 0 1-1.85 1.995L18 20h-2.685l-1.9 1.9a2 2 0 0 1-2.701.116l-.127-.116l-1.9-1.9H6a2 2 0 0 1-1.995-1.85L4 18v-2.686l-1.9-1.9a2 2 0 0 1-.116-2.701l.116-.127l1.9-1.9V6a2 2 0 0 1 1.85-1.994L6 4h2.686z" opacity=".3" />
                                        <path fill="currentColor" fillRule="evenodd" d="m15.079 8.983l-4.244 4.244l-1.768-1.768a1 1 0 1 0-1.414 1.415l2.404 2.404a1.1 1.1 0 0 0 1.556 0l4.88-4.881a1 1 0 0 0-1.414-1.414" />
                                    </svg>
                                </div>
                            </div>
                        )}
                        <div className="flex flex-col flex-1 min-w-0">
                            <h1 className="text-base sm:text-2xl font-black text-gray-900 tracking-tight leading-tight mb-1 sm:mb-2 flex items-center justify-start gap-1.5">
                                <span className="line-clamp-1">{clinicInfo.name || 'Randevu Sistemi'}</span>
                                <button
                                    onClick={() => setIsInfoOpen(true)}
                                    className="inline-flex items-center justify-center p-1 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-full transition-all shrink-0"
                                >
                                    <Info size={16} />
                                </button>
                            </h1>
                            {clinicInfo.address && (
                                <div className="flex items-center justify-start text-gray-500">
                                    <p className="text-[10px] sm:text-xs font-bold leading-tight sm:leading-relaxed line-clamp-2">{clinicInfo.address}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Clinic Info Modal */}
                {isInfoOpen && (
                    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div
                            className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="relative bg-teal-600 pt-8 pb-6 px-6 overflow-hidden">
                                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
                                <button
                                    onClick={() => setIsInfoOpen(false)}
                                    className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-all z-20"
                                >
                                    <X size={20} />
                                </button>

                                <div className="relative flex items-end gap-4 z-10">
                                    <div className="relative shrink-0">
                                        <div className="p-1 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border-4 border-white dark:border-slate-900 overflow-hidden w-20 h-20 flex items-center justify-center">
                                            {clinicInfo.logo ? (
                                                <img src={clinicInfo.logo} alt={clinicInfo.name} className="max-w-full max-h-full object-contain" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gray-50">
                                                    <Building2 size={32} className="text-teal-600" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="absolute -top-2 -right-2 bg-white rounded-full p-0.5 shadow-lg border-2 border-white dark:border-slate-900 flex items-center justify-center z-10 text-blue-500">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
                                                <path fill="currentColor" fillRule="evenodd" d="M10.586 2.1a2 2 0 0 1 2.7-.116l.128.117L15.314 4H18a2 2 0 0 1 1.994 1.85L20 6v2.686l1.9 1.9a2 2 0 0 1 .116 2.701l-.117.127l-1.9 1.9V18a2 2 0 0 1-1.85 1.995L18 20h-2.685l-1.9 1.9a2 2 0 0 1-2.701.116l-.127-.116l-1.9-1.9H6a2 2 0 0 1-1.995-1.85L4 18v-2.686l-1.9-1.9a2 2 0 0 1-.116-2.701l.116-.127l1.9-1.9V6a2 2 0 0 1 1.85-1.994L6 4h2.686z" opacity=".3" />
                                                <path fill="currentColor" fillRule="evenodd" d="m15.079 8.983l-4.244 4.244l-1.768-1.768a1 1 0 1 0-1.414 1.415l2.404 2.404a1.1 1.1 0 0 0 1.556 0l4.88-4.881a1 1 0 0 0-1.414-1.414" />
                                            </svg>
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-black text-white mb-1 leading-tight drop-shadow-sm">
                                        {clinicInfo.name}
                                    </h3>
                                </div>
                            </div>

                            <div className="px-6 pb-6 pt-4 relative bg-white dark:bg-slate-900">
                                <div className="space-y-4 mt-2">
                                    {clinicInfo.description && (
                                        <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800 text-sm text-gray-600 dark:text-gray-400 leading-relaxed italic">
                                            "{clinicInfo.description}"
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-800/30 border border-gray-100 dark:border-slate-800">
                                            <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm text-teal-600">
                                                <MapPin size={16} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400">Adres</p>
                                                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{clinicInfo.address}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-800/30 border border-gray-100 dark:border-slate-800">
                                            <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm text-teal-600">
                                                <Phone size={16} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400">Telefon</p>
                                                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{formatPhone(clinicInfo.phone1)}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-800/30 border border-gray-100 dark:border-slate-800">
                                            <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm text-teal-600">
                                                <Globe size={16} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400">Web Sitesi</p>
                                                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{clinicInfo.website}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mt-8">
                                    <a
                                        href={`tel:${clinicInfo.phone1}`}
                                        className="flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl h-12 font-bold transition-all active:scale-95 shadow-lg shadow-teal-600/20"
                                    >
                                        <Phone size={18} />
                                        <span>Ara</span>
                                    </a>
                                    <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinicInfo.address + ' ' + clinicInfo.name)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-teal-600 border-2 border-teal-100 rounded-xl h-12 font-bold transition-all active:scale-95 shadow-lg shadow-gray-200/50"
                                    >
                                        <MapPin size={18} />
                                        <span>Yol Tarifi</span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Top Tabs */}
                {!isSuccess && (
                    <div className="flex border-b border-gray-200 w-full mb-8">
                        <button
                            onClick={() => setActiveTab("new")}
                            className={`flex-1 pb-4 text-center text-sm font-semibold transition-colors relative ${activeTab === "new" ? "text-teal-600" : "text-gray-400 hover:text-teal-600/70"
                                }`}
                        >
                            Yeni Randevu
                            {activeTab === "new" && (
                                <span className="absolute -bottom-px left-0 w-full h-[3px] bg-teal-600 rounded-t-full" />
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab("check")}
                            className={`flex-1 pb-4 text-center text-sm font-semibold transition-colors relative ${activeTab === "check" ? "text-teal-600" : "text-gray-400 hover:text-teal-600/70"
                                }`}
                        >
                            Randevu Sorgula
                            {activeTab === "check" && (
                                <span className="absolute -bottom-px left-0 w-full h-[3px] bg-teal-600 rounded-t-full" />
                            )}
                        </button>
                    </div>
                )}

                {/* Content Area */}
                {activeTab === "new" ? (
                    isSuccess ? (
                        <SuccessScreen onReset={resetFlow} />
                    ) : (
                        <Card className="border-gray-200 shadow-sm overflow-hidden min-h-[400px] bg-white">
                            <div className="h-1.5 w-full bg-gray-100 dark:bg-slate-800 border-none shadow-none">
                                <div
                                    className="h-full bg-linear-to-r from-teal-400 to-teal-600 rounded-full transition-all duration-1000 ease-out shadow-lg shadow-teal-500/20 relative"
                                    style={{ width: `${(currentStep / 5) * 100}%` }}
                                >
                                    <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-size-[20px_20px] animate-shimmer opacity-20" />
                                </div>
                            </div>

                            <CardContent className="p-6 sm:p-8 space-y-8">
                                <div className="transition-all duration-300">
                                    {currentStep === 1 && (
                                        <StepPatientInfo
                                            onComplete={handlePatientSubmit}
                                            initialData={formData.patient ?? undefined}
                                        />
                                    )}
                                    {currentStep === 2 && (
                                        <StepDepartments
                                            onSelect={handleDepartmentSelect}
                                            onNext={() => setCurrentStep(3)}
                                            onBack={() => setCurrentStep(1)}
                                            selectedDepartmentId={formData.departmentId}
                                        />
                                    )}
                                    {currentStep === 3 && (
                                        <StepDoctors
                                            departmentId={formData.departmentId}
                                            departmentName={formData.departmentName}
                                            onSelect={handleDoctorSelect}
                                            onNext={() => setCurrentStep(4)}
                                            onBack={() => setCurrentStep(2)}
                                            selectedDoctorId={formData.doctorId}
                                        />
                                    )}
                                    {currentStep === 4 && (
                                        <StepDateTime
                                            doctorId={formData.doctorId}
                                            onSelect={(date, time) => {
                                                handleDateTimeSelect(date, time)
                                                setCurrentStep(5)
                                            }}
                                            onBack={() => setCurrentStep(3)}
                                            selectedDate={formData.dateTime.date}
                                            selectedTime={formData.dateTime.time}
                                        />
                                    )}
                                    {currentStep === 5 && (
                                        <StepSummary
                                            data={{
                                                ...formData,
                                                department: formData.departmentName,
                                                doctor: formData.doctorName
                                            }}
                                            onConfirm={handleFinalConfirm}
                                            onBack={() => setCurrentStep(4)}
                                            isSubmitting={isSubmitting}
                                        />
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )
                ) : (
                    <AppointmentInquiry />
                )}

            </div>

            <footer className="mt-12 text-center opacity-40 hover:opacity-100 transition-opacity duration-300">
                <p className="text-[10px] font-bold text-teal-900 uppercase tracking-widest">
                    © 2026 Tüm Hakları Saklıdır
                    <span className="mx-2">•</span>
                    <a href="https://klinikpanel.com" target="_blank" rel="noopener noreferrer" className="hover:text-teal-600 transition-colors">
                        KlinikPanel.com
                    </a>
                </p>
            </footer>
        </div>
    )
}
