'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getFileIcon , DriveItem} from '@/lib/utils';
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


interface ContextMenu {
    visible: boolean;
    x: number;
    y: number;
    item: DriveItem | null;
}

export default function SharedWithMe() {
    const { session } = useAuth();
    const [items, setItems] = useState<DriveItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [contextMenu, setContextMenu] = useState<ContextMenu>({ visible: false, x: 0, y: 0, item: null });
   
    const [isAlertOpen, setIsAlertOpen] = useState(false);

    const fetchSharedItems = async () => {
        if (!session) return;
        setIsLoading(true);
        try {
            
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/files/shared-with-me`, {
                headers: { 'Authorization': `Bearer ${session.access_token}` },
            });
            if (!response.ok) throw new Error('Failed to fetch shared items');
            const data = await response.json();
            setItems(data);
        } catch (error: any) {
           
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (session) {
            fetchSharedItems();
        }
    }, [session]);

    const handleContextMenu = (event: React.MouseEvent, item: DriveItem) => {
        event.preventDefault();
        setContextMenu({ visible: true, x: event.pageX, y: event.pageY, item: item });
    };

    const handleDownload = async () => {
        if (!contextMenu.item || !session || contextMenu.item.type !== 'file') return;
        
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/files/${contextMenu.item.id}/download`, {
                headers: { 'Authorization': `Bearer ${session.access_token}` },
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);

            const link = document.createElement('a');
            link.href = data.downloadUrl;
            link.download = contextMenu.item.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success("File downloaded successfully");
        } catch (error: any) { 
            
            toast.error(error.message);
        } finally {
            setContextMenu({ visible: false, x: 0, y: 0, item: null });
        }
    };

  
    const handleRemoveConfirm = async () => {
        if (!contextMenu.item || !session) return;
        
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shares/${contextMenu.item.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${session.access_token}` },
            });
            if (!response.ok) throw new Error('Failed to remove share');
            
            await fetchSharedItems();
            toast.success("Item removed successfully");
        } catch (error: any) {
          
            toast.error(error.message);
        } finally {
            setContextMenu({ visible: false, x: 0, y: 0, item: null });
        }
    };

    return (
        <div className="p-8" onClick={() => setContextMenu({ ...contextMenu, visible: false })}>
            <h1 className="text-2xl font-bold mb-6">Shared with me</h1>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {isLoading ? (
                    <p>Loading...</p>
                ) : items.length > 0 ? (
                    items.map((item) => (
                        <div 
                            key={item.id} 
                            onContextMenu={(e) => handleContextMenu(e, item)}
                            className="flex flex-col items-center justify-center p-4 rounded-lg shadow cursor-context-menu"
                        >
                            {getFileIcon(item)}
                            <span className="text-sm text-center truncate w-full">{item.name}</span>
                        </div>
                    ))
                ) : (
                    <p>No items have been shared with you.</p>
                )}
            </div>
            <Link href="/" className="text-blue-600 hover:underline mt-8 inline-block">
                &larr; Back to My Drive
            </Link>
            
            {contextMenu.visible && (
                <div style={{ top: contextMenu.y, left: contextMenu.x }} className="absolute border rounded shadow-lg z-10">
                    <ul>
                        {contextMenu.item?.type === 'file' && (
                            <li onClick={handleDownload} className="px-4 py-2 cursor-pointer bg-card hover:bg-accent">
                                Download
                            </li>
                        )}
                      
                        <li onClick={() => setIsAlertOpen(true)} className="px-4 py-2 text-red-600 cursor-pointer bg-card hover:bg-accent">
                            Remove
                        </li>
                    </ul>
                </div>
            )}

            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will remove "{contextMenu.item?.name}" from your shared files. The owner will still have access to it.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRemoveConfirm}>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}