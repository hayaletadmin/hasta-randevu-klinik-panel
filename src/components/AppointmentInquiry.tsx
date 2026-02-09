"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { useState } from "react"
import { validateTC } from "@/lib/validations"

export function AppointmentInquiry() {
    const [tc, setTc] = useState("")

    const handleTcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, '').slice(0, 11);
        setTc(val);
    }

    const handleSearch = () => {
        if (!validateTC(tc)) {
            alert("Geçersiz TC Kimlik Numarası");
            return;
        }
        alert("Sorgulama yapılıyor...");
    }

    return (
        <Card className="border-gray-200 shadow-sm max-w-2xl mx-auto w-full">
            <CardContent className="p-6 sm:p-8 space-y-6">
                <h2 className="text-xl font-bold text-teal-700">Randevu Sorgula</h2>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">TC Kimlik No</label>
                    <Input
                        placeholder="11 haneli TC Kimlik No"
                        value={tc}
                        onChange={handleTcChange}
                        className="h-11 bg-white border-gray-300 focus-visible:ring-teal-500"
                    />
                </div>

                <Button
                    onClick={handleSearch}
                    className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold h-11"
                >
                    Sorgula
                </Button>
            </CardContent>
        </Card>
    )
}
