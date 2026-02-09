"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

// Mock data - normally filtered by department
const MOCK_DOCTORS = [
    "Uzm. Dr. Fatma Şahin",
    "Op. Dr. Mehmet Demir",
    "Dr. Öğr. Üyesi Ayşe Yılmaz"
]

interface StepDoctorsProps {
    onSelect: (doctor: string) => void;
    onNext: () => void;
    onBack: () => void;
    selectedDoctor?: string;
    department: string;
}

export function StepDoctors({ onSelect, onNext, onBack, selectedDoctor, department }: StepDoctorsProps) {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-teal-700 font-primary">Doktor Seçiniz</h2>
            <p className="text-gray-500 -mt-4">Bölüm: <span className="font-semibold text-gray-700">{department}</span></p>

            <div className="space-y-3">
                {MOCK_DOCTORS.map((doc) => (
                    <Card
                        key={doc}
                        className={`
              p-6 cursor-pointer transition-all duration-200 flex items-center justify-center text-center
              ${selectedDoctor === doc
                                ? 'bg-teal-600 text-white border-teal-600 shadow-md transform scale-[1.01]'
                                : 'bg-white text-gray-800 border-gray-200 hover:border-teal-300 hover:bg-gray-50'}
            `}
                        onClick={() => onSelect(doc)}
                    >
                        <span className="font-bold text-lg">{doc}</span>
                    </Card>
                ))}
            </div>

            <div className="flex justify-between pt-8">
                <Button variant="outline" onClick={onBack} className="h-11 px-8 border-teal-600 text-teal-700 hover:bg-teal-50">
                    ← Geri
                </Button>
                <Button
                    onClick={onNext}
                    disabled={!selectedDoctor}
                    className="bg-teal-700 hover:bg-teal-800 text-white font-bold h-11 px-8 rounded-lg"
                >
                    Devam Et →
                </Button>
            </div>
        </div>
    )
}
