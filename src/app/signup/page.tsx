'use client';

import { useState } from 'react';
import { redirect, useRouter } from 'next/navigation';
import PasswordInput from '@/components/PasswordInput';
import { toast } from 'sonner';
import { AnimatedGridPattern } from '@/components/magicui/animated-grid-pattern';
import { cn } from '@/lib/utils';
export default function SignUp() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            setError(data.error);
        } else {
            toast.success("Verification link sent on your email please verify")
            router.push('/signin');
        }
    };

    return (
        <div className="flex items-center justify-center h-screen ">
            <form
                onSubmit={handleSignUp}
                className="p-8  rounded-2xl  w-96  "
            >
                <h2 className="text-2xl font-semibold mb-6 text-center ">
                    Sign Up
                </h2>

                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className=" text-foreground w-full p-3 mb-4 border rounded-lg focus:outline-none focus:ring-0 focus:ring-zinc-400 focus:border-zinc-400  placeholder-zinc-400"
                />

                <PasswordInput password={password} setPassword={setPassword} />

                <button
                    type="submit"
                    className=" w-full p-3 text-white bg-blue-600 cursor-pointer rounded-lg  transition duration-200"
                >
                    Sign Up
                </button>

                 <div className="mt-4 text-center">
                                    <p className="text-sm text-gray-600">
                                        Don’t have an account?{" "}
                                        <button
                                            className="text-blue-600 hover:underline font-medium cursor-pointer"
                                            onClick={() => redirect("/signin")}
                                        >
                                            Sign in
                                        </button>
                                    </p>
                                </div>
                
                {error && (
                    <p className="mt-4 text-sm text-center text-red-500">{error}</p>
                )}
            </form>
            <AnimatedGridPattern width={40} height={40}  numSquares={30}
                    maxOpacity={0.1}
                    duration={3}
                    repeatDelay={1}
                    className={cn(
                      "[mask-image:radial-gradient(500px_circle_at_center,white,transparent)]",
                      "inset-x-0 inset-y-[-30%] h-[100%] skew-y-12",
                    )}/>
            
        </div>

    );
}