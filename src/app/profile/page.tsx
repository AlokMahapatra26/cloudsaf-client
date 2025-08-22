"use client"

import StorageIndicator from '@/components/StorageIndicator'
import { LogOut, User } from 'lucide-react'
import React, { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { DriveItem } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

const Profilepage = () => {
    const { user, signOut } = useAuth();
    const [items, setItems] = useState<DriveItem[]>([]);

    const handleSignOut = async () => {
        if (signOut) {
            await signOut();
        }
    };

    if (!user) {
        return (
            <div className="w-full md:w-80 mx-auto">
                <Card className="p-6">
                    <p className="text-zinc-500 dark:text-zinc-400">Loading profile...</p>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex justify-center items-center min-h-screen p-6 bg-white dark:bg-zinc-950">
            <Card className="w-full max-w-md"> {/* Changed max-w-sm to max-w-md */}
                <CardHeader className="flex flex-col items-center justify-center text-center">
                    <div className="p-2 rounded-full border border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400 mb-2">
                        <User className="w-6 h-6" />
                    </div>
                    <CardTitle className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
                        Profile & Storage
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <CardDescription className="text-sm">Email Address</CardDescription>
                        <p className="text-zinc-800 font-medium dark:text-zinc-200">{user.email}</p>
                    </div>
                    <Separator className="bg-zinc-200 dark:bg-zinc-700" />
                    <div>
                        <CardDescription className="text-sm mb-2">Storage Usage</CardDescription>
                        <StorageIndicator refreshTrigger={items.length} />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between gap-2"> {/* Reduced gap to 2 */}
                    <Link href="/pro" passHref className="flex-1"> {/* Added flex-1 */}
                        <Button
                            variant="outline"
                            className="flex cursor-pointer items-center justify-center gap-1 w-full"
                        >
                            <LogOut className="h-4 w-4" /> 
                            <span className="text-sm font-medium ">Upgrad</span>
                        </Button>
                    </Link>
                    <Button
                        onClick={handleSignOut}
                        variant="destructive"
                        className="flex-1 flex items-center justify-center gap-1 w-full cursor-pointer" 
                    >
                        <LogOut className="h-4 w-4" />
                        <span className="text-sm font-medium">Sign Out</span>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};

export default Profilepage;