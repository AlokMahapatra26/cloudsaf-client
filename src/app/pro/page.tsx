"use client"
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, LogOut, X } from 'lucide-react';
import { Separator } from "@/components/ui/separator";
import { redirect } from 'next/navigation';

const PricingPage = () => {
    return (
        <div className="flex justify-center items-center min-h-screen bg-white dark:bg-zinc-950 p-6">
            <div className="w-full max-w-4xl">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Pricing</h1>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        Choose the plan that's right for you.
                    </p>
                </div>

                <div className="flex flex-col md:flex-row justify-center gap-8">
                    {/* Free Tier Card */}
                    <Card className="flex-1 max-w-sm border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-md">
                        <CardHeader className="text-center">
                            <CardTitle className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Free</CardTitle>
                            <CardDescription className="text-zinc-500 dark:text-zinc-400">Perfect for getting started</CardDescription>
                        </CardHeader>
                        <CardContent className="text-center">
                            <h3 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100">
                                Free
                                <span className="text-sm font-normal text-zinc-500 dark:text-zinc-400 ml-1">/ month</span>
                            </h3>
                            <Separator className="my-4 bg-zinc-200 dark:bg-zinc-700" />
                            <ul className="list-none space-y-2 text-left">
                                <li className="flex items-center text-zinc-700 dark:text-zinc-300">
                                    <Check className="h-4 w-4 text-green-500 mr-2" /> 20 MB Storage
                                </li>
                                <li className="flex items-center text-zinc-700 dark:text-zinc-300">
                                    <Check className="h-4 w-4 text-green-500 mr-2" /> Unlimited access
                                </li>
                               
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" variant="outline" onClick={()=>redirect('/signup')}>Sign up for free</Button>
                        </CardFooter>
                    </Card>

                    {/* Pro Tier Card */}
                    <Card className="flex-1 max-w-sm border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg">
                        <CardHeader className="text-center">
                            <CardTitle className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Pro</CardTitle>
                            <CardDescription className="text-zinc-500 dark:text-zinc-400">Level up your storage</CardDescription>
                        </CardHeader>
                        <CardContent className="text-center">
                            <h3 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100">
                                ₹29
                                <span className="text-sm font-normal text-zinc-500 dark:text-zinc-400 ml-1">/ month</span>
                            </h3>
                            <Separator className="my-4 bg-zinc-200 dark:bg-zinc-700" />
                            <ul className="list-none space-y-2 text-left">
                                <li className="flex items-center text-zinc-700 dark:text-zinc-300">
                                    <Check className="h-4 w-4 text-green-500 mr-2" /> 200 MB Storage
                                </li>
                                <li className="flex items-center text-zinc-700 dark:text-zinc-300">
                                    <Check className="h-4 w-4 text-green-500 mr-2" /> Unlimited access
                                </li>
                                
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full">Get Pro</Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default PricingPage;