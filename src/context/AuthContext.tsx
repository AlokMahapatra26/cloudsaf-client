'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        // Check for an existing session on initial load
        supabase.auth.getSession().then(({ data: { session } }) => {
            console.log("Initial session:", session);
            setSession(session);
            setUser(session?.user ?? null);
        });

        // Listen for changes in authentication state
        const { data: authListener } = supabase.auth.onAuthStateChange(
            (event, session) => {
                console.log("Auth change:", event, session); // <--- Add this
                setSession(session);
                setUser(session?.user ?? null);
            }
        );

        // Cleanup listener on component unmount
        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    const value = {
        session,
        user,
        signOut,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use the auth context
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}