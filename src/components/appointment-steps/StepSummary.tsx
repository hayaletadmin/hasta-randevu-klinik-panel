"use client"

import { Button } from "@/components/ui/button"
import { PatientSchemaType } from "@/lib/validations";

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
}

export function StepSummary({ data, onConfirm, onBack }: StepSummaryProps) {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-teal-700">Randevu Özeti</h2>

            <div className="bg-white rounded-xl p-8 border border-gray-100 shadow-sm space-y-8">
                <div className="space-y-2">
                    <span className="text-sm font-medium text-gray-400">Hasta Bilgileri:</span>
                    <div className="space-y-1">
                        <div className="text-lg font-bold text-gray-900 leading-tight">
                            {data.patient?.firstName} {data.patient?.lastName}
                        </div>
                        <div className="text-base text-gray-600 leading-normal">{data.patient?.tcNumber}</div>
                        <div className="text-base text-gray-600 leading-normal">+90 {data.patient?.phone}</div>
                    </div>
                </div>

                <div className="space-y-2">
                    <span className="text-sm font-medium text-gray-400">Bölüm:</span>
                    <div className="text-lg font-bold text-gray-900 leading-tight">{data.department}</div>
                </div>

                <div className="space-y-2">
                    <span className="text-sm font-medium text-gray-400">Doktor:</span>
                    <div className="text-lg font-bold text-gray-900 leading-tight">{data.doctor}</div>
                </div>

                <div className="space-y-2">
                    <span className="text-sm font-medium text-gray-400">Saat:</span>
                    <div className="text-2xl font-bold text-teal-600 tracking-tight">
                        {data.dateTime.date} - {data.dateTime.time}
                    </div>
                </div>
            </div>

            <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={onBack} className="h-11 px-8 border-teal-600 text-teal-700 hover:bg-teal-50">
                    Geri
                </Button>
                <Button
                    onClick={onConfirm}
                    className="bg-teal-700 hover:bg-teal-800 text-white font-bold h-11 px-8 rounded-lg"
                >
                    Randevuyu Onayla ve Bitir
                </Button>
            </div>
        </div>
    )
}
