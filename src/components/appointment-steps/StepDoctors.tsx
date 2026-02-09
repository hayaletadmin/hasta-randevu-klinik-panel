"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { getDoctors, type Doctor } from "@/lib/supabase"
import { Loader2 } from "lucide-react"

interface StepDoctorsProps {
    onSelect: (id: string, name: string) => void;
    onNext: () => void;
    onBack: () => void;
    selectedDoctorId?: string;
    departmentId: string;
    departmentName: string;
}

export function StepDoctors({ onSelect, onNext, onBack, selectedDoctorId, departmentId, departmentName }: StepDoctorsProps) {
    const [doctors, setDoctors] = useState<Doctor[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchDocs = async () => {
            if (!departmentId) return;
            const data = await getDoctors()
            // Filter doctors by selected department id
            setDoctors(data.filter(d => d.department_id === departmentId))
            setLoading(false)
        }
        fetchDocs()
    }, [departmentId])

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Doktor Seçiniz</h2>
            <p className="text-gray-500 -mt-4 text-xs font-bold tracking-widest">Bölüm: <span className="text-black">{departmentName}</span></p>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <Loader2 className="h-10 w-10 animate-spin mb-2" />
                    <p className="font-medium">Doktorlar yükleniyor...</p>
                </div>
            ) : doctors.length === 0 ? (
                <div className="bg-gray-50 rounded-xl p-8 text-center border-2 border-dashed border-gray-200">
                    <p className="text-gray-500">Bu bölümde henüz kayıtlı doktor bulunmamaktadır.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {doctors.map((doc) => (
                        <Card
                            key={doc.id}
                            className={`
                                p-6 cursor-pointer transition-all duration-200 flex items-center justify-center text-center
                                ${selectedDoctorId === doc.id
                                    ? 'bg-black text-white border-black shadow-md transform scale-[1.01]'
                                    : 'bg-white text-gray-800 border-gray-200 hover:border-black hover:bg-gray-50'}
                            `}
                            onClick={() => onSelect(doc.id, `${doc.title} ${doc.full_name}`)}
                        >
                            <span className="font-bold text-lg tracking-tight">{doc.title} {doc.full_name}</span>
                        </Card>
                    ))}
                </div>
            )}

            <div className="flex justify-between pt-8">
                <Button variant="outline" onClick={onBack} className="h-11 px-8 border-black text-black hover:bg-gray-50 transition-all">
                    ← Geri
                </Button>
                <Button
                    onClick={onNext}
                    disabled={!selectedDoctorId}
                    className="bg-black hover:bg-gray-800 text-white font-bold h-11 px-8 rounded-lg transition-all"
                >
                    Devam Et →
                </Button>
            </div>
        </div>
    )
}
