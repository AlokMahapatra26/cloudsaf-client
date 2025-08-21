'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function Home() {
    const { user, signOut } = useAuth();

    return (
        <main className="flex flex-col items-center justify-center min-h-screen p-24">
            <h1 className="text-4xl font-bold mb-8">Welcome to Your Drive</h1>

            {user ? (
                <div className="text-center">
                    <p>You are signed in as: <strong>{user.email}</strong></p>
                    <button 
                        onClick={signOut} 
                        className="mt-4 px-4 py-2 font-bold text-white bg-red-500 rounded hover:bg-red-700"
                    >
                        Sign Out
                    </button>
                    {/* This is where your file/folder components will go! */}
                </div>
            ) : (
                <div className="text-center">
                    <p>Please sign in to continue.</p>
                    <div className="mt-4 space-x-4">
                        <Link href="/signin" className="px-4 py-2 font-bold text-white bg-green-500 rounded hover:bg-green-700">
                            Sign In
                        </Link>
                        <Link href="/signup" className="px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700">
                            Sign Up
                        </Link>
                    </div>
                </div>
            )}
        </main>
    );
}