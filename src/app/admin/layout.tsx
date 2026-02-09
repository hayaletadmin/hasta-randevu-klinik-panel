"use client"

import React from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { Search, Bell, ChevronDown, ChevronRight, User, Settings, LogOut } from 'lucide-react';

import { usePathname } from 'next/navigation';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isProfileOpen, setIsProfileOpen] = React.useState(false);

    return (
        <div className="flex min-h-screen bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-200">
            {/* Sidebar */}
            <AdminSidebar />

            {/* Ana İçerik */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

                {/* Üst Bar / Header */}
                <header className="h-20 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between px-8 sticky top-0 z-20 transition-colors duration-200">
                    <div className="flex items-center gap-4 flex-1 max-w-xl">
                        <div className="relative w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Hızlı arama yap..."
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-teal-500/20 transition-all dark:text-white dark:placeholder-gray-500"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 scale-90 opacity-40">
                                <kbd className="px-1.5 py-0.5 border rounded text-[10px] font-sans dark:border-slate-700 dark:text-gray-400">⌘</kbd>
                                <kbd className="px-1.5 py-0.5 border rounded text-[10px] font-sans dark:border-slate-700 dark:text-gray-400">K</kbd>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <button className="relative p-2 text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                            <Bell size={22} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                        </button>

                        <div className="h-8 w-px bg-gray-100 dark:bg-slate-800"></div>

                        <div className="relative">
                            <button
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-slate-800 p-1.5 rounded-lg transition-all group"
                            >
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white leading-none">Buzz Lightyear</p>
                                    <p className="text-[11px] text-gray-400 font-medium mt-1">Yönetici</p>
                                </div>
                                <div className="w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400 font-bold border-2 border-white dark:border-slate-800 shadow-sm">
                                    BL
                                </div>
                                <ChevronRight size={16} className={`text-gray-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-90' : ''}`} />
                            </button>

                            {/* Dropdown Menu */}
                            {isProfileOpen && (
                                <>
                                    <div className="fixed inset-0 z-30" onClick={() => setIsProfileOpen(false)}></div>
                                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-lg shadow-xl z-40 p-2 animate-in fade-in zoom-in-95 duration-200">
                                        <div className="p-3 border-b border-gray-50 dark:border-slate-800 mb-1 sm:hidden">
                                            <p className="text-sm font-bold text-gray-900 dark:text-white">Buzz Lightyear</p>
                                            <p className="text-xs text-gray-500">Yönetici</p>
                                        </div>
                                        <button className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:text-teal-700 dark:hover:text-teal-400 rounded-lg transition-all group">
                                            <User size={18} className="text-gray-400 group-hover:text-teal-600" />
                                            Profilim
                                        </button>
                                        <button className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:text-teal-700 dark:hover:text-teal-400 rounded-lg transition-all group">
                                            <Settings size={18} className="text-gray-400 group-hover:text-teal-600" />
                                            Hesap Ayarları
                                        </button>
                                        <div className="h-px bg-gray-50 dark:bg-slate-800 my-1"></div>
                                        <button className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all group">
                                            <LogOut size={18} className="text-red-400 group-hover:text-red-600" />
                                            Çıkış Yap
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* İçerik Alanı */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    {children}
                </main>

            </div>
        </div>
    );
}
