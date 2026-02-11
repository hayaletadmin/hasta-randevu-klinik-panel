"use client"

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Calendar,
    PlusCircle,
    List,
    Users,
    UserPlus,
    FolderTree,
    Settings,
    HelpCircle,
    ChevronDown,
    ChevronRight,
    LogOut,
    Stethoscope,
    Sun,
    Moon
} from 'lucide-react';

interface SidebarItemProps {
    icon: React.ReactNode;
    label: string;
    href: string;
    active?: boolean;
    hasSubmenu?: boolean;
    isSubmenuOpen?: boolean;
    onToggleSubmenu?: () => void;
    onNavigate?: () => void;
}

const SidebarItem = ({ icon, label, href, active, hasSubmenu, isSubmenuOpen, onToggleSubmenu, onNavigate }: SidebarItemProps) => {
    const content = (
        <div
            className={`
        flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group cursor-pointer
        ${active && !hasSubmenu
                    ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 font-semibold'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'}
      `}
            onClick={hasSubmenu ? onToggleSubmenu : undefined}
        >
            <span className={`transition-colors ${active ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`}>
                {icon}
            </span>
            <span className="text-sm flex-1">{label}</span>
            {hasSubmenu && (
                <span className={`transition-transform duration-200 ${isSubmenuOpen ? 'rotate-180' : ''}`}>
                    <ChevronDown size={16} />
                </span>
            )}
        </div>
    );

    if (hasSubmenu) {
        return content;
    }

    return (
        <Link href={href} onClick={onNavigate}>
            {content}
        </Link>
    );
};

const SidebarGroup = ({ label, children }: { label: string, children: React.ReactNode }) => (
    <div className="mb-6">
        <p className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 leading-none">
            {label}
        </p>
        <div className="space-y-1">
            {children}
        </div>
    </div>
);

interface AdminSidebarProps {
    onNavigate?: () => void;
}

export default function AdminSidebar({ onNavigate }: AdminSidebarProps) {
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);
    const [isDark, setIsDark] = useState(false);
    const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
        randevular: pathname.includes('/randevular'),
        hastalar: pathname.includes('/hastalar')
    });

    useEffect(() => {
        setMounted(true);
        const storedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const shouldBeDark = storedTheme === 'dark' || (!storedTheme && prefersDark);

        setIsDark(shouldBeDark);
        if (shouldBeDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    const toggleMenu = (menu: string) => {
        setOpenMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
    };

    useEffect(() => {
        if (!mounted) return;
        if (isDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDark, mounted]);

    const toggleDarkMode = () => {
        setIsDark(!isDark);
    };

    if (!mounted) {
        return <aside className="w-64 bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 h-screen sticky top-0"></aside>;
    }

    return (
        <aside className="w-64 bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 flex flex-col h-screen sticky top-0 transition-all duration-200">
            {/* Logo Alanı */}
            <div className="p-6">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center shadow-lg shadow-teal-500/20">
                        <span className="text-white font-black text-xl leading-none">K</span>
                    </div>
                    <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">KlinikPanel</span>
                </div>
            </div>

            {/* Navigasyon Alanı */}
            <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-hide">
                <SidebarItem
                    icon={<LayoutDashboard size={20} />}
                    label="Kontrol Paneli"
                    href="/admin"
                    active={pathname === '/admin'}
                    onNavigate={onNavigate}
                />

                <div className="mt-8">
                    <SidebarGroup label="KLİNİK">
                        <SidebarItem
                            icon={<Calendar size={20} />}
                            label="Randevular"
                            href="/admin/randevular"
                            active={pathname.includes('/randevular')}
                            hasSubmenu
                            isSubmenuOpen={openMenus.randevular}
                            onToggleSubmenu={() => toggleMenu('randevular')}
                        />

                        {/* Alt Menü: Randevular */}
                        {openMenus.randevular && (
                            <div className="ml-4 border-l border-gray-100 dark:border-slate-800 mt-1 mb-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                                <SidebarItem icon={<PlusCircle size={16} />} label="Randevu Oluştur" href="/admin/randevular/ekle" active={pathname === '/admin/randevular/ekle'} onNavigate={onNavigate} />
                                <SidebarItem icon={<Calendar size={16} />} label="Randevu Takvimi" href="/admin/randevular/takvim" active={pathname === '/admin/randevular/takvim'} onNavigate={onNavigate} />
                                <SidebarItem icon={<List size={16} />} label="Randevu Listesi" href="/admin/randevular/liste" active={pathname === '/admin/randevular/liste'} onNavigate={onNavigate} />
                            </div>
                        )}

                        <SidebarItem
                            icon={<Users size={20} />}
                            label="Hastalar"
                            href="/admin/hastalar"
                            active={pathname.includes('/hastalar')}
                            hasSubmenu
                            isSubmenuOpen={openMenus.hastalar}
                            onToggleSubmenu={() => toggleMenu('hastalar')}
                        />

                        {/* Alt Menü: Hastalar */}
                        {openMenus.hastalar && (
                            <div className="ml-4 border-l border-gray-100 dark:border-slate-800 mt-1 mb-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                                <SidebarItem icon={<UserPlus size={16} />} label="Hasta Ekle" href="/admin/hastalar/ekle" active={pathname === '/admin/hastalar/ekle'} onNavigate={onNavigate} />
                                <SidebarItem icon={<List size={16} />} label="Tüm Hastalar" href="/admin/hastalar/liste" active={pathname === '/admin/hastalar/liste'} onNavigate={onNavigate} />
                                <SidebarItem icon={<FolderTree size={16} />} label="Hasta Grupları" href="/admin/hastalar/gruplar" active={pathname === '/admin/hastalar/gruplar'} onNavigate={onNavigate} />
                            </div>
                        )}
                    </SidebarGroup>

                    <SidebarGroup label="DİĞER">
                        <SidebarItem
                            icon={<Stethoscope size={20} />}
                            label="Ayarlar"
                            href="/admin/ayarlar"
                            active={pathname === '/admin/ayarlar'}
                            onNavigate={onNavigate}
                        />
                        <SidebarItem
                            icon={<HelpCircle size={20} />}
                            label="Yardım / Destek"
                            href="/admin/yardim"
                            active={pathname === '/admin/yardim'}
                            onNavigate={onNavigate}
                        />
                    </SidebarGroup>
                </div>
            </nav>

            {/* Alt Alan: Karanlık Mod Toggle */}
            <div className="p-4 border-t border-gray-100 dark:border-slate-800">
                <button
                    onClick={toggleDarkMode}
                    className="flex items-center justify-between w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all duration-200"
                >
                    <div className="flex items-center gap-3">
                        {isDark ? <Moon size={18} className="text-teal-500" /> : <Sun size={18} className="text-orange-500" />}
                        <span className="text-sm font-bold">{isDark ? 'Karanlık Mod' : 'Aydınlık Mod'}</span>
                    </div>
                    <div className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${isDark ? 'bg-teal-600' : 'bg-gray-300'}`}>
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${isDark ? 'left-6' : 'left-1'}`}></div>
                    </div>
                </button>
            </div>
        </aside>
    );
}
