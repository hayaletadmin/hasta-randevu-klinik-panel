"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarIcon } from "lucide-react"

// Mock Date Data
const DATES = [
    { day: "3", month: "Şub", name: "Sal", full: "2026-02-03" },
    { day: "4", month: "Şub", name: "Çar", full: "2026-02-04" },
    { day: "5", month: "Şub", name: "Per", full: "2026-02-05" },
    { day: "6", month: "Şub", name: "Cum", full: "2026-02-06" },
    { day: "7", month: "Şub", name: "Cmt", full: "2026-02-07" },
    { day: "9", month: "Şub", name: "Pzt", full: "2026-02-09" },
    { day: "10", month: "Şub", name: "Sal", full: "2026-02-10" },
    { day: "11", month: "Şub", name: "Çar", full: "2026-02-11" },
    { day: "12", month: "Şub", name: "Per", full: "2026-02-12" },
]

// Mock Time Data
const TIMES = [
    "09:00", "09:20", "09:40", "10:00", "10:20", "10:40", "11:00", "11:20",
    "11:40", "13:00", "13:20", "13:40", "14:00", "14:20", "14:40", "15:00",
    "15:20", "15:40", "16:00", "16:20", "16:40"
]

interface StepDateTimeProps {
    onSelect: (date: string, time: string) => void;
    onBack: () => void;
    selectedDate?: string;
    selectedTime?: string;
}

export function StepDateTime({ onSelect, onBack, selectedDate, selectedTime }: StepDateTimeProps) {
    const [localDate, setLocalDate] = useState(selectedDate || "2026-02-03");
    const [localTime, setLocalTime] = useState(selectedTime || "");
    const dateInputRef = useRef<HTMLInputElement>(null);

    const handleCalendarClick = () => {
        if (dateInputRef.current) {
            try {
                // Modern tarayıcılar için
                (dateInputRef.current as any).showPicker();
            } catch (e) {
                // Eski tarayıcılar için fallback
                dateInputRef.current.focus();
                dateInputRef.current.click();
            }
        }
    };

    const getTurkishDateInfo = (dateStr: string) => {
        const date = new Date(dateStr);
        const day = date.getDate().toString();
        const month = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"][date.getMonth()];
        const name = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"][date.getDay()];
        return { day, month, name };
    };

    const handleConfirm = () => {
        if (localDate && localTime) {
            // Format date for summary: DD.MM.YYYY
            const d = new Date(localDate);
            const formattedDate = `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`;
            onSelect(formattedDate, localTime);
        }
    }

    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-bold text-teal-700">Tarih ve Saat Seçimi</h2>

            {/* Date Selection */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Tarih</h3>

                {/* Desktop View: Horizontal Scroll */}
                <div className="hidden sm:flex items-center space-x-3">
                    <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide flex-1">
                        {DATES.map((date) => (
                            <button
                                key={date.full}
                                onClick={() => setLocalDate(date.full)}
                                className={`
                            flex flex-col items-center justify-center min-w-18 h-22 rounded-xl border transition-all duration-200
                            ${localDate === date.full
                                        ? 'bg-teal-600 text-white border-teal-600 shadow-md scale-105'
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-teal-300'}
                        `}
                            >
                                <span className="text-xs font-medium opacity-80">{date.name}</span>
                                <span className="text-2xl font-bold">{date.day}</span>
                                <span className="text-xs font-medium opacity-80">{date.month}</span>
                            </button>
                        ))}
                    </div>
                    {/* Calendar Button */}
                    <div className="relative">
                        <input
                            ref={dateInputRef}
                            type="date"
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full -z-10"
                            onChange={(e) => setLocalDate(e.target.value)}
                        />
                        {(() => {
                            const isShortcutDate = DATES.some(d => d.full === localDate);
                            const selectedDateInfo = getTurkishDateInfo(localDate);

                            return (
                                <button
                                    onClick={handleCalendarClick}
                                    className={`
                                        flex flex-col items-center justify-center min-w-18 h-22 rounded-xl border transition-all duration-200
                                        ${!isShortcutDate
                                            ? 'bg-teal-600 text-white border-teal-600 shadow-md scale-105'
                                            : 'bg-white text-teal-600 border-gray-200 hover:border-teal-300'}
                                    `}
                                >
                                    {!isShortcutDate ? (
                                        <>
                                            <span className="text-[10px] font-medium opacity-80">{selectedDateInfo.name}</span>
                                            <span className="text-2xl font-bold">{selectedDateInfo.day}</span>
                                            <span className="text-[10px] font-medium opacity-80">{selectedDateInfo.month}</span>
                                        </>
                                    ) : (
                                        <>
                                            <CalendarIcon className="w-8 h-8" />
                                            <span className="text-[10px] mt-1 font-bold">Takvim</span>
                                        </>
                                    )}
                                </button>
                            );
                        })()}
                    </div>
                </div>

                {/* Mobile View: Date Input */}
                <div className="flex sm:hidden">
                    <div className="relative w-full">
                        <input
                            type="date"
                            value={localDate}
                            onChange={(e) => setLocalDate(e.target.value)}
                            className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none"
                        />
                        <CalendarIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* Time Selection */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Saat</h3>

                {/* Desktop View: Grid */}
                <div className="hidden sm:grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {TIMES.map((time) => (
                        <button
                            key={time}
                            onClick={() => setLocalTime(time)}
                            className={`
                        py-2 px-1 rounded-lg text-sm font-medium border transition-all duration-150
                        ${localTime === time
                                    ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                                    : 'bg-white text-gray-700 border-gray-200 hover:border-teal-300 hover:text-teal-700'}
                    `}
                        >
                            {time}
                        </button>
                    ))}
                </div>

                {/* Mobile View: Select Dropdown */}
                <div className="flex sm:hidden">
                    <select
                        value={localTime}
                        onChange={(e) => setLocalTime(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23999%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C/polyline%3E%3C/svg%3E')] bg-size-[20px] bg-position-[right_1rem_center] bg-no-repeat"
                    >
                        <option value="" disabled>Saat Seçiniz</option>
                        {TIMES.map((time) => (
                            <option key={time} value={time}>{time}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex justify-between pt-6 border-t border-gray-100">
                <Button variant="outline" onClick={onBack} className="h-12 px-8 border-teal-600 text-teal-700 hover:bg-teal-50 rounded-xl">
                    ← Geri
                </Button>
                <Button
                    disabled={!localTime}
                    onClick={handleConfirm}
                    className="bg-teal-700 hover:bg-teal-800 text-white font-bold h-12 px-8 rounded-xl"
                >
                    Devam Et →
                </Button>
            </div>
        </div>
    )
}
