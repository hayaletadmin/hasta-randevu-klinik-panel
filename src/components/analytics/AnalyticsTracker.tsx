"use client"

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function AnalyticsTracker() {
    useEffect(() => {
        const trackVisit = async () => {
            // Sadece ana dizinde (randevu alanı) çalışacak bir basit sayaç
            // Gerçek projede 'site_stats' gibi bir tabloya her girişte kayıt atılabilir
            // Veya Supabase RPC ile bir sayacı arttırabiliriz.
            // Şimdilik basitçe bir 'visits' tablosuna kayıt atalım.
            try {
                const { error } = await supabase
                    .from('site_visits')
                    .insert([{
                        page_path: '/',
                        user_agent: window.navigator.userAgent
                    }]);

                if (error) {
                    // Tablo yoksa sessizce geç (yönetici sonra ekleyebilir)
                    console.warn('Analytics tracking error:', error.message);
                }
            } catch (e) {
                console.error('Analytics error:', e);
            }
        }

        trackVisit();
    }, []);

    return null;
}
