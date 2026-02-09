"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const MOCK_DEPARTMENTS = [
    "Genel Cerrahi",
    "Dahiliye",
    "Kardiyoloji",
    "Çocuk Sağlığı ve Hastalıkları",
    "Göz Hastalıkları",
    "Kadın Hastalıkları ve Doğum",
    "Kulak Burun Boğaz",
    "Nöroloji"
]

interface StepDepartmentsProps {
    onSelect: (department: string) => void;
    onNext: () => void;
    onBack: () => void;
    selectedDepartment?: string;
}

export function StepDepartments({ onSelect, onNext, onBack, selectedDepartment }: StepDepartmentsProps) {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-teal-700">Bölüm Seçiniz</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {MOCK_DEPARTMENTS.map((dept) => (
                    <Card
                        key={dept}
                        className={`
              h-32 flex items-center justify-center p-4 cursor-pointer transition-all duration-200 hover:shadow-md
              ${selectedDepartment === dept
                                ? 'bg-teal-600 text-white border-teal-600 shadow-lg scale-[1.02]'
                                : 'bg-white text-gray-800 border-gray-200 hover:border-teal-300'}
            `}
                        onClick={() => onSelect(dept)}
                    >
                        <span className="text-center font-semibold text-lg">{dept}</span>
                    </Card>
                ))}
            </div>

            <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={onBack} className="h-11 px-8 border-teal-600 text-teal-700 hover:bg-teal-50">
                    ← Geri
                </Button>
                <Button
                    disabled={!selectedDepartment}
                    onClick={onNext}
                    className="bg-teal-700 hover:bg-teal-800 text-white font-bold h-11 px-8 rounded-lg"
                >
                    Devam Et →
                </Button>
            </div>
        </div>
    )
}
