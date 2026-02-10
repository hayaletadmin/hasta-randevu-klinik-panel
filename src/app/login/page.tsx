"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Loader2, ArrowRight } from 'lucide-react';
import { signIn } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Supabase Auth ile güvenli giriş
            const user = await signIn(email, password);

            // Cookie for middleware (session Supabase tarafından yönetiliyor)
            document.cookie = `admin_logged_in=true; path=/; max-age=86400; SameSite=Lax`;

            router.push('/admin');
            router.refresh();

        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.message || 'Giriş yapılamadı');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 overflow-hidden">
                <div className="p-8 pb-6 text-center">
                    <div className="w-16 h-16 bg-teal-50 dark:bg-teal-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-teal-600 dark:text-teal-400">
                        <Lock size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Yönetici Girişi</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Yönetim paneline erişmek için giriş yapın</p>
                </div>

                <div className="p-8 pt-0">
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">E-posta</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="admin@hastane.com"
                                    className="pl-10 h-11"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="password">Şifre</Label>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="pl-10 h-11"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 text-sm font-medium">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full bg-teal-600 hover:bg-teal-700 text-white h-11 text-base font-medium gap-2 shadow-lg shadow-teal-500/20"
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="animate-spin" /> : 'Giriş Yap'}
                            {!loading && <ArrowRight size={18} />}
                        </Button>
                    </form>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-slate-900/50 border-t border-gray-100 dark:border-slate-800 text-center text-xs text-gray-500 dark:text-gray-400">
                    &copy; 2026 Randevu Yönetim Sistemi
                </div>
            </div>
        </div>
    );
}
