'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { redirect } from 'next/navigation';
import PasswordInput from '@/components/PasswordInput';
import { AnimatedGridPattern } from '@/components/magicui/animated-grid-pattern';
import { cn } from '@/lib/utils';

export default function SignIn() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/signin`, {
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
        <div className="flex items-center justify-center min-h-screen ">
            <form
                onSubmit={handleSubmit}
                className="p-8  rounded-2xl  w-96 "
            >
                <h2 className="text-2xl font-semibold mb-6 text-center ">
                    Sign In
                </h2>

                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="text-foreground w-full p-3 mb-4 border  rounded-lg focus:outline-none focus:ring-0   placeholder-zinc-400"
                />

                  <PasswordInput password={password} setPassword={setPassword} />



                <button
                    type="submit"
                    className="w-full p-3 bg-blue-600 text-white border cursor-pointer rounded-lg  transition duration-200"
                >
                    Sign In
                </button>

                <div className="mt-4 text-center">
                    <p className="text-sm text-gray-600">
                        Don’t have an account?{" "}
                        <button
                            className="text-blue-600 hover:underline font-medium cursor-pointer"
                            onClick={() => redirect("/signup")}
                        >
                            Sign up
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