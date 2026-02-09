"use client"

import { useState } from "react"
import { PatientSchemaType } from "@/lib/validations"

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
    department: string;
    doctor: string;
    dateTime: { date: string; time: string };
}

export default function AppointmentPage() {
    const [activeTab, setActiveTab] = useState("new")
    const [currentStep, setCurrentStep] = useState(1)
    const [isSuccess, setIsSuccess] = useState(false)

    // Form Data State
    const [formData, setFormData] = useState<AppointmentData>({
        patient: null,
        department: "",
        doctor: "",
        dateTime: { date: "", time: "" }
    })

    // Handlers
    const handlePatientSubmit = (data: PatientSchemaType) => {
        setFormData((prev) => ({ ...prev, patient: data }))
        setCurrentStep(2)
    }

    const handleDepartmentSelect = (dept: string) => {
        setFormData((prev) => ({ ...prev, department: dept }))
    }

    const handleDoctorSelect = (doc: string) => {
        setFormData((prev) => ({ ...prev, doctor: doc }))
    }

    const handleDateTimeSelect = (date: string, time: string) => {
        setFormData((prev) => ({ ...prev, dateTime: { date, time } }))
    }

    const handleFinalConfirm = () => {
        setIsSuccess(true)
    }

    const resetFlow = () => {
        setIsSuccess(false)
        setCurrentStep(1)
        setFormData({
            patient: null,
            department: "",
            doctor: "",
            dateTime: { date: "", time: "" }
        })
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center pt-8 pb-12 px-4 sm:px-6">
            <div className="w-full max-w-2xl space-y-8">

                {/* Top Tabs */}
                {!isSuccess && (
                    <div className="flex border-b border-gray-200 w-full mb-8">
                        <button
                            onClick={() => setActiveTab("new")}
                            className={`flex-1 pb-4 text-center text-sm font-semibold transition-colors relative ${activeTab === "new" ? "text-teal-600" : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            Yeni Randevu
                            {activeTab === "new" && (
                                <span className="absolute -bottom-px left-0 w-full h-[2px] bg-teal-600" />
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab("check")}
                            className={`flex-1 pb-4 text-center text-sm font-semibold transition-colors relative ${activeTab === "check" ? "text-teal-600" : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            Randevu Sorgula
                            {activeTab === "check" && (
                                <span className="absolute -bottom-px left-0 w-full h-[2px] bg-teal-600" />
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
                                    className="absolute left-0 top-1/2 h-[2px] bg-teal-600 -z-10 transition-all duration-500"
                                    style={{ width: `${((currentStep - 1) / 4) * 100}%` }}
                                />

                                {[1, 2, 3, 4, 5].map((step) => (
                                    <div
                                        key={step}
                                        className={`
                                w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold z-10 transition-colors duration-300
                                ${step <= currentStep ? 'bg-teal-600 text-white shadow-md' : 'bg-gray-200 text-white'}
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
                                        selectedDepartment={formData.department}
                                    />
                                )}
                                {currentStep === 3 && (
                                    <StepDoctors
                                        department={formData.department}
                                        onSelect={handleDoctorSelect}
                                        onNext={() => setCurrentStep(4)}
                                        onBack={() => setCurrentStep(2)}
                                        selectedDoctor={formData.doctor}
                                    />
                                )}
                                {currentStep === 4 && (
                                    <StepDateTime
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
                                        data={formData}
                                        onConfirm={handleFinalConfirm}
                                        onBack={() => setCurrentStep(4)}
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
