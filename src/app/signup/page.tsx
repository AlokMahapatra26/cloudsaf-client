'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignUp() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const response = await fetch('http://localhost:8000/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            setError(data.error);
        } else {
            alert('Sign up successful! Please sign in.');
            router.push('/');
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-zinc-50">
            <form
                onSubmit={handleSignUp}
                className="p-8 bg-white rounded-2xl shadow-lg w-96 border border-zinc-200"
            >
                <h2 className="text-2xl font-semibold mb-6 text-center text-zinc-800">
                    Sign Up
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
                    Sign Up
                </button>

                {error && (
                    <p className="mt-4 text-sm text-center text-red-500">{error}</p>
                )}
            </form>
        </div>

    );
}