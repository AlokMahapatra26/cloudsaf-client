'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getFileIcon } from '@/lib/utils';

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

    const fetchTrashedItems = async () => {
        if (!session) return;
        setIsLoading(true);
        try {
            const response = await fetch('http://localhost:8000/api/files/trashed', {
                headers: { 'Authorization': `Bearer ${session.access_token}` },
            });
            if (!response.ok) throw new Error('Failed to fetch trashed items');
            const data = await response.json();
            setItems(data);
        } catch (error) { console.error(error); } 
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
        if (!contextMenu.item) return;
        await fetch(`http://localhost:8000/api/files/${contextMenu.item.id}/restore`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${session?.access_token}` },
        });
        fetchTrashedItems(); // Refresh list
    };
    
    const handleDeletePermanent = async () => {
        if (!contextMenu.item) return;
        const confirmDelete = window.confirm("This action is permanent and cannot be undone. Are you sure?");
        if (!confirmDelete) return;
        
        await fetch(`http://localhost:8000/api/files/${contextMenu.item.id}/permanent`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${session?.access_token}` },
        });
        fetchTrashedItems(); // Refresh list
    };

    return (
        <div className="p-8" onClick={() => setContextMenu({ ...contextMenu, visible: false })}>
            <h1 className="text-2xl font-bold mb-6">Trash</h1>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {isLoading ? <p>Loading...</p> : items.length > 0 ? (
                    items.map((item) => (
                        <div key={item.id} onContextMenu={(e) => handleContextMenu(e, item)} className="...">
                            {getFileIcon(item)}
                            <span>{item.name}</span>
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
                        <li onClick={handleRestore} className="px-4 py-2  cursor-pointer hover:bg-accent">Restore</li>
                        <li onClick={handleDeletePermanent} className="px-4 py-2  text-red-600 cursor-pointe hover:bg-accent">Delete Permanently</li>
                    </ul>
                </div>
            )}
        </div>
    );
}