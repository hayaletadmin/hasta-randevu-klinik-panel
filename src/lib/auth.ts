import { supabase } from './supabase';

export type AuthUser = {
    id: string;
    email: string;
    full_name?: string;
    role?: string;
};

// Supabase Auth ile giriş
export const signIn = async (email: string, password: string): Promise<AuthUser> => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        throw new Error(error.message === 'Invalid login credentials'
            ? 'E-posta veya şifre hatalı'
            : error.message);
    }

    if (!data.user) {
        throw new Error('Kullanıcı bulunamadı');
    }

    // Kullanıcı bilgilerini users tablosundan al (varsa)
    const { data: userData } = await supabase
        .from('users')
        .select('full_name, role')
        .eq('id', data.user.id)
        .single();

    return {
        id: data.user.id,
        email: data.user.email || email,
        full_name: userData?.full_name || data.user.user_metadata?.full_name,
        role: userData?.role || 'admin'
    };
};

// Çıkış
export const signOut = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        throw new Error('Çıkış yapılamadı');
    }
};

// Mevcut oturum bilgisini al
export const getCurrentUser = async (): Promise<AuthUser | null> => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return null;
    }

    // Kullanıcı bilgilerini users tablosundan al
    const { data: userData } = await supabase
        .from('users')
        .select('full_name, role')
        .eq('id', user.id)
        .single();

    return {
        id: user.id,
        email: user.email || '',
        full_name: userData?.full_name || user.user_metadata?.full_name,
        role: userData?.role || 'admin'
    };
};

// Oturum değişikliklerini dinle
export const onAuthStateChange = (callback: (user: AuthUser | null) => void) => {
    return supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
            const { data: userData } = await supabase
                .from('users')
                .select('full_name, role')
                .eq('id', session.user.id)
                .single();

            callback({
                id: session.user.id,
                email: session.user.email || '',
                full_name: userData?.full_name || session.user.user_metadata?.full_name,
                role: userData?.role || 'admin'
            });
        } else {
            callback(null);
        }
    });
};

// Session kontrolü
export const getSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
};
