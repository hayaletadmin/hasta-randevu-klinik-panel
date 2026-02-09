"use client"

import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

interface SuccessScreenProps {
    onReset: () => void;
}

export function SuccessScreen({ onReset }: SuccessScreenProps) {
    return (
        <div className="flex flex-col items-center justify-center text-center py-8 space-y-6">

            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-2">
                <Check className="w-12 h-12 text-green-700" strokeWidth={3} />
            </div>

            <h2 className="text-2xl font-bold text-teal-700">Randevunuz Oluşturuldu!</h2>

            <div className="space-y-2 text-gray-600 max-w-md mx-auto">
                <p>Randevu bilgileriniz sistemimize kaydedilmiştir.</p>
                <p className="text-orange-600 font-medium">Lütfen randevu saatinden en az 15 dakika önce hastanede olunuz.</p>
            </div>

            <div className="bg-gray-100 py-4 px-12 rounded-lg my-6">
                <p className="text-sm text-gray-500 mb-1">Randevu No</p>
                <p className="text-3xl font-bold text-gray-800 tracking-tight">#472554</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto pt-4">
                <Button className="bg-teal-700 hover:bg-teal-800 text-white font-bold h-11 px-6">
                    Takvime Ekle
                </Button>
                <Button variant="outline" onClick={onReset} className="border-teal-600 text-teal-700 hover:bg-teal-50 h-11 px-6">
                    Ana Sayfaya Dön
                </Button>
            </div>
        </div>
    )
}
