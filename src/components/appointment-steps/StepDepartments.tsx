"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { getDepartments, type Department } from "@/lib/supabase"
import { Loader2 } from "lucide-react"

interface StepDepartmentsProps {
    onSelect: (id: string, name: string) => void;
    onNext: () => void;
    onBack: () => void;
    selectedDepartmentId?: string;
}

export function StepDepartments({ onSelect, onNext, onBack, selectedDepartmentId }: StepDepartmentsProps) {
    const [departments, setDepartments] = useState<Department[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchDeps = async () => {
            const data = await getDepartments()
            setDepartments(data)
            setLoading(false)
        }
        fetchDeps()
    }, [])

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Bölüm Seçiniz</h2>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <Loader2 className="h-10 w-10 animate-spin mb-2" />
                    <p className="font-medium">Bölümler yükleniyor...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {departments.map((dept) => (
                        <Card
                            key={dept.id}
                            className={`
                                h-32 flex items-center justify-center p-4 cursor-pointer transition-all duration-200 hover:shadow-md
                                ${selectedDepartmentId === dept.id
                                    ? 'bg-teal-600 text-white border-teal-600 shadow-lg shadow-teal-600/20 scale-[1.02]'
                                    : 'bg-white text-gray-800 border-gray-200 hover:border-teal-600'}
                            `}
                            onClick={() => onSelect(dept.id, dept.name)}
                        >
                            <span className="text-center font-semibold text-lg tracking-tight">{dept.name}</span>
                        </Card>
                    ))}
                </div>
            )}

            <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={onBack} className="h-11 px-8 border-teal-600 text-teal-600 hover:bg-teal-50 transition-all">
                    ← Geri
                </Button>
                <Button
                    disabled={!selectedDepartmentId}
                    onClick={onNext}
                    className="bg-teal-600 hover:bg-teal-700 text-white font-bold h-11 px-8 rounded-lg transition-all shadow-lg shadow-teal-600/20"
                >
                    Devam Et →
                </Button>
            </div>
        </div>
    )
}
