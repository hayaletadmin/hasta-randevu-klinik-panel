"use client"

// Force dynamic rendering to prevent build-time errors
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { supabase, getDoctors, type Doctor } from '@/lib/supabase';
import type { Appointment } from '@/lib/supabase';
import {
    Users,
    CalendarCheck,
    TrendingUp,
    TrendingDown,
    ChevronRight,
    MoreVertical,
    Plus,
    Clock,
    ArrowRight
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

interface StatCardProps {
    title: string;
    value: string;
    change: string;
    trend: 'up' | 'down';
    icon: React.ReactNode;
    color: string;
}

const StatCard = ({ title, value, change, trend, icon, color }: StatCardProps) => (
    <Card className="border-none shadow-sm transition-all hover:shadow-md bg-card">
        <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-lg bg-${color}-50 dark:bg-${color}-900/20 text-${color}-600 dark:text-${color}-400`}>
                    {icon}
                </div>
                <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <MoreVertical size={16} />
                </button>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{title}</p>
            <div className="flex items-end gap-3 mt-1">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{value}</h3>
                <div className={`flex items-center gap-0.5 text-[11px] font-bold mb-1 ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                    {trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {change}
                </div>
                <span className="text-[11px] text-gray-400 dark:text-gray-500 mb-1 ml-auto">Filtreye göre</span>
            </div>
        </CardContent>
    </Card>
);

type TimeRange = '24h' | '1w' | '1m' | 'all';

interface DepartmentDistribution {
    name: string;
    count: number;
    percentage: number;
    color: string;
}

export default function AdminDashboard() {
    const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [timeRange, setTimeRange] = useState<TimeRange>('1m');
    const [isRangeOpen, setIsRangeOpen] = useState(false);

    const [stats, setStats] = useState({
        totalPatients: 0,
        newAppointments: 0,
        totalVisits: 0
    });
    const [departmentDistribution, setDepartmentDistribution] = useState<DepartmentDistribution[]>([]);

    const rangeLabels: Record<TimeRange, string> = {
        '24h': '24 Saat',
        '1w': '1 Hafta',
        '1m': '1 Ay',
        'all': 'Tüm Zamanlar'
    };

    const getStartDate = (range: TimeRange) => {
        const now = new Date();
        switch (range) {
            case '24h':
                return new Date(now.getTime() - 24 * 60 * 60 * 1000);
            case '1w':
                return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            case '1m':
                return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            case 'all':
                return new Date(0); // Epoch
            default:
                return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            const startDate = getStartDate(timeRange);
            const startDateStr = startDate.toISOString().split('T')[0];
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];

            // 1. Fetch Upcoming Appointments
            const threeDaysLater = new Date();
            threeDaysLater.setDate(today.getDate() + 3);
            const endStr = threeDaysLater.toISOString().split('T')[0];

            const { data: upcoming } = await supabase
                .from('appointments')
                .select(`
                    *,
                    patients (full_name),
                    doctors (full_name),
                    procedures (name),
                    departments (name)
                `)
                .gte('appointment_date', todayStr)
                .lte('appointment_date', endStr)
                .order('appointment_date', { ascending: true })
                .order('appointment_time', { ascending: true })
                .limit(5);

            setUpcomingAppointments(upcoming || []);

            // 2. Fetch Stats based on range
            let patientQuery = supabase.from('patients').select('*', { count: 'exact', head: true }).eq('is_active', true);
            if (timeRange !== 'all') {
                patientQuery = patientQuery.gte('created_at', startDate.toISOString());
            }
            const { count: patientCount } = await patientQuery;

            let appQuery = supabase.from('appointments').select('*', { count: 'exact', head: true });
            if (timeRange !== 'all') {
                appQuery = appQuery.gte('appointment_date', startDateStr);
            }
            const { count: rangeApps } = await appQuery;

            // Site visits tracking (total)
            const { count: visitCount } = await supabase
                .from('site_visits')
                .select('*', { count: 'exact', head: true });

            setStats({
                totalPatients: patientCount || 0,
                newAppointments: rangeApps || 0,
                totalVisits: visitCount || 0
            });

            // 3. Fetch Doctors
            const docs = await getDoctors();
            setDoctors(docs.slice(0, 5));

            // 4. Department Distribution
            let deptQuery = supabase.from('appointments').select('departments(name)');
            if (timeRange !== 'all') {
                deptQuery = deptQuery.gte('appointment_date', startDateStr);
            }
            const { data: deptData } = await deptQuery;

            if (deptData) {
                const counts: Record<string, number> = {};
                deptData.forEach((item: any) => {
                    const name = item.departments?.name || 'Belirtilmemiş';
                    counts[name] = (counts[name] || 0) + 1;
                });

                const total = deptData.length;
                const colors = ['#3B82F6', '#F97316', '#0D9488', '#8B5CF6', '#EC4899'];
                const distribution: DepartmentDistribution[] = Object.entries(counts).map(([name, count], index) => ({
                    name,
                    count,
                    percentage: total > 0 ? Math.round((count / total) * 100) : 0,
                    color: colors[index % colors.length]
                }));
                setDepartmentDistribution(distribution);
            }
        };

        fetchData();
    }, [timeRange]);

    const currentDate = new Date().toLocaleDateString('tr-TR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const displayDateRange = () => {
        if (timeRange === 'all') return 'Tüm Zamanlar';
        const start = getStartDate(timeRange);
        const end = new Date();
        return `${start.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}`;
    };

    return (
        <div className="space-y-8">

            {/* Karşılama Başlığı */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Kontrol Paneli</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-bold text-gray-900 dark:text-slate-300 leading-none">KlinikPanel&apos;e tekrar hoş geldiniz! 👋</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">{currentDate}</span>
                    </div>
                </div>

                <div className="flex items-center gap-3 pb-2 md:pb-0">
                    <div className="relative flex p-1 bg-white dark:bg-slate-900 rounded-lg border border-gray-100 dark:border-slate-800 items-center transition-colors duration-200">
                        <button
                            onClick={() => setIsRangeOpen(!isRangeOpen)}
                            className="px-4 py-1.5 text-xs font-bold text-gray-400 dark:text-gray-500 border border-gray-100 dark:border-slate-800 rounded-lg whitespace-nowrap hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            {displayDateRange()}
                        </button>
                        <button
                            onClick={() => setIsRangeOpen(!isRangeOpen)}
                            className="px-4 py-1.5 text-xs font-bold text-gray-900 dark:text-white bg-white dark:bg-slate-800 rounded-lg ml-2 flex items-center gap-1 whitespace-nowrap border border-gray-100 dark:border-slate-700 hover:border-teal-500 transition-all shadow-sm"
                        >
                            {rangeLabels[timeRange]} <ChevronRight size={14} className={`transition-transform duration-200 ${isRangeOpen ? 'rotate-90' : ''}`} />
                        </button>

                        {isRangeOpen && (
                            <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-gray-100 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                {(['24h', '1w', '1m', 'all'] as TimeRange[]).map((r) => (
                                    <button
                                        key={r}
                                        onClick={() => {
                                            setTimeRange(r);
                                            setIsRangeOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors hover:bg-teal-50 dark:hover:bg-teal-900/20 ${timeRange === r ? 'text-teal-600 dark:text-teal-400 bg-teal-50/50 dark:bg-teal-900/10' : 'text-gray-600 dark:text-gray-400'}`}
                                    >
                                        {rangeLabels[r]}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <Link href="/admin/hastalar/ekle">
                        <Button className="rounded-lg h-10 px-6 bg-teal-600 hover:bg-teal-700 flex items-center gap-2 font-bold text-xs whitespace-nowrap">
                            <Plus size={18} /> Yeni Hasta Ekle
                        </Button>
                    </Link>
                </div>
            </div>

            {/* İstatistik Kartları */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard
                    title={timeRange === 'all' ? "Tüm Hastalar" : "Yeni Kayıtlı Hastalar"}
                    value={stats.totalPatients.toLocaleString()}
                    change="%0"
                    trend="up"
                    icon={<Users size={20} />}
                    color="blue"
                />
                <StatCard
                    title={`Randevular (${rangeLabels[timeRange]})`}
                    value={stats.newAppointments.toLocaleString()}
                    change="%0"
                    trend="up"
                    icon={<CalendarCheck size={20} />}
                    color="teal"
                />
                <StatCard
                    title="Toplam Ziyaretçi"
                    value={stats.totalVisits.toLocaleString()}
                    change="%0"
                    trend="up"
                    icon={<TrendingUp size={20} />}
                    color="purple"
                />
            </div>

            {/* Orta Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Hasta İstatistikleri Grafiği */}
                <Card className="lg:col-span-2 border-none shadow-sm dark:bg-slate-900">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-gray-900 dark:text-white">Hasta İstatistikleri</h3>
                            <div className="flex gap-4">
                            </div>
                        </div>

                        <div className="h-64 w-full relative">
                            <svg className="w-full h-full overflow-visible">
                                <line x1="0" y1="20%" x2="100%" y2="20%" stroke="currentColor" className="text-gray-100 dark:text-slate-800" strokeWidth="1" />
                                <line x1="0" y1="40%" x2="100%" y2="40%" stroke="currentColor" className="text-gray-100 dark:text-slate-800" strokeWidth="1" />
                                <line x1="0" y1="60%" x2="100%" y2="60%" stroke="currentColor" className="text-gray-100 dark:text-slate-800" strokeWidth="1" />
                                <line x1="0" y1="80%" x2="100%" y2="80%" stroke="currentColor" className="text-gray-100 dark:text-slate-800" strokeWidth="1" />

                                <path
                                    d="M0,150 L50,110 L100,130 L150,80 L200,100 L250,60 L300,90 L350,50 L400,70 L450,40 L500,80 L550,60"
                                    fill="none"
                                    stroke="#0D9488"
                                    strokeWidth="3"
                                    style={{ strokeLinejoin: 'round', strokeLinecap: 'round' }}
                                />

                                <path
                                    d="M0,150 L50,110 L100,130 L150,80 L200,100 L250,60 L300,90 L350,50 L400,70 L450,40 L500,80 L550,60 L550,200 L0,200 Z"
                                    fill="url(#tealGradient)"
                                    opacity="0.1"
                                />

                                <defs>
                                    <linearGradient id="tealGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#0D9488" />
                                        <stop offset="100%" stopColor="#0D9488" stopOpacity="0" />
                                    </linearGradient>
                                </defs>

                                <circle cx="350" cy="50" r="5" fill="#0D9488" stroke="currentColor" className="text-white dark:text-slate-900" strokeWidth="2" />
                                <rect x="330" y="5" width="40" height="30" rx="4" fill="currentColor" className="text-slate-900 dark:text-teal-500" />
                                <text x="350" y="25" textAnchor="middle" fill="currentColor" className="text-white dark:text-slate-900" fontSize="12" fontWeight="bold">{stats.totalPatients}</text>
                            </svg>

                            <div className="flex justify-between mt-4 px-2 text-[10px] font-bold text-gray-400 dark:text-gray-500">
                                {['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'].map(m => (
                                    <span key={m}>{m}</span>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Bölüme Göre Hasta Dağılımı */}
                <Card className="border-none shadow-sm dark:bg-slate-900">
                    <CardContent className="p-6">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-8">Bölüme Göre Hastalar</h3>

                        <div className="flex flex-col items-center">
                            <div className="relative w-48 h-48">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="96" cy="96" r="70" fill="none" stroke="currentColor" className="text-gray-50 dark:text-slate-800" strokeWidth="25" />
                                    {departmentDistribution.length > 0 ? (
                                        departmentDistribution.map((dept: DepartmentDistribution, i: number) => {
                                            const previousSum = departmentDistribution.slice(0, i).reduce((sum: number, d: DepartmentDistribution) => sum + d.percentage, 0);
                                            const strokeDasharray = `${(dept.percentage * 440) / 100} 440`;
                                            const strokeDashoffset = `-${(previousSum * 440) / 100}`;
                                            return (
                                                <circle
                                                    key={dept.name}
                                                    cx="96"
                                                    cy="96"
                                                    r="70"
                                                    fill="none"
                                                    stroke={dept.color}
                                                    strokeWidth="25"
                                                    strokeDasharray={strokeDasharray}
                                                    strokeDashoffset={strokeDashoffset}
                                                />
                                            );
                                        })
                                    ) : (
                                        <circle cx="96" cy="96" r="70" fill="none" stroke="#E2E8F0" strokeWidth="25" strokeDasharray="440 440" />
                                    )}
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-xs text-gray-400 dark:text-gray-500 font-medium leading-none">Toplam</span>
                                    <span className="text-3xl font-bold text-gray-900 dark:text-white leading-tight">{departmentDistribution.reduce((sum: number, d: DepartmentDistribution) => sum + d.count, 0)}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-x-8 gap-y-3 mt-10 w-full">
                                {departmentDistribution.map((dept: DepartmentDistribution) => (
                                    <div key={dept.name} className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: dept.color }}></div>
                                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 truncate max-w-[80px]">{dept.name}</span>
                                    </div>
                                ))}
                                {departmentDistribution.length === 0 && (
                                    <div className="col-span-2 text-center text-xs text-gray-400">Bu aralıkta veri yok</div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Alt Panel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Yaklaşan Randevular */}
                <Card className="border-none shadow-sm dark:bg-slate-900">
                    <CardContent className="p-6 h-full flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-gray-900 dark:text-white">Yaklaşan Randevular</h3>
                            <Link href="/admin/randevular/liste" className="flex items-center gap-1 text-xs font-bold text-teal-600 hover:text-teal-700 transition-colors">
                                Tümü <ArrowRight size={14} />
                            </Link>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-1">
                            {upcomingAppointments.length > 0 ? (
                                <div className="space-y-3">
                                    {upcomingAppointments.map((app: Appointment) => (
                                        <div key={app.id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 hover:bg-teal-50 dark:hover:bg-teal-900/10 transition-colors group border border-transparent hover:border-teal-100 dark:hover:border-teal-900/30">
                                            <div className="flex flex-col items-center justify-center min-w-12 h-12 bg-white dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700 shadow-sm">
                                                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">{new Date(app.appointment_date).toLocaleDateString('tr-TR', { month: 'short' })}</span>
                                                <span className="text-sm font-black text-gray-900 dark:text-white">{new Date(app.appointment_date).getDate()}</span>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">{app.patients?.full_name}</h4>
                                                    <div className="flex items-center gap-1 text-[10px] font-bold text-teal-600 bg-teal-50 dark:bg-teal-900/30 px-1.5 py-0.5 rounded ml-2 whitespace-nowrap">
                                                        <Clock size={10} />
                                                        {app.appointment_time.slice(0, 5)}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 truncate max-w-[120px]">
                                                        {app.doctors?.full_name}
                                                    </span>
                                                    <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-slate-600"></span>
                                                    <span className="text-[10px] text-gray-400 dark:text-gray-500 truncate">
                                                        {app.procedures?.name || app.departments?.name}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 py-8">
                                    <CalendarCheck size={32} className="opacity-20 mb-2" />
                                    <p className="text-sm font-medium">Yaklaşan randevu yok</p>
                                    <p className="text-xs opacity-60">Önümüzdeki 3 gün boş</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Doktorlar Listesi */}
                <Card className="border-none shadow-sm dark:bg-slate-900">
                    <CardContent className="p-6 flex flex-col h-full">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-gray-900 dark:text-white">Doktorlar</h3>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 group cursor-pointer">
                                <Users size={16} className="text-blue-500" /> {doctors.length}
                            </div>
                        </div>

                        <div className="flex-1 space-y-4">
                            {doctors.length > 0 ? (
                                doctors.map((doc: Doctor) => (
                                    <div key={doc.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer group">
                                        <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-slate-700 overflow-hidden ring-2 ring-white dark:ring-slate-800 flex items-center justify-center">
                                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white uppercase" style={{ backgroundColor: doc.color || '#94a3b8' }}>
                                                {doc.full_name.charAt(0)}
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{doc.full_name}</p>
                                            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{doc.departments?.name || 'Doktor'}</p>
                                        </div>
                                        <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-600 transition-colors" />
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-gray-400 py-4 text-sm">Doktor bulunamadı</div>
                            )}
                        </div>

                        <Link href="/admin/ayarlar">
                            <Button variant="ghost" className="w-full mt-6 text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 border border-gray-100 dark:border-slate-800 rounded-lg transition-colors">
                                Yönet
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>

        </div>
    );
}
