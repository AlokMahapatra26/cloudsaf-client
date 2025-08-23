'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getFileIcon } from '@/lib/utils';
import { toast } from 'sonner';
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


// ✅ UPDATED: Interface to be consistent
interface DriveItem {
    id: string;
    name: string;
    type: 'file' | 'folder';
    parent_id: string | null;
    storage_path: string | null;
    mimetype: string | null;
}


interface ContextMenu {
    visible: boolean;
    x: number;
    y: number;
    item: DriveItem | null;
}


export default function TrashPage() {
    const { session } = useAuth();
    const [items, setItems] = useState<DriveItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [contextMenu, setContextMenu] = useState<ContextMenu>({ visible: false, x: 0, y: 0, item: null });
    const [isAlertOpen, setIsAlertOpen] = useState(false);

    const fetchTrashedItems = async () => {
        if (!session) return;
        setIsLoading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/files/trashed`, {
                headers: { 'Authorization': `Bearer ${session.access_token}` },
            });
            if (!response.ok) throw new Error('Failed to fetch trashed items');
            const data = await response.json();
            setItems(data);
        } catch (error: any) { 
            toast.error(error.message);
        }
        finally { setIsLoading(false); }
    };

    useEffect(() => {
        if (session) fetchTrashedItems();
    }, [session]);

    const handleContextMenu = (event: React.MouseEvent, item: DriveItem) => {
        event.preventDefault();
        setContextMenu({ visible: true, x: event.pageX, y: event.pageY, item });
    };

    const handleRestore = async () => {
        if (!contextMenu.item || !session) return;
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/files/${contextMenu.item.id}/restore`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${session.access_token}` },
            });
            if (!response.ok) throw new Error('Failed to restore item');
            toast.success("Item restored successfully");
            fetchTrashedItems(); // Refresh list
        } catch (error: any) {
            toast.error(error.message);
        }
    };
    
    // ✅ UPDATED: This is now called when the user confirms the action
    const handleDeleteConfirm = async () => {
        if (!contextMenu.item || !session) return;
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/files/${contextMenu.item.id}/permanent`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${session.access_token}` },
            });
            toast.success("Item permanently deleted");
            fetchTrashedItems(); // Refresh list
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    return (
        <div className="p-8" onClick={() => setContextMenu({ ...contextMenu, visible: false })}>
            <h1 className="text-2xl font-bold mb-6">Trash</h1>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {isLoading ? <p>Loading...</p> : items.length > 0 ? (
                    items.map((item) => (
                        <div key={item.id} onContextMenu={(e) => handleContextMenu(e, item)} className="flex flex-col items-center justify-center p-4 rounded-lg shadow cursor-context-menu">
                            {getFileIcon(item)}
                            <span className="text-sm text-center truncate w-full">{item.name}</span>
                        </div>
                    ))
                ) : (
                    <p>Trash is empty.</p>
                )}
            </div>
            <Link href="/" className="text-blue-600 hover:underline mt-8 inline-block">
                &larr; Back to My Drive
            </Link>

            {contextMenu.visible && (
                <div style={{ top: contextMenu.y, left: contextMenu.x }} className="absolute bg-card border rounded shadow-lg z-10">
                    <ul className="py-1">
                        <li onClick={handleRestore} className="px-4 py-2 cursor-pointer hover:bg-accent">Restore</li>
                        {/* ✅ UPDATED: This now opens the dialog */}
                        <li onClick={() => setIsAlertOpen(true)} className="px-4 py-2 text-red-600 cursor-pointer hover:bg-accent">Delete Permanently</li>
                    </ul>
                </div>
            )}

            {/* ✅ NEW: Add the AlertDialog component for permanent deletion */}
            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action is permanent and cannot be undone. This will permanently delete "{contextMenu.item?.name}".
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}