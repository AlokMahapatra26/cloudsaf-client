'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function SignIn() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const res = await fetch('http://localhost:8000/api/auth/signin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (data.error) {
            setError(data.error);
        } else {
            await supabase.auth.setSession({
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token,
            });
            router.push('/'); // redirect after login
        }
    };



    return (
        <div className="flex items-center justify-center min-h-screen bg-zinc-50">
            <form
                onSubmit={handleSubmit}
                className="p-8 bg-white rounded-2xl shadow-lg w-96 border border-zinc-200"
            >
                <h2 className="text-2xl font-semibold mb-6 text-center text-zinc-800">
                    Sign In
                </h2>

                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 mb-4 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:border-zinc-400 text-zinc-800 placeholder-zinc-400"
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 mb-4 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:border-zinc-400 text-zinc-800 placeholder-zinc-400"
                />

                <button
                    type="submit"
                    className="w-full p-3 text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition duration-200"
                >
                    Sign In
                </button>

                {error && (
                    <p className="mt-4 text-sm text-center text-red-500">{error}</p>
                )}
            </form>
        </div>


    );
}