'use client';

import { useState } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from '@/components/ui/input';

interface ShareDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (email: string) => void;
    itemName: string;
}

export default function ShareDialog({ isOpen, onClose, onConfirm, itemName }: ShareDialogProps) {
    const [email, setEmail] = useState('');

    const handleConfirm = () => {
        if (email) {
            onConfirm(email);
        }
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Share "{itemName}"</AlertDialogTitle>
                    <AlertDialogDescription>
                        Enter the email of the user you want to share with.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <Input type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirm}>Share</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}