"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarIcon, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { getClinicSettings, getClosures, getAppointments, type Closure, type WorkHour } from "@/lib/supabase"

interface StepDateTimeProps {
    doctorId: string;
    onSelect: (date: string, time: string) => void;
    onBack: () => void;
    selectedDate?: string;
    selectedTime?: string;
}

const DEFAULT_WORK_HOURS: WorkHour[] = [
    { day: 1, start: '09:00', end: '18:00', isOpen: true, hasLunchBreak: true, lunchStart: '12:00', lunchEnd: '13:30' },
    { day: 2, start: '09:00', end: '18:00', isOpen: true, hasLunchBreak: true, lunchStart: '12:00', lunchEnd: '13:30' },
    { day: 3, start: '09:00', end: '18:00', isOpen: true, hasLunchBreak: true, lunchStart: '12:00', lunchEnd: '13:30' },
    { day: 4, start: '09:00', end: '18:00', isOpen: true, hasLunchBreak: true, lunchStart: '12:00', lunchEnd: '13:30' },
    { day: 5, start: '09:00', end: '18:00', isOpen: true, hasLunchBreak: true, lunchStart: '12:00', lunchEnd: '13:30' },
    { day: 6, start: '09:00', end: '18:00', isOpen: true, hasLunchBreak: true, lunchStart: '12:00', lunchEnd: '13:30' },
    { day: 0, start: '09:00', end: '18:00', isOpen: false, hasLunchBreak: true, lunchStart: '12:00', lunchEnd: '13:30' },
];

