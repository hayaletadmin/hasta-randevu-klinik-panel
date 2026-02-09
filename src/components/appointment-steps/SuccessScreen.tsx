"use client"

import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

interface SuccessScreenProps {
    onReset: () => void;
}

export function SuccessScreen({ onReset }: SuccessScreenProps) {
    return (
        <div className="flex flex-col items-center justify-center text-center py-8 space-y-6">

            <div className="w-24 h-24 bg-black rounded-full flex items-center justify-center mb-2 shadow-xl">
                <Check className="w-12 h-12 text-white" strokeWidth={4} />
            </div>

            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Randevunuz Oluşturuldu!</h2>

            <div className="space-y-4 text-gray-600 max-w-sm mx-auto">
                <p className="font-medium">Randevu bilgileriniz sistemimize başarıyla kaydedilmiştir.</p>
                <p className="text-black font-black text-xs tracking-widest border-y border-gray-100 py-4">Lütfen randevu saatinden en az 15 dakika önce hastanede olunuz.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto pt-8">
                <Button className="bg-black hover:bg-gray-800 text-white font-bold h-12 px-10 rounded-xl transition-all uppercase text-xs">
                    Takvime Ekle
                </Button>
                <Button variant="outline" onClick={onReset} className="border-black text-black hover:bg-gray-50 h-12 px-10 rounded-xl transition-all uppercase text-xs font-bold">
                    Yeni Randevu
                </Button>
            </div>
        </div>
    )
}
