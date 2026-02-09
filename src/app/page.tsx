"use client"

import { useState, useEffect } from "react"
import { PatientSchemaType } from "@/lib/validations"
import { createPatient, updatePatient, createAppointment, getPatientByIdentityNo, getClinicSettings } from "@/lib/supabase"
import { Phone, MapPin, Globe } from "lucide-react"

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

export default function AppointmentPage() {
    const [activeTab, setActiveTab] = useState("new")
    const [currentStep, setCurrentStep] = useState(1)
    const [isSuccess, setIsSuccess] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [formData, setFormData] = useState<AppointmentData>({
        patient: null,
        departmentId: "",
        departmentName: "",
        doctorId: "",
        doctorName: "",
        dateTime: { date: "", time: "" }
    })

    const [clinicInfo, setClinicInfo] = useState({
        name: '',
        logo: '',
        phone1: '',
        website: ''
    })

    const formatPhone = (phone: string) => {
        if (!phone) return "";
        const clean = phone.replace(/\D/g, "");
        if (clean.length === 11) {
            return `${clean.slice(0, 4)} ${clean.slice(4, 7)} ${clean.slice(7, 9)} ${clean.slice(9, 11)}`;
        }
        return phone;
    }

    const getDomainOnly = (url: string) => {
        if (!url) return "";
        try {
            let domain = url.replace(/^(https?:\/\/)?(www\.)?/, '');
            domain = domain.split('/')[0];
            return domain;
        } catch (e) {
            return url;
        }
    }

    useEffect(() => {
        const fetchClinicInfo = async () => {
            try {
                const settings = await getClinicSettings();
                const info = { name: '', logo: '', phone1: '', website: '' };
                settings.forEach(s => {
                    if (s.key === 'clinic_name') info.name = s.value;
                    if (s.key === 'clinic_logo') info.logo = s.value;
                    if (s.key === 'clinic_phone1') info.phone1 = s.value;
                    if (s.key === 'clinic_website') info.website = s.value;
                });
                setClinicInfo(info);
            } catch (error) {
                console.error("Clinic info fetch error:", error);
            }
        };
        fetchClinicInfo();
    }, []);

    // Handlers
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
            // Telefon numarasını +90 formatına dönüştür
            const rawPhone = formData.patient.phone.replace(/\D/g, '');
            const formattedPhone = `+90 ${rawPhone.slice(0, 3)} ${rawPhone.slice(3, 6)} ${rawPhone.slice(6, 8)} ${rawPhone.slice(8, 10)}`;

            let patientId = "";
            const existingPatient = await getPatientByIdentityNo(formData.patient.tcNumber);

            if (existingPatient) {
                // Mevcut hastayı bulduk, bilgilerini güncelleyerek son verileri yansıtıyoruz
                const updatedPatient = await updatePatient(existingPatient.id, {
                    full_name: `${formData.patient.firstName} ${formData.patient.lastName}`,
                    phone: formattedPhone,
                    is_active: true
                });
                if (updatedPatient) {
                    patientId = existingPatient.id;
                } else {
                    patientId = existingPatient.id; // Fallback to existing id if update fails for some reason
                }
            } else {
                // Yeni hasta oluştur
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
        <div className="min-h-screen bg-gray-50 flex flex-col items-center pt-8 pb-12 px-4 sm:px-6">
            <div className="w-full max-w-2xl space-y-8">

                {/* Clinic Header */}
                <div className="relative overflow-hidden bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 group">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-gray-100 rounded-full blur-3xl opacity-50 transition-all group-hover:scale-110" />
                    <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-gray-50 rounded-full blur-2xl opacity-40 transition-all group-hover:scale-110" />

                    <div className="relative flex flex-col sm:flex-row items-center sm:items-center gap-6">
                        {clinicInfo.logo && (
                            <div className="p-4 bg-white rounded-2xl shadow-md border-2 border-gray-200 flex items-center justify-center">
                                <img src={clinicInfo.logo} alt={clinicInfo.name} className="h-20 sm:h-24 w-auto object-contain rounded-lg" />
                            </div>
                        )}
                        <div className="flex flex-col items-center sm:items-start space-y-4">
                            <h1 className="text-xl sm:text-3xl font-bold text-gray-900 tracking-tight leading-tight">
                                {clinicInfo.name || 'Randevu Sistemi'}
                            </h1>
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-sm font-bold">
                                {clinicInfo.phone1 && (
                                    <a
                                        href={`tel:${clinicInfo.phone1}`}
                                        className="flex items-center gap-1.5 bg-gray-100 text-black px-4 py-1.5 rounded-full hover:bg-gray-200 transition-all hover:shadow-sm"
                                    >
                                        <Phone size={14} />
                                        <span>{formatPhone(clinicInfo.phone1)}</span>
                                    </a>
                                )}
                                {clinicInfo.website && (
                                    <a
                                        href={clinicInfo.website.startsWith('http') ? clinicInfo.website : `https://${clinicInfo.website}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 bg-gray-100 text-black px-4 py-1.5 rounded-full hover:bg-gray-200 transition-all hover:shadow-sm"
                                    >
                                        <Globe size={14} />
                                        <span>{getDomainOnly(clinicInfo.website)}</span>
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Top Tabs */}
                {!isSuccess && (
                    <div className="flex border-b border-gray-200 w-full mb-8">
                        <button
                            onClick={() => setActiveTab("new")}
                            className={`flex-1 pb-4 text-center text-sm font-semibold transition-colors relative ${activeTab === "new" ? "text-black" : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            Yeni Randevu
                            {activeTab === "new" && (
                                <span className="absolute -bottom-px left-0 w-full h-[2px] bg-black" />
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab("check")}
                            className={`flex-1 pb-4 text-center text-sm font-semibold transition-colors relative ${activeTab === "check" ? "text-black" : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            Randevu Sorgula
                            {activeTab === "check" && (
                                <span className="absolute -bottom-px left-0 w-full h-[2px] bg-black" />
                            )}
                        </button>
                    </div>
                )}

                {/* Content Area */}
                {activeTab === "new" ? (
                    isSuccess ? (
                        <SuccessScreen onReset={resetFlow} />
                    ) : (
                        <>
                            {/* Stepper */}
                            <div className="flex items-center justify-between px-2 mb-12 relative w-full">
                                <div className="absolute left-0 top-1/2 w-full h-[2px] bg-gray-200 -z-10" />
                                <div
                                    className="absolute left-0 top-1/2 h-[2px] bg-black -z-10 transition-all duration-500"
                                    style={{ width: `${((currentStep - 1) / 4) * 100}%` }}
                                />

                                {[1, 2, 3, 4, 5].map((step) => (
                                    <div
                                        key={step}
                                        className={`
                                w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold z-10 transition-colors duration-300
                                ${step <= currentStep ? 'bg-black text-white shadow-md' : 'bg-gray-200 text-white'}
                                `}
                                    >
                                        {step}
                                    </div>
                                ))}
                            </div>

                            {/* Step Components */}
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
                        </>
                    )
                ) : (
                    <AppointmentInquiry />
                )}

            </div>
        </div>
    )
}
