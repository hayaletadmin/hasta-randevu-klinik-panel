"use client"

import { Button } from "@/components/ui/button"
import { PatientSchemaType } from "@/lib/validations";
import { Loader2, User, Calendar, Stethoscope, MapPin, Phone, Hash } from "lucide-react"

interface AppointmentData {
    patient: PatientSchemaType | null;
    department: string;
    doctor: string;
    dateTime: {
        date: string;
        time: string;
    };
}

interface StepSummaryProps {
    data: AppointmentData;
    onConfirm: () => void;
    onBack: () => void;
    isSubmitting?: boolean;
}

export function StepSummary({ data, onConfirm, onBack, isSubmitting = false }: StepSummaryProps) {
    const formatPhone = (phone: string | undefined) => {
        if (!phone) return "";
        let cleaned = phone.replace(/\D/g, '');
        if (cleaned.startsWith('90')) cleaned = cleaned.slice(2);

        const match = cleaned.match(/^(\d{3})(\d{3})(\d{2})(\d{2})$/);
        if (match) {
            return `+90 ${match[1]} ${match[2]} ${match[3]} ${match[4]}`;
        }
        return phone.startsWith('+90') ? phone : `+90 ${phone}`;
    };
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-black text-black tracking-tight">Randevu Özeti</h2>

            <div className="bg-white rounded-2xl border-2 border-black/5 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                {/* Header Section */}
                <div className="bg-black p-6 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <div className="text-[10px] font-bold uppercase tracking-widest opacity-60">Randevu Tarihi / Saati</div>
                            <div className="text-lg font-black leading-none">{data.dateTime.date} - {data.dateTime.time}</div>
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    {/* Patient Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-black opacity-40" />
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Hasta Bilgileri</span>
                            </div>
                            <div className="space-y-2">
                                <div className="text-xl font-black text-black leading-tight">
                                    {data.patient?.firstName} {data.patient?.lastName}
                                </div>
                                <div className="flex flex-col gap-1.5 pt-1">
                                    <div className="flex items-center gap-2 text-sm text-gray-500 font-bold">
                                        <Hash className="w-3.5 h-3.5 opacity-40" />
                                        {data.patient?.tcNumber}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-500 font-bold">
                                        <Phone className="w-3.5 h-3.5 opacity-40" />
                                        {formatPhone(data.patient?.phone)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Clinical Section */}
                        <div className="space-y-6 border-l-0 md:border-l border-gray-100 md:pl-8">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-black opacity-40" />
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Bölüm</span>
                                </div>
                                <div className="text-lg font-bold text-black leading-tight underline decoration-gray-200 decoration-2 underline-offset-4">{data.department}</div>
                            </div>

                            <div className="space-y-4 pt-2">
                                <div className="flex items-center gap-2">
                                    <Stethoscope className="w-4 h-4 text-black opacity-40" />
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Doktor</span>
                                </div>
                                <div className="text-lg font-bold text-black leading-tight underline decoration-gray-200 decoration-2 underline-offset-4">{data.doctor}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center pt-4">
                <Button
                    variant="ghost"
                    onClick={onBack}
                    className="h-12 px-6 text-gray-400 hover:text-black transition-all font-bold text-sm tracking-tighter"
                    disabled={isSubmitting}
                >
                    ← Geri Dön
                </Button>
                <Button
                    onClick={onConfirm}
                    disabled={isSubmitting}
                    className="bg-black hover:bg-gray-800 text-white font-black h-12 px-10 rounded-xl min-w-[240px] transition-all text-sm shadow-xl shadow-black/10 active:scale-95"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            RANDEVU KAYDEDİLİYOR...
                        </>
                    ) : (
                        "RANDEVUYU ONAYLA VE BİTİR →"
                    )}
                </Button>
            </div>
        </div>
    )
}
