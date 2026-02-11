"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    MoreHorizontal,
    Clock,
    Calendar as CalendarIcon,
    Trash2,
    Move
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAppointments, updateAppointment, deleteAppointment, getClinicSettings, getClosures, type Appointment, type Closure } from '@/lib/supabase';

// Helper to format Date to DD/MM/YYYY
const formatDateStr = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
};

// Helper to determine color based on status or randomness (Mocking visuals)
const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
        case 'tamamlandı':
            return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-500';
        case 'iptal':
            return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-500';
        case 'bekleniyor':
        default:
            return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-500';
    }
};

export default function AppointmentCalendar() {
    const router = useRouter();
    const [selectedDay, setSelectedDay] = useState(new Date());
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; date: Date | null; time: string | null; visible: boolean }>({
        x: 0,
        y: 0,
        date: null,
        time: null,
        visible: false
    });

    useEffect(() => {
        const handleClick = () => setContextMenu(prev => ({ ...prev, visible: false }));
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    const handleContextMenu = (e: React.MouseEvent, date: Date, time: string | null) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            date: date,
            time: time,
            visible: true
        });
    };

    const [viewDate, setViewDate] = useState(new Date());
    const [view, setView] = useState('week'); // 'day', '3days', 'week', 'month'
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [clinicSettings, setClinicSettings] = useState({ duration: 30, capacity: 1 });
    const [clinicWorkHours, setClinicWorkHours] = useState<any[]>([]);
    const [closures, setClosures] = useState<Closure[]>([]);

    const fetchSettings = async () => {
        try {
            const settings = await getClinicSettings();
            if (settings && settings.length > 0) {
                const duration = settings.find(s => s.key === 'appointment_duration')?.value;
                const capacity = settings.find(s => s.key === 'max_appointments_per_slot')?.value;
                const workHours = settings.find(s => s.key === 'clinic_work_hours')?.value;

                setClinicSettings({
                    duration: duration ? parseInt(duration) : 30,
                    capacity: capacity ? parseInt(capacity) : 1
                });

                if (workHours) {
                    try {
                        setClinicWorkHours(JSON.parse(workHours));
                    } catch (e) {
                        console.error('Çalışma saatleri parse edilemedi:', e);
                    }
                }
            }
        } catch (error) {
            console.error('Ayarlar yüklenemedi:', error);
        }
    };

    // Modal States
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
    const [selectedApp, setSelectedApp] = useState<any>(null);
    const [moveDate, setMoveDate] = useState('');
    const [moveTime, setMoveTime] = useState('');

    const fetchApps = async () => {
        setLoading(true);
        try {
            const data = await getAppointments();
            const mapped = data.map(app => ({
                id: app.id,
                name: app.patients?.full_name || 'İsimsiz Hasta',
                description: app.notes || app.departments?.name || 'Randevu',
                time: app.appointment_time?.slice(0, 5) || '00:00',
                duration: 1,
                date: formatDateStr(app.appointment_date),
                originalDate: app.appointment_date,
                color: getStatusColor(app.status),
                doctorColor: app.doctors?.color || '#3b82f6',
                doctorName: app.doctors?.full_name,
                doctorTitle: app.doctors?.title,
                doctor_id: app.doctor_id,
                status: app.status
            }));
            setAppointments(mapped);
        } catch (error) {
            console.error('Randevular yüklenemedi:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchClosures = async () => {
        try {
            const data = await getClosures();
            setClosures(data || []);
        } catch (error) {
            console.error('Kapatmalar yüklenemedi:', error);
        }
    };

    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => {
            setNow(new Date());
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    // Generate Hourly Slots
    const hourSlots = React.useMemo(() => {
        if (!clinicWorkHours || clinicWorkHours.length === 0) {
            const hours = [];
            for (let h = 8; h < 18; h++) {
                hours.push(`${h.toString().padStart(2, '0')}:00`);
            }
            return hours;
        }

        let minHour = 24;
        let maxHour = 0;

        clinicWorkHours.filter(wh => wh.isOpen).forEach(wh => {
            const [startH] = wh.start.split(':').map(Number);
            const [endH, endM] = wh.end.split(':').map(Number);

            if (startH < minHour) minHour = startH;

            // Eğer dakika 0 ise, kapanış saati tam saattir. 
            // 18:00'da kapanan klinik için son randevu başlangıç saati 17:xx'dir.
            // Bu yüzden 18:00 satırını (18-19 arasını kapsar) göstermeye gerek yoktur.
            const hourOfLastPossibleSlot = endM > 0 ? endH : endH - 1;
            if (hourOfLastPossibleSlot > maxHour) maxHour = hourOfLastPossibleSlot;
        });

        if (minHour === 24) minHour = 8;
        if (maxHour === 0) maxHour = 18;

        const hours = [];
        for (let h = minHour; h <= maxHour; h++) {
            hours.push(`${h.toString().padStart(2, '0')}:00`);
        }
        return hours;
    }, [clinicWorkHours]);

    // Helper to get sub-slots for an hour
    const getSubSlots = (hourStr: string) => {
        const slots = [];
        const [h] = hourStr.split(':').map(Number);
        const start = h * 60;
        const end = (h + 1) * 60;

        for (let time = start; time < end; time += clinicSettings.duration) {
            const hours = Math.floor(time / 60);
            const minutes = time % 60;
            slots.push(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
        }
        return slots;
    };

    const handleDeleteClick = (app: any) => {
        setSelectedApp(app);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!selectedApp) return;
        try {
            await deleteAppointment(selectedApp.id);
            setAppointments(prev => prev.filter(a => a.id !== selectedApp.id));
            setIsDeleteModalOpen(false);
            setSelectedApp(null);
        } catch (error) {
            console.error('Silme hatası:', error);
            alert('Randevu silinirken bir hata oluştu.');
        }
    };

    const handleMoveClick = (app: any) => {
        setSelectedApp(app);
        setMoveDate(app.originalDate || '');
        setMoveTime(app.time);
        setIsMoveModalOpen(true);
    };

    const confirmMove = async () => {
        if (!selectedApp || !moveDate || !moveTime) return;

        const isOccupied = appointments.some(app =>
            app.id !== selectedApp.id &&
            app.doctor_id === selectedApp.doctor_id &&
            app.originalDate === moveDate &&
            app.time === moveTime
        );

        if (isOccupied) {
            alert('Seçilen tarih ve saatte bu doktorun başka bir randevusu bulunmaktadır. Lütfen farklı bir zaman seçiniz.');
            return;
        }

        try {
            await updateAppointment(selectedApp.id, {
                appointment_date: moveDate,
                appointment_time: moveTime
            });
            fetchApps();
            setIsMoveModalOpen(false);
            setSelectedApp(null);
        } catch (error) {
            console.error('Taşıma hatası:', error);
            alert('Randevu taşınırken bir hata oluştu.');
        }
    };

    const months = [
        "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
        "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
    ];

    const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
    const fullDayNames = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

    const getDisplayDays = (date: Date, currentView: string) => {
        const current = new Date(date);

        if (currentView === 'day') {
            return [{
                day: fullDayNames[(current.getDay() + 6) % 7],
                date: new Date(current),
                dateStr: `${current.getDate().toString().padStart(2, '0')}/${(current.getMonth() + 1).toString().padStart(2, '0')}/${current.getFullYear()}`
            }];
        }

        if (currentView === '3days') {
            const week = [];
            for (let i = 0; i < 3; i++) {
                const d = new Date(current);
                d.setDate(current.getDate() + i);
                week.push({
                    day: dayNames[(d.getDay() + 6) % 7],
                    date: d,
                    dateStr: `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`
                });
            }
            return week;
        }

        if (currentView === 'week') {
            const day = current.getDay();
            const diff = current.getDate() - day + (day === 0 ? -6 : 1);
            const monday = new Date(current.setDate(diff));
            const week = [];
            for (let i = 0; i < 7; i++) {
                const d = new Date(monday);
                d.setDate(monday.getDate() + i);
                week.push({
                    day: dayNames[i],
                    date: d,
                    dateStr: `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`
                });
            }
            return week;
        }

        return [];
    };

    const displayDays = getDisplayDays(selectedDay, view);

    const changeMonth = (offset: number) => {
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1);
        setViewDate(newDate);
    };

    const getDaysInMonth = (year: number, month: number) => {
        const date = new Date(year, month, 1);
        const days = [];
        const firstDay = date.getDay();
        const emptyDays = firstDay === 0 ? 6 : firstDay - 1;

        for (let i = 0; i < emptyDays; i++) {
            days.push(null);
        }

        while (date.getMonth() === month) {
            days.push(new Date(date));
            date.setDate(date.getDate() + 1);
        }
        return days;
    };

    const getHoliday = (date: Date) => {
        if (!date) return null;
        const month = date.getMonth();
        const day = date.getDate();
        if (date.getFullYear() !== 2026) return null;

        if (month === 2 && day >= 19 && day <= 22) return 'Ramazan Bayramı';
        if (month === 3 && day === 23) return 'Ulusal Egemenlik ve Çocuk Bayramı';
        if (month === 4 && day === 1) return 'Emek ve Dayanışma Günü';
        if (month === 4 && day === 19) return 'Gençlik ve Spor Bayramı';
        if (month === 4 && day >= 27 && day <= 30) return 'Kurban Bayramı';
        if (month === 6 && day === 15) return 'Demokrasi ve Milli Birlik Günü';
        if (month === 9 && day === 29) return 'Cumhuriyet Bayramı';

        return null;
    };

    const days = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());

    const isSameDay = (d1: Date, d2: Date) => {
        return d1.getDate() === d2.getDate() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getFullYear() === d2.getFullYear();
    };

    const hasAppointment = (date: Date) => {
        const dateStr = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
        return appointments.some(app => app.date === dateStr);
    };

    useEffect(() => {
        fetchApps();
        fetchSettings();
        fetchClosures();
    }, []);

    const upcomingAppointments = appointments
        .filter(app => {
            if (!app.originalDate) return false;
            const appDate = new Date(app.originalDate + 'T' + app.time);
            return appDate >= new Date();
        })
        .sort((a, b) => new Date(a.originalDate + 'T' + a.time).getTime() - new Date(b.originalDate + 'T' + b.time).getTime())
        .slice(0, 5);

    return (
        <div className="flex flex-col lg:flex-row gap-8 h-full relative">
            {contextMenu.visible && (
                <div
                    className="fixed z-50 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-100 dark:border-slate-700 p-1 min-w-[160px] animate-in fade-in zoom-in-95 duration-100"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="p-1.5 space-y-1">
                        {(() => {
                            if (!contextMenu.date) return null;
                            const now = new Date();
                            const slotDate = new Date(contextMenu.date);

                            if (contextMenu.time) {
                                const [hours, minutes] = contextMenu.time.split(':').map(Number);
                                slotDate.setHours(hours, minutes, 0, 0);
                            } else {
                                slotDate.setHours(23, 59, 59, 999); // Aylık görünümde gün bitmemiş sayalım
                            }

                            const isPast = slotDate < now;

                            const activeClosure = closures.find(c => {
                                const closureDate = new Date(c.closure_date);
                                if (!isSameDay(closureDate, contextMenu.date!)) return false;
                                if (c.target_type !== 'clinic') return false; // Takvimde klinik bazlı gösterelim
                                if (!c.start_time || !c.end_time) return true;
                                if (!contextMenu.time) return true;
                                return contextMenu.time >= c.start_time && contextMenu.time < c.end_time;
                            });

                            if (isPast) return (
                                <div className="px-3 py-2 text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-900/30">
                                    Geçmiş tarihe randevu alınamaz
                                </div>
                            );

                            if (activeClosure) return (
                                <div className="px-3 py-2 text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-900/30">
                                    {activeClosure.reason || 'Klinik Kapalı'}
                                </div>
                            );

                            return (
                                <button
                                    onClick={() => {
                                        if (contextMenu.date) {
                                            const dateStr = `${contextMenu.date.getFullYear()}-${(contextMenu.date.getMonth() + 1).toString().padStart(2, '0')}-${contextMenu.date.getDate().toString().padStart(2, '0')}`;
                                            const timeQuery = contextMenu.time ? `&time=${contextMenu.time}` : '';
                                            router.push(`/admin/randevular/ekle?date=${dateStr}${timeQuery}`);
                                            setContextMenu(prev => ({ ...prev, visible: false }));
                                        }
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:text-teal-600 dark:hover:text-teal-400 rounded-lg transition-colors flex items-center gap-2 font-medium"
                                >
                                    <Plus size={14} />
                                    Hızlı Randevu
                                </button>
                            );
                        })()}
                    </div>
                </div>
            )}

            <div className="w-full lg:w-72 space-y-6">
                <Card className="border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-900 dark:text-white text-sm">Takvim</h3>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800"
                                    onClick={() => changeMonth(-1)}
                                >
                                    <ChevronLeft size={14} />
                                </Button>
                                <span className="text-[11px] font-bold text-gray-900 dark:text-white min-w-[70px] text-center">
                                    {months[viewDate.getMonth()]} {viewDate.getFullYear()}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800"
                                    onClick={() => changeMonth(1)}
                                >
                                    <ChevronRight size={14} />
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-7 gap-1 text-center">
                            {dayNames.map(d => (
                                <span key={d} className="text-[9px] font-bold text-gray-400 mb-2 uppercase tracking-tighter">{d}</span>
                            ))}
                            {days.map((date, i) => {
                                if (!date) return <div key={`empty-${i}`} className="h-7 w-7" />;
                                const isSelected = isSameDay(date, selectedDay);
                                const hasEvents = hasAppointment(date);
                                const holiday = getHoliday(date);

                                return (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedDay(date)}
                                        className={`
                                            h-7 w-7 text-[10px] font-bold rounded-lg flex items-center justify-center transition-all relative
                                            ${isSelected ? 'bg-teal-600 text-white shadow-md shadow-teal-500/20' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'}
                                            ${holiday ? 'ring-1 ring-red-400 text-red-500 bg-red-50 dark:bg-red-900/10' : ''}
                                        `}
                                        title={holiday || ''}
                                    >
                                        {date.getDate()}
                                        {hasEvents && !isSelected && (
                                            <div className="absolute bottom-1 w-0.5 h-0.5 bg-teal-500 rounded-full" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-900 dark:text-white text-sm">Yaklaşanlar</h3>
                            <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 cursor-pointer hover:underline">Tümü</span>
                        </div>
                        <div className="space-y-4">
                            {upcomingAppointments.length === 0 ? (
                                <p className="text-xs text-gray-400 text-center py-4">Yaklaşan randevu yok.</p>
                            ) : (
                                upcomingAppointments.map((app) => (
                                    <div key={app.id} className="group cursor-pointer">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-2 h-2 rounded-full shrink-0"
                                                style={{ backgroundColor: app.doctorColor }}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{app.name}</p>
                                                <p className="text-[10px] text-gray-400 truncate mt-0.5">
                                                    {app.doctorTitle} {app.doctorName}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold text-gray-900 dark:text-white">{app.time}</p>
                                                <p className="text-[9px] text-gray-400 mt-0.5">{app.date}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex-1 min-w-0">
                <Card className="border-none shadow-sm bg-white dark:bg-slate-900 h-full flex flex-col overflow-hidden">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-gray-100 dark:border-slate-800 px-4 md:px-6 py-3 md:py-4">
                        <div className="flex items-center justify-between gap-3">
                            <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Randevu Takvimi</h2>
                            <div className="px-2.5 py-1 bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-lg text-[11px] font-bold">
                                {view === 'day' && 'Günlük'}
                                {view === '3days' && '3 Günlük'}
                                {view === 'week' && 'Haftalık'}
                                {view === 'month' && 'Aylık'}
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 md:justify-end md:gap-3">
                            <div className="flex items-center bg-gray-50 dark:bg-slate-800 p-0.5 rounded-xl border border-gray-100 dark:border-slate-700/50 mr-0 md:mr-2 overflow-x-auto md:overflow-visible -mx-1 px-1 md:mx-0 md:px-0">
                                {[
                                    { id: 'day', label: '24 Saat' },
                                    { id: '3days', label: '3 Gün' },
                                    { id: 'week', label: '1 Hafta' },
                                    { id: 'month', label: '1 Ay' }
                                ].map((v) => (
                                    <button
                                        key={v.id}
                                        onClick={() => setView(v.id)}
                                        className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all whitespace-nowrap flex-shrink-0 ${view === v.id ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                                    >
                                        {v.label}
                                    </button>
                                ))}
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                className="h-9 px-4 text-xs font-bold border-gray-100 dark:border-slate-800 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800"
                                onClick={() => {
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);
                                    setSelectedDay(today);
                                    setViewDate(today);
                                }}
                            >
                                <CalendarIcon size={14} className="mr-2" />
                                Bugün
                            </Button>
                            <Button
                                onClick={() => router.push('/admin/randevular/ekle')}
                                className="bg-teal-600 hover:bg-teal-700 h-9 px-4 text-xs font-bold rounded-lg gap-2 shadow-lg shadow-teal-500/20"
                            >
                                <Plus size={16} /> Ekle
                            </Button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto bg-gray-50/20 dark:bg-slate-900/40">
                        {loading ? (
                            <div className="flex items-center justify-center h-full text-gray-500 font-bold">Yükleniyor...</div>
                        ) : view === 'month' ? (
                            <div className="p-6 h-full min-h-[600px]">
                                <div className="grid grid-cols-7 gap-px bg-gray-100 dark:bg-slate-800 border border-gray-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm h-full">
                                    {dayNames.map(d => (
                                        <div key={d} className="bg-gray-50 dark:bg-slate-900/50 p-3 text-center text-[10px] font-bold text-gray-400 uppercase">{d}</div>
                                    ))}
                                    {days.map((date, i) => {
                                        const dateStr = date ? `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}` : '';
                                        const dayAppointments = appointments.filter(app => app.date === dateStr);
                                        const isToday = date && isSameDay(date, new Date());
                                        const isSelected = date && isSameDay(date, selectedDay);
                                        const holiday = date ? getHoliday(date) : null;

                                        return (
                                            <div
                                                key={i}
                                                onClick={() => date && setSelectedDay(date)}
                                                onContextMenu={(e) => date && handleContextMenu(e, date, null)}
                                                className={`bg-white dark:bg-slate-900 min-h-[100px] p-2 transition-all cursor-pointer group hover:bg-teal-50/10 dark:hover:bg-teal-900/5 ${!date ? 'bg-gray-50 dark:bg-slate-900/40' : ''} ${isSelected ? 'ring-2 ring-inset ring-teal-500/20' : ''}`}
                                            >
                                                {date && (
                                                    <>
                                                        <div className="flex justify-between items-start">
                                                            <span className={`text-xs font-bold ${isToday ? 'bg-teal-600 text-white w-5 h-5 flex items-center justify-center rounded-full' : 'text-gray-900 dark:text-white'}`}>
                                                                {date.getDate()}
                                                            </span>
                                                        </div>
                                                        {holiday && (
                                                            <span className="text-[8px] font-bold text-red-500 block truncate mt-1">{holiday}</span>
                                                        )}
                                                        <div className="mt-2 space-y-1">
                                                            {dayAppointments.slice(0, 2).map(app => (
                                                                <div
                                                                    key={app.id}
                                                                    className="text-[8px] font-bold px-1 py-0.5 rounded truncate"
                                                                    style={{
                                                                        backgroundColor: `${app.doctorColor}15`,
                                                                        color: app.doctorColor,
                                                                        borderLeft: `2px solid ${app.doctorColor}`
                                                                    }}
                                                                >
                                                                    {app.time} {app.name}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="min-w-[800px]">
                                <div
                                    className="grid sticky top-0 bg-white dark:bg-slate-900 z-10 border-b-2 border-gray-200 dark:border-slate-700"
                                    style={{ gridTemplateColumns: `80px repeat(${displayDays.length}, 1fr)` }}
                                >
                                    <div className="p-3 text-[10px] font-bold text-gray-400 uppercase text-center border-r-2 border-gray-200 dark:border-slate-700">SAAT</div>
                                    {displayDays.map((day, i) => (
                                        <div key={i} className={`p-3 text-center border-r-2 border-gray-200 dark:border-slate-700 last:border-r-0 ${isSameDay(day.date, selectedDay) ? 'bg-teal-100 dark:bg-teal-500/20' : ''}`}>
                                            <p className="text-[10px] font-bold text-gray-500 uppercase">{day.day}</p>
                                            <p className="text-sm font-black text-gray-900 dark:text-white">{day.date.getDate()}/{day.date.getMonth() + 1}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="relative">
                                    {/* Current Time Indicator */}
                                    {(() => {
                                        const isTodayVisible = displayDays.some(d => isSameDay(d.date, now));
                                        if (!isTodayVisible || hourSlots.length === 0) return null;

                                        const firstHour = parseInt(hourSlots[0].split(':')[0]);
                                        const lastHour = parseInt(hourSlots[hourSlots.length - 1].split(':')[0]) + 1;
                                        const currentHour = now.getHours();
                                        const currentMinutes = now.getMinutes();

                                        if (currentHour < firstHour || currentHour >= lastHour) return null;

                                        const slotHeight = 40; // min-h-[40px] from sub-slots
                                        const slotsPerHour = 60 / clinicSettings.duration;
                                        const hourHeight = slotsPerHour * slotHeight;

                                        // Total pixel offset from the top
                                        const hoursPassed = currentHour - firstHour;
                                        const topOffset = (hoursPassed * hourHeight) + (currentMinutes / 60 * hourHeight);

                                        return (
                                            <div
                                                className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                                                style={{ top: `${topOffset}px` }}
                                            >
                                                <div className="w-[80px] flex justify-center">
                                                    <div className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                                                        {now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                                <div className="flex-1 h-px bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.4)] relative">
                                                    <div className="absolute left-0 -top-1 w-2 h-2 bg-red-400 rounded-full" />
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {hourSlots.map((hour, i) => (
                                        <div
                                            key={i}
                                            className="grid border-b-2 border-gray-100 dark:border-slate-800"
                                            style={{ gridTemplateColumns: `80px repeat(${displayDays.length}, 1fr)` }}
                                        >
                                            <div className="p-3 text-sm font-black text-gray-700 dark:text-gray-200 text-center flex items-center justify-center border-r-2 border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50">
                                                {hour}
                                            </div>

                                            {displayDays.map((day, dayIdx) => {
                                                const subSlots = getSubSlots(hour);
                                                return (
                                                    <div key={dayIdx} className="relative border-r-2 border-gray-100 dark:border-slate-800 last:border-r-0 flex flex-col">
                                                        {subSlots.map((slotTime) => {
                                                            const now = new Date();
                                                            const slotDate = new Date(day.date);
                                                            const [hours, minutes] = slotTime.split(':').map(Number);
                                                            slotDate.setHours(hours, minutes, 0, 0);
                                                            const isPast = slotDate < now;

                                                            // Öğle arası kontrolü
                                                            const dayOfWeek = (day.date.getDay() + 6) % 7 + 1; // 1-7
                                                            const workHour = clinicWorkHours.find(h => h.day === (day.date.getDay() === 0 ? 0 : day.date.getDay()));
                                                            const slotMinutes = hours * 60 + minutes;

                                                            let isLunchBreak = false;
                                                            if (workHour && workHour.isOpen && (workHour.hasLunchBreak ?? false) && workHour.lunchStart && workHour.lunchEnd) {
                                                                const [lsH, lsM] = workHour.lunchStart.split(':').map(Number);
                                                                const [leH, leM] = workHour.lunchEnd.split(':').map(Number);
                                                                const lsMin = lsH * 60 + lsM;
                                                                const leMin = leH * 60 + leM;
                                                                if (slotMinutes >= lsMin && slotMinutes < leMin) {
                                                                    isLunchBreak = true;
                                                                }
                                                            }

                                                            const activeClosure = closures.find(c => {
                                                                const closureDate = new Date(c.closure_date);
                                                                if (!isSameDay(closureDate, day.date)) return false;
                                                                if (c.target_type !== 'clinic') return false;
                                                                if (!c.start_time || !c.end_time) return true;
                                                                return slotTime >= c.start_time && slotTime < c.end_time;
                                                            });

                                                            // Çalışma saatleri dışı kontrolü
                                                            let isOutOfWorkHours = false;
                                                            if (workHour && workHour.isOpen) {
                                                                const [startH, startM] = workHour.start.split(':').map(Number);
                                                                const [endH, endM] = workHour.end.split(':').map(Number);
                                                                const startLimit = startH * 60 + startM;
                                                                const endLimit = endH * 60 + endM;

                                                                if (slotMinutes < startLimit || slotMinutes >= endLimit) {
                                                                    isOutOfWorkHours = true;
                                                                }
                                                            } else if (workHour && !workHour.isOpen) {
                                                                isOutOfWorkHours = true;
                                                            }

                                                            const isDisabled = isPast || isLunchBreak || !!activeClosure || isOutOfWorkHours;

                                                            return (
                                                                <div
                                                                    key={slotTime}
                                                                    onContextMenu={(e) => !isDisabled && handleContextMenu(e, day.date, slotTime)}
                                                                    className={`relative flex-1 min-h-[40px] border-b-2 border-gray-100/80 dark:border-slate-800 last:border-b-0 transition-colors group/slot ${isDisabled ? 'bg-gray-50/30 dark:bg-slate-900/20 cursor-not-allowed' : 'cursor-pointer hover:bg-teal-500/5'}`}
                                                                >
                                                                    {isOutOfWorkHours && !isLunchBreak && !activeClosure && (
                                                                        <div className="absolute inset-0 flex items-center justify-center bg-gray-500/5 pointer-events-none">
                                                                            <span className="text-[9px] font-black text-gray-400/30 uppercase tracking-widest">Kapalı</span>
                                                                        </div>
                                                                    )}
                                                                    {isLunchBreak && (
                                                                        <div className="absolute inset-0 flex items-center justify-center bg-yellow-500/5 pointer-events-none">
                                                                            <span className="text-[9px] font-black text-yellow-600/40 uppercase tracking-widest">Öğle Arası</span>
                                                                        </div>
                                                                    )}
                                                                    {activeClosure && (
                                                                        <div className="absolute inset-0 flex items-center justify-center bg-red-500/5 pointer-events-none">
                                                                            <span className="text-[9px] font-black text-red-600/40 uppercase tracking-widest leading-none px-2 text-center">{activeClosure.reason || 'Klinik Kapalı'}</span>
                                                                        </div>
                                                                    )}
                                                                    <span className="absolute left-1 top-0.5 text-[9px] font-black text-gray-400 opacity-0 group-hover/slot:opacity-100 transition-opacity">
                                                                        {slotTime} {isPast && '(Bitti)'} {isLunchBreak && '(Ara)'}
                                                                    </span>

                                                                    {(() => {
                                                                        const year = day.date.getFullYear();
                                                                        const month = String(day.date.getMonth() + 1).padStart(2, '0');
                                                                        const d = String(day.date.getDate()).padStart(2, '0');
                                                                        const dateStr = `${year}-${month}-${d}`;

                                                                        const slotApps = appointments.filter(app => app.originalDate === dateStr && app.time === slotTime);
                                                                        return slotApps.map((app, appIdx) => {
                                                                            const width = 100 / slotApps.length;
                                                                            const left = appIdx * width;
                                                                            return (
                                                                                <div
                                                                                    key={app.id}
                                                                                    onClick={(e) => e.stopPropagation()}
                                                                                    className={`absolute inset-x-0.5 top-0.5 bottom-0.5 rounded-lg p-1.5 border-l-4 shadow-sm z-10 overflow-hidden transition-all hover:scale-[1.02] cursor-pointer`}
                                                                                    style={{
                                                                                        left: `calc(${left}% + 2px)`,
                                                                                        width: `calc(${width}% - 4px)`,
                                                                                        backgroundColor: app.status === 'İptal' ? undefined : `${app.doctorColor}15`,
                                                                                        borderLeftColor: app.doctorColor,
                                                                                        color: app.doctorColor
                                                                                    }}
                                                                                >
                                                                                    <div className="flex items-center justify-between gap-1 overflow-hidden h-full">
                                                                                        <div className="flex-1 min-w-0">
                                                                                            <p className="text-[10px] font-black truncate leading-tight">{app.name}</p>
                                                                                            <p className="text-[8px] font-bold opacity-75 truncate">{app.time}</p>
                                                                                        </div>
                                                                                        <div onClick={(e) => e.stopPropagation()}>
                                                                                            <DropdownMenu modal={false}>
                                                                                                <DropdownMenuTrigger asChild>
                                                                                                    <button className="text-current hover:bg-black/10 p-0.5 rounded-lg"><MoreHorizontal size={12} /></button>
                                                                                                </DropdownMenuTrigger>
                                                                                                <DropdownMenuContent align="end" className="w-32 z-50 bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800">
                                                                                                    <DropdownMenuItem onClick={() => handleMoveClick(app)} className="text-xs font-bold gap-2 cursor-pointer">Değiştir</DropdownMenuItem>
                                                                                                    <DropdownMenuItem onClick={() => handleDeleteClick(app)} className="text-xs font-bold gap-2 cursor-pointer text-red-600">Sil</DropdownMenuItem>
                                                                                                </DropdownMenuContent>
                                                                                            </DropdownMenu>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        });
                                                                    })()}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-gray-100 dark:border-slate-800">
                        <div className="flex items-center gap-3 text-red-600">
                            <Trash2 size={24} />
                            <h3 className="font-bold text-lg">Randevuyu Sil</h3>
                        </div>
                        <p className="text-gray-500 text-sm">Bu randevuyu silmek istediğinize emin misiniz?</p>
                        <div className="flex justify-end gap-3 pt-2">
                            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Vazgeç</Button>
                            <Button onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Sil</Button>
                        </div>
                    </div>
                </div>
            )}

            {isMoveModalOpen && (
                <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-gray-100 dark:border-slate-800">
                        <div className="flex items-center gap-3 text-teal-600">
                            <CalendarIcon size={24} />
                            <h3 className="font-bold text-lg">Tarih Değiştir</h3>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 mb-1 uppercase">YENİ TARİH</p>
                                <input type="date" value={moveDate} onChange={(e) => setMoveDate(e.target.value)} className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm outline-none" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 mb-1 uppercase">YENİ SAAT</p>
                                <input type="time" value={moveTime} onChange={(e) => setMoveTime(e.target.value)} className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm outline-none" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <Button variant="outline" onClick={() => setIsMoveModalOpen(false)}>Vazgeç</Button>
                            <Button onClick={confirmMove} className="bg-teal-600 hover:bg-teal-700">Güncelle</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
