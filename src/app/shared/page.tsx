'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useEffect, useState } from 'react';

// Updated interface to match what the API provides
interface DriveItem {
    id: string;
    name: string;
    type: 'file' | 'folder';
}

// NEW: Interface for the context menu state
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
    
    // NEW: State to manage the context menu
    const [contextMenu, setContextMenu] = useState<ContextMenu>({ visible: false, x: 0, y: 0, item: null });

    useEffect(() => {
        const fetchSharedItems = async () => {
            if (!session) return;
            setIsLoading(true);
            try {
                const response = await fetch('http://localhost:8000/api/files/shared-with-me', {
                    headers: { 'Authorization': `Bearer ${session.access_token}` },
                });
                if (!response.ok) throw new Error('Failed to fetch shared items');
                const data = await response.json();
                setItems(data);
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };

        if (session) {
            fetchSharedItems();
        }
    }, [session]);

    // NEW: Handle right-clicking on an item
    const handleContextMenu = (event: React.MouseEvent, item: DriveItem) => {
        event.preventDefault();
        setContextMenu({ visible: true, x: event.pageX, y: event.pageY, item: item });
    };

    // NEW: Handle the download action from the context menu
    const handleDownload = async () => {
        if (!contextMenu.item || !session || contextMenu.item.type !== 'file') return;
        
        try {
            const response = await fetch(`http://localhost:8000/api/files/${contextMenu.item.id}/download`, {
                headers: { 'Authorization': `Bearer ${session.access_token}` },
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);

            // Create a temporary link to trigger the browser's download functionality
            const link = document.createElement('a');
            link.href = data.downloadUrl;
            link.download = contextMenu.item.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) { 
            console.error(error); 
            alert('Failed to download file.'); 
        } finally {
            setContextMenu({ visible: false, x: 0, y: 0, item: null }); // Close the menu
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
                            onContextMenu={(e) => handleContextMenu(e, item)} // NEW: Attach context menu event
                            className="flex flex-col items-center justify-center p-4 bg-white rounded-lg shadow cursor-context-menu"
                        >
                            <span className="text-4xl mb-2">{item.type === 'folder' ? '📁' : '📄'}</span>
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

            {/* NEW: Render the context menu when it's visible */}
            {contextMenu.visible && (
                <div
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    className="absolute bg-white border rounded shadow-lg z-10"
                >
                    <ul className="py-1">
                        {contextMenu.item?.type === 'file' && (
                            <li onClick={handleDownload} className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                                Download
                            </li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}