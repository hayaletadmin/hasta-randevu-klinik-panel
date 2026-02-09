"use client"

import React, { useEffect, useState, useRef } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { Search, Bell, ChevronDown, ChevronRight, Settings, LogOut, Check, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    getClinicSettings,
    getNotifications,
    getUnreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    type AppNotification
} from '@/lib/supabase';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isProfileOpen, setIsProfileOpen] = React.useState(false);
    const [clinicName, setClinicName] = useState("Klinik Paneli");

    // Notification State
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const notificationRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        getClinicSettings().then(settings => {
            const name = settings.find(s => s.key === 'clinic_name')?.value;
            if (name) setClinicName(name);
        });

        fetchNotifications();
        // Poll for notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async () => {
        try {
            const [data, count] = await Promise.all([
                getNotifications(),
                getUnreadNotificationCount()
            ]);
            setNotifications(data);
            setUnreadCount(count);
        } catch (error) {
            console.error('Bildirimler yüklenirken hata:', error);
        }
    };

    const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent redirect
        try {
            await markNotificationAsRead(id);
            // Update local state
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Bildirim işaretleme hatası:', error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllNotificationsAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Tümünü okundu işaretleme hatası:', error);
        }
    };

    const handleNotificationClick = (notification: AppNotification) => {
        if (!notification.is_read) {
            markNotificationAsRead(notification.id).catch(console.error);
            setUnreadCount(prev => Math.max(0, prev - 1));
            setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n));
        }

        setIsNotificationsOpen(false);
        if (notification.link) {
            router.push(notification.link);
        }
    };

    // Close notification dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setIsNotificationsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [notificationRef]);

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
                        {/* Notification System */}
                        <div className="relative" ref={notificationRef}>
                            <button
                                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                                className="relative p-2 text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg transition-colors hover:text-teal-600"
                            >
                                <Bell size={22} />
                                {unreadCount > 0 && (
                                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>
                                )}
                            </button>

                            {isNotificationsOpen && (
                                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-2xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                                    <div className="flex items-center justify-between p-4 border-b border-gray-50 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50">
                                        <h3 className="font-bold text-gray-900 dark:text-white text-sm">Bildirimler</h3>
                                        {unreadCount > 0 && (
                                            <button
                                                onClick={handleMarkAllRead}
                                                className="text-[10px] font-bold text-teal-600 hover:text-teal-700 hover:underline"
                                            >
                                                Tümünü Okundu İşaretle
                                            </button>
                                        )}
                                    </div>

                                    <div className="max-h-[400px] overflow-y-auto">
                                        {notifications.length > 0 ? (
                                            <div className="divide-y divide-gray-50 dark:divide-slate-800">
                                                {notifications.map((notification) => (
                                                    <div
                                                        key={notification.id}
                                                        onClick={() => handleNotificationClick(notification)}
                                                        className={`p-4 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group relative ${!notification.is_read ? 'bg-teal-50/30' : ''}`}
                                                    >
                                                        <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${!notification.is_read ? 'bg-teal-500' : 'bg-gray-200 dark:bg-slate-700'}`}></div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-sm ${!notification.is_read ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-500 dark:text-gray-400'}`}>
                                                                {notification.message}
                                                            </p>
                                                            <p className="text-[10px] text-gray-400 mt-1">
                                                                {new Date(notification.created_at).toLocaleString('tr-TR')}
                                                            </p>
                                                        </div>
                                                        {!notification.is_read && (
                                                            <button
                                                                onClick={(e) => handleMarkAsRead(notification.id, e)}
                                                                className="opacity-0 group-hover:opacity-100 p-1 text-teal-600 hover:bg-teal-50 rounded-full transition-all"
                                                                title="Okundu olarak işaretle"
                                                            >
                                                                <Check size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-8 text-center text-gray-400 flex flex-col items-center gap-2">
                                                <Bell size={24} className="opacity-20" />
                                                <p className="text-sm font-medium">Henüz bildiriminiz yok.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="h-8 w-px bg-gray-100 dark:bg-slate-800"></div>

                        <div className="relative">
                            <button
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-slate-800 p-1.5 rounded-lg transition-all group"
                            >
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white leading-none">{clinicName}</p>
                                    <p className="text-[11px] text-gray-400 font-medium mt-1">Yönetim Paneli</p>
                                </div>
                                <ChevronRight size={16} className={`text-gray-400 transition-transform duration-200 ml-1 ${isProfileOpen ? 'rotate-90' : ''}`} />
                            </button>

                            {/* Dropdown Menu */}
                            {isProfileOpen && (
                                <>
                                    <div className="fixed inset-0 z-30" onClick={() => setIsProfileOpen(false)}></div>
                                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-lg shadow-xl z-40 p-2 animate-in fade-in zoom-in-95 duration-200">
                                        <div className="p-3 border-b border-gray-50 dark:border-slate-800 mb-1 sm:hidden">
                                            <p className="text-sm font-bold text-gray-900 dark:text-white">{clinicName}</p>
                                            <p className="text-xs text-gray-500">Yönetim Paneli</p>
                                        </div>
                                        <Link
                                            href="/admin/ayarlar"
                                            onClick={() => setIsProfileOpen(false)}
                                            className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:text-teal-700 dark:hover:text-teal-400 rounded-lg transition-all group"
                                        >
                                            <Settings size={18} className="text-gray-400 group-hover:text-teal-600" />
                                            Klinik Ayarları
                                        </Link>
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