export function StepDateTime({ doctorId, onSelect, onBack, selectedDate, selectedTime }: StepDateTimeProps) {
    const [localDate, setLocalDate] = useState(selectedDate ? selectedDate.split('.').reverse().join('-') : new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' }));
    const [localTime, setLocalTime] = useState(selectedTime || "");
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState({ duration: 30 });
    const [workHours, setWorkHours] = useState<WorkHour[]>(DEFAULT_WORK_HOURS);
    const [closures, setClosures] = useState<Closure[]>([]);
    const [bookedSlots, setBookedSlots] = useState<string[]>([]);
    const dateInputRef = useRef<HTMLInputElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const getTurkishDateInfo = (dateStr: string) => {
        const [y, m, d] = dateStr.split('-').map(Number);
        const date = new Date(y, m - 1, d);
        const day = date.getDate().toString();
        const month = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"][date.getMonth()];
        const name = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"][date.getDay()];
        return { day, month, name };
    };

    // Generate visible date list (7 days)
    const getVisibleDates = () => {
        const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' });

        // Bugün ile seçili tarih arasındaki gün farkını bul
        const today = new Date(todayStr);
        const selected = new Date(localDate);
        const diffTime = selected.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Eğer seçili tarih bugünden itibaren ilk 7 gün içindeyse bugünden başla,
        // değilse seçili tarihten itibaren 7 gün göster.
        let startDateStr = todayStr;
        if (diffDays < 0 || diffDays >= 7) {
            startDateStr = localDate;
        }

        const dates = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(startDateStr);
            d.setDate(d.getDate() + i);
            const full = d.toISOString().split('T')[0];
            const info = getTurkishDateInfo(full);
            dates.push({ ...info, full });
        }

        return dates;
    };

    const visibleDates = getVisibleDates();
    const minDate = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' });

    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            try {
                const [settingsData, closuresData, appsData] = await Promise.all([
                    getClinicSettings(),
                    getClosures(),
                    getAppointments()
                ]);

                const durationSet = settingsData.find(s => s.key === 'appointment_duration')?.value;
                const workHoursSet = settingsData.find(s => s.key === 'clinic_work_hours')?.value;

                if (durationSet) setSettings({ duration: parseInt(durationSet) });
                if (workHoursSet) setWorkHours(JSON.parse(workHoursSet));

                setClosures(closuresData);

                const doctorBookings = appsData
                    .filter(app => app.doctor_id === doctorId && app.appointment_date === localDate && app.status !== 'İptal')
                    .map(app => app.appointment_time.slice(0, 5));
                setBookedSlots(doctorBookings);

            } catch (error) {
                console.error("Veri yükleme hatası:", error);
            } finally {
                setLoading(false);
            }
        };

        loadInitialData();
    }, [doctorId, localDate]);

    const handleCalendarClick = () => {
        if (dateInputRef.current) {
            try { (dateInputRef.current as any).showPicker(); } catch (e) { dateInputRef.current.focus(); dateInputRef.current.click(); }
        }
    };

    const handleDateChange = (val: string) => {
        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' });
        if (val < today) {
            alert("Geçmiş bir tarihe randevu alamazsınız.");
            setLocalDate(today);
            return;
        }
        setLocalDate(val);
        setLocalTime("");
    };

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 300;
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };



    const generateTimeSlots = () => {
        const date = new Date(localDate);
        const dayOfWeek = (date.getDay() === 0 ? 0 : date.getDay());
        const dayWH = workHours.find(wh => wh.day === dayOfWeek);

        if (!dayWH || !dayWH.isOpen) return [];

        const slots = [];
        const [startH, startM] = dayWH.start.split(':').map(Number);
        const [endH, endM] = dayWH.end.split(':').map(Number);

        let current = startH * 60 + startM;
        const end = endH * 60 + endM;

        const nowInTR = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Istanbul' }));

        while (current < end) {
            const h = Math.floor(current / 60);
            const m = current % 60;
            const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

            let isDisabled = false;
            let reason = "";

            const slotDate = new Date(localDate);
            slotDate.setHours(h, m, 0, 0);

            if (slotDate < nowInTR) {
                isDisabled = true;
                reason = "Geçmiş";
            }

            if (bookedSlots.includes(timeStr)) {
                isDisabled = true;
                reason = "Dolu";
            }

            if (dayWH.hasLunchBreak && dayWH.lunchStart && dayWH.lunchEnd) {
                const [lsH, lsM] = dayWH.lunchStart.split(':').map(Number);
                const [leH, leM] = dayWH.lunchEnd.split(':').map(Number);
                const lsMin = lsH * 60 + lsM;
                const leMin = leH * 60 + leM;
                if (current >= lsMin && current < leMin) {
                    isDisabled = true;
                    reason = "Ara";
                }
            }

            const activeClosure = closures.find(c => {
                if (c.closure_date !== localDate) return false;
                if (c.target_type === 'clinic' || (c.target_type === 'doctor' && c.doctor_id === doctorId)) {
                    if (!c.start_time || !c.end_time) return true;
                    return timeStr >= c.start_time.slice(0, 5) && timeStr < c.end_time.slice(0, 5);
                }
                return false;
            });

            if (reason === "Ara" || reason === "Kapalı") {
                current += settings.duration;
                continue;
            }

            slots.push({ time: timeStr, isDisabled, reason });
            current += settings.duration;
        }

        return slots;
    };

    const timeSlots = generateTimeSlots();

    const handleConfirm = () => {
        if (localDate && localTime) {
            const [y, m, d] = localDate.split('-');
            const formattedDate = `${d}.${m}.${y}`;
            onSelect(formattedDate, localTime);
        }
    }

    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Tarih ve Saat Seçimi</h2>

            {/* Date Selection */}
            <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Tarih</h3>

                <div className="hidden sm:flex items-center justify-start gap-4 w-full overflow-hidden">
                    {/* Scrollable Date Shortcuts */}
                    <div className="flex-1 min-w-0">
                        <div
                            ref={scrollContainerRef}
                            className="flex space-x-3 overflow-x-auto py-2 scrollbar-hide px-1"
                        >
                            {visibleDates.map((date) => (
                                <button
                                    key={date.full}
                                    onClick={() => handleDateChange(date.full)}
                                    className={`
                                        flex flex-col items-center justify-center w-[72px] h-24 rounded-2xl border transition-all duration-200
                                        ${localDate === date.full
                                            ? 'bg-black text-white border-black shadow-lg z-10'
                                            : 'bg-white text-gray-600 border-gray-200 hover:border-black'}
                                    `}
                                >
                                    <span className={`text-[10px] font-bold mb-1 ${localDate === date.full ? 'text-white/70' : 'opacity-60'}`}>{date.name}</span>
                                    <span className="text-2xl font-black leading-none">{date.day}</span>
                                    <span className={`text-[10px] font-bold mt-1 uppercase ${localDate === date.full ? 'text-white/70' : 'opacity-60'}`}>{date.month}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Calendar Selection Button (Right) */}
                    <div className="shrink-0 relative">
                        <input
                            ref={dateInputRef}
                            type="date"
                            min={minDate}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full -z-10"
                            onChange={(e) => handleDateChange(e.target.value)}
                        />
                        <button
                            onClick={handleCalendarClick}
                            className="flex flex-col items-center justify-center w-24 h-24 rounded-2xl border border-gray-200 bg-white text-black hover:border-black transition-all duration-200"
                        >
                            <CalendarIcon className="w-8 h-8 mb-1" />
                            <span className="text-[10px] font-black uppercase">Takvim</span>
                        </button>
                    </div>
                </div>

                <div className="flex sm:hidden">
                    <div className="relative w-full">
                        <input
                            type="date"
                            min={minDate}
                            value={localDate}
                            onChange={(e) => handleDateChange(e.target.value)}
                            className="w-full h-14 px-5 rounded-2xl border-2 border-gray-100 bg-white text-gray-900 font-bold focus:outline-none focus:border-black transition-all appearance-none text-base"
                        />
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                            <CalendarIcon className="w-5 h-5" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Time Selection */}
            <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Saat</h3>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                        <Loader2 className="h-8 w-8 animate-spin mb-2" />
                        <p className="text-sm">Saatler kontrol ediliyor...</p>
                    </div>
                ) : timeSlots.length === 0 ? (
                    <div className="bg-gray-50 rounded-xl p-8 text-center border-2 border-dashed border-gray-200">
                        <p className="text-gray-500">Seçilen tarihte uygun saat bulunmamaktadır.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                        {timeSlots.map((slot) => (
                            <button
                                key={slot.time}
                                disabled={slot.isDisabled}
                                onClick={() => setLocalTime(slot.time)}
                                className={`
                                    relative py-3 rounded-xl text-sm font-bold transition-all duration-200 border
                                    ${slot.isDisabled
                                        ? `bg-gray-50 border-gray-100 cursor-not-allowed line-through ${slot.reason === 'Dolu' ? 'text-red-400' : 'text-gray-300'}`
                                        : localTime === slot.time
                                            ? 'bg-black text-white border-black shadow-md scale-105 z-10'
                                            : 'bg-white text-gray-700 border-gray-200 hover:border-black hover:shadow-sm'}
                                `}
                            >
                                {slot.time}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex justify-between pt-8">
                <Button variant="outline" onClick={onBack} className="h-11 px-8 border-black text-black hover:bg-gray-50 transition-all font-bold">
                    ← Geri
                </Button>
                <Button
                    onClick={handleConfirm}
                    disabled={!localDate || !localTime || loading}
                    className="bg-black hover:bg-gray-800 text-white font-bold h-11 px-10 rounded-xl transition-all shadow-sm"
                >
                    Devam Et →
                </Button>
            </div>
        </div>
    )
}
