'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

interface DriveItem {
    id: string;
    name: string;
    type: 'file' | 'folder';
}


interface Breadcrumb {
    id: string | null;
    name: string;
}

interface MoveModalProps {
    itemToMove: DriveItem;
    onClose: () => void;
    onMoveConfirm: (destinationFolderId: string | null) => void;
}

export default function MoveModal({ itemToMove, onClose, onMoveConfirm }: MoveModalProps) {
    const { session } = useAuth();
    const [folders, setFolders] = useState<DriveItem[]>([]);
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    
    
    const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([{ id: null, name: 'My Drive' }]);

    const fetchFolders = async (folderId: string | null) => {
        if (!session) return;
        const url = folderId
            ? `${process.env.NEXT_PUBLIC_API_URL}/api/files?parentId=${folderId}`
            : `${process.env.NEXT_PUBLIC_API_URL}/api/files`;
        
        try {
            const response = await fetch(url, { headers: { 'Authorization': `Bearer ${session.access_token}` } });
            const data = await response.json();
            setFolders(data.filter((item: DriveItem) => item.type === 'folder'));
        } catch (error) {
            console.error("Failed to fetch folders:", error);
        }
    };

    useEffect(() => {
        fetchFolders(currentFolderId);
    }, [currentFolderId, session]);

    const handleFolderClick = (folder: DriveItem) => {
        setCurrentFolderId(folder.id);
        setBreadcrumbs([...breadcrumbs, { id: folder.id, name: folder.name }]);
    };

    const handleBreadcrumbClick = (index: number) => {
        setCurrentFolderId(breadcrumbs[index].id);
        setBreadcrumbs(breadcrumbs.slice(0, index + 1));
    };

    return (
        <div className="fixed inset-0 bg-accent bg-opacity-50 flex items-center justify-center z-50">
            <div className=" rounded-lg w-full max-w-lg p-6">
                <h2 className="text-xl font-bold mb-4">Move "{itemToMove.name}"</h2>
                
                <div className="flex items-center text-sm mb-4 border-b pb-2">
                    {breadcrumbs.map((crumb, index) => (
                        <div key={crumb.id || 'root'} className="flex items-center">
                            {index > 0 && <span className="mx-2 text-gray-400">/</span>}
                            <button onClick={() => handleBreadcrumbClick(index)} className="hover:underline">
                                {crumb.name}
                            </button>
                        </div>
                    ))}
                </div>

                <div className="h-64 overflow-y-auto">
                    {folders.length > 0 ? (
                        folders.map(folder => (
                            <div key={folder.id} onClick={() => handleFolderClick(folder)} className="p-2 hover:bg-card rounded cursor-pointer flex items-center gap-2">
                                <span>📁</span> {folder.name}
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500">No subfolders</p>
                    )}
                </div>

                <div className="flex justify-end gap-4 mt-6">
                    <button onClick={onClose} className="px-4 py-2 bg-accent rounded">Cancel</button>
                    <button onClick={() => onMoveConfirm(currentFolderId)} className="px-4 py-2 bg-blue-500 text-white rounded cursor-pointer">Move Here</button>
                </div>
            </div>
        </div>
    );
}