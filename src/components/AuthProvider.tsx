import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface EnrichedUser extends User {
    profile?: {
        name: string;
    };
}

interface AuthContextType {
    isSignedIn: boolean;
    isLoaded: boolean;
    user: EnrichedUser | null;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    isSignedIn: false,
    isLoaded: false,
    user: null,
    signOut: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setIsLoaded(true);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setIsLoaded(true);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    const isSignedIn = !!user;

    // We mock the user object slightly to match what the InsForge UI expected
    // so we don't need to rewrite 50 places that look for name/email
    const enrichedUser = user ? {
        ...user,
        profile: {
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Analyst'
        }
    } : null;

    return (
        <AuthContext.Provider value={{ isSignedIn, isLoaded, user: enrichedUser as any, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    return {
        isSignedIn: context.isSignedIn,
        isLoaded: context.isLoaded,
        signOut: context.signOut,
    };
};

export const useUser = () => {
    const context = useContext(AuthContext);
    return {
        user: context.user,
    };
};
