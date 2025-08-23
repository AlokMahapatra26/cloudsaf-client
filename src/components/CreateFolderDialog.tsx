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

interface CreateFolderDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (folderName: string) => void;
}

export default function CreateFolderDialog({ isOpen, onClose, onConfirm }: CreateFolderDialogProps) {
    const [folderName, setFolderName] = useState('');

    const handleConfirm = () => {
        if (folderName) {
            onConfirm(folderName);
        }
        setFolderName('');
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Create New Folder</AlertDialogTitle>
                    <AlertDialogDescription>
                        Enter a name for your new folder.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <Input value={folderName} onChange={(e) => setFolderName(e.target.value)} />
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirm}>Create</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}