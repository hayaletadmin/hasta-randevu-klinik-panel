"use client"

import React from 'react';
import {
    Users,
    CalendarCheck,
    Stethoscope,
    TrendingUp,
    TrendingDown,
    ChevronRight,
    MoreVertical,
    Download,
    Plus
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const StatCard = ({ title, value, change, trend, icon, color }: any) => (
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
                <span className="text-[11px] text-gray-400 dark:text-gray-500 mb-1 ml-auto">Geçen ay</span>
            </div>
        </CardContent>
    </Card>
);

export default function AdminDashboard() {
    return (
        <div className="space-y-8">

            {/* Karşılama Başlığı */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Kontrol Paneli</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-bold text-gray-900 dark:text-slate-300 leading-none">KlinikPanel'e tekrar hoş geldiniz! 👋</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">Pazartesi, 26 Ekim 2024</span>
                    </div>
                </div>

                <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0">
                    <div className="flex p-1 bg-card rounded-lg border border-border items-center transition-colors duration-200">
                        <button className="px-4 py-1.5 text-xs font-bold text-gray-400 dark:text-gray-500 border border-border rounded-lg whitespace-nowrap">01 Eki - 30 Eki</button>
                        <button className="px-4 py-1.5 text-xs font-bold text-gray-900 dark:text-white bg-background rounded-lg ml-2 flex items-center gap-1 whitespace-nowrap">
                            Aylık <ChevronRight size={14} className="rotate-90" />
                        </button>
                    </div>

                    <Button variant="outline" className="rounded-lg h-10 px-4 flex items-center gap-2 border-gray-200 dark:border-slate-800 text-gray-600 dark:text-gray-300 font-bold text-xs whitespace-nowrap transition-colors">
                        <Download size={16} /> Dışarı Aktar
                    </Button>

                    <Button className="rounded-lg h-10 px-6 bg-teal-600 hover:bg-teal-700 flex items-center gap-2 font-bold text-xs whitespace-nowrap">
                        <Plus size={18} /> Yeni Hasta Ekle
                    </Button>
                </div>
            </div>

            {/* İstatistik Kartları */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Toplam Hasta"
                    value="1,250"
                    change="%3.1"
                    trend="up"
                    icon={<Users size={20} />}
                    color="blue"
                />
                <StatCard
                    title="Yeni Randevular"
                    value="320"
                    change="%5.7"
                    trend="up"
                    icon={<CalendarCheck size={20} />}
                    color="teal"
                />
                <StatCard
                    title="Cerrahi İşlemler"
                    value="680"
                    change="%2.8"
                    trend="down"
                    icon={<Stethoscope size={20} />}
                    color="orange"
                />
                <StatCard
                    title="Toplam Ziyaretçi"
                    value="4,100"
                    change="%3.9"
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
                                <text x="350" y="25" textAnchor="middle" fill="currentColor" className="text-white dark:text-slate-900" fontSize="12" fontWeight="bold">291</text>
                            </svg>

                            <div className="flex justify-between mt-4 px-2 text-[10px] font-bold text-gray-400 dark:text-gray-500">
                                {['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'].map(m => (
                                    <span key={m}>{m}</span>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Türe Göre Hasta Dağılımı */}
                <Card className="border-none shadow-sm dark:bg-slate-900">
                    <CardContent className="p-6">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-8">Türe Göre Hastalar</h3>

                        <div className="flex flex-col items-center">
                            <div className="relative w-48 h-48">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="96" cy="96" r="70" fill="none" stroke="currentColor" className="text-gray-50 dark:text-slate-800" strokeWidth="25" />
                                    <circle cx="96" cy="96" r="70" fill="none" stroke="#3B82F6" strokeWidth="25" strokeDasharray="150 440" />
                                    <circle cx="96" cy="96" r="70" fill="none" stroke="#F97316" strokeWidth="25" strokeDasharray="80 440" strokeDashoffset="-150" />
                                    <circle cx="96" cy="96" r="70" fill="none" stroke="#0D9488" strokeWidth="25" strokeDasharray="100 440" strokeDashoffset="-230" />
                                    <circle cx="96" cy="96" r="70" fill="none" stroke="#0F172A" strokeWidth="25" strokeDasharray="110 440" strokeDashoffset="-330" />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-xs text-gray-400 dark:text-gray-500 font-medium leading-none">Toplam</span>
                                    <span className="text-3xl font-bold text-gray-900 dark:text-white leading-tight">382</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-x-8 gap-y-3 mt-10 w-full">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-blue-400"></div>
                                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Kuşlar</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-orange-400"></div>
                                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Köpekler</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-teal-600"></div>
                                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Kediler</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-slate-900 dark:bg-slate-700"></div>
                                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Diğer</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Alt Panel */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* En Sık İşlemler */}
                <Card className="border-none shadow-sm dark:bg-slate-900">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-gray-900 dark:text-white">En Sık İşlemler</h3>
                            <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 text-xs font-bold bg-teal-50 dark:bg-teal-900/20 px-2 py-1 rounded-lg">
                                <TrendingUp size={14} /> 382 <span className="text-[10px] text-teal-400">+21</span>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-bold text-gray-500 dark:text-gray-400">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-lg bg-blue-500"></div>
                                        <span>Aşılamalar</span>
                                    </div>
                                    <span className="text-gray-900 dark:text-white">%60</span>
                                </div>
                                <div className="h-1.5 w-full bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden transition-colors">
                                    <div className="h-full bg-blue-500 w-[60%]"></div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-bold text-gray-500 dark:text-gray-400">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-lg bg-orange-400"></div>
                                        <span>Kısırlaştırma</span>
                                    </div>
                                    <span className="text-gray-900 dark:text-white">%30</span>
                                </div>
                                <div className="h-1.5 w-full bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden transition-colors">
                                    <div className="h-full bg-orange-400 w-[30%]"></div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-bold text-gray-500 dark:text-gray-400">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-lg bg-teal-400"></div>
                                        <span>Deri ve Tüy Bakımı</span>
                                    </div>
                                    <span className="text-gray-900 dark:text-white">%10</span>
                                </div>
                                <div className="h-1.5 w-full bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden transition-colors">
                                    <div className="h-full bg-teal-400 w-[10%]"></div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Personel Listesi */}
                <Card className="border-none shadow-sm dark:bg-slate-900">
                    <CardContent className="p-6 flex flex-col h-full">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-gray-900 dark:text-white">Personel</h3>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 group cursor-pointer">
                                <Users size={16} className="text-blue-500" /> 531 <span className="text-[10px] text-teal-500">+12</span>
                            </div>
                        </div>

                        <div className="flex-1 space-y-4">
                            {[
                                { name: 'Dr. James Carter', role: 'Cerrahi Uzmanı' },
                                { name: 'Dr. Michael Thompson', role: 'Dahiliye Uzmanı' },
                                { name: 'Dr. Daniel Foster', role: 'Onkoloji Uzmanı' }
                            ].map((doc, idx) => (
                                <div key={idx} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer group">
                                    <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-slate-700 overflow-hidden ring-2 ring-white dark:ring-slate-800">
                                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-400">DR</div>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{doc.name}</p>
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{doc.role}</p>
                                    </div>
                                    <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-600 transition-colors" />
                                </div>
                            ))}
                        </div>

                        <Button variant="ghost" className="w-full mt-6 text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 border border-gray-100 dark:border-slate-800 rounded-lg transition-colors">
                            Tümünü Gör
                        </Button>
                    </CardContent>
                </Card>

                {/* Memnuniyet Oranı */}
                <Card className="border-none shadow-sm dark:bg-slate-900">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-gray-900 dark:text-white">Memnuniyet Oranı</h3>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-lg">
                                <span className="text-lg leading-none">😊</span> %94 <span className="text-[10px] text-teal-500">+%4.3</span>
                            </div>
                        </div>

                        <div className="h-32 w-full mt-10">
                            <svg className="w-full h-full overflow-visible">
                                <path
                                    d="M0,80 L80,60 L160,70 L240,50 L320,65 L400,40"
                                    fill="none"
                                    stroke="#3B82F6"
                                    strokeWidth="3"
                                    style={{ strokeLinejoin: 'round', strokeLinecap: 'round' }}
                                />
                                {[
                                    { x: 0, y: 80 }, { x: 80, y: 60 }, { x: 160, y: 70 }, { x: 240, y: 50 }, { x: 320, y: 65 }, { x: 400, y: 40 }
                                ].map((p, i) => (
                                    <circle key={i} cx={p.x} cy={p.y} r="3" fill="currentColor" className="text-white dark:text-slate-900" stroke="#3B82F6" strokeWidth="2" />
                                ))}
                            </svg>
                        </div>

                        <div className="mt-8">
                            <p className="text-xs font-bold text-gray-900 dark:text-white">Hasta memnuniyeti %94 oranında</p>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium leading-normal mt-1">
                                Bu artış, hastaların klinik hizmetlerinden son derece memnun olduğunu göstermektedir.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

        </div>
    );
}
