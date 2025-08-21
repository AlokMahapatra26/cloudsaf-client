'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';

interface DriveItem {
    id: string;
    name: string;
    type: 'file' | 'folder';
    parent_id: string | null;
    storage_path: string | null;
}

interface Breadcrumb {
    id: string | null;
    name: string;
}

interface ContextMenu {
    visible: boolean;
    x: number;
    y: number;
    item: DriveItem | null;
}

export default function Home() {
    const { user, session, signOut } = useAuth();
    const [items, setItems] = useState<DriveItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([{ id: null, name: 'My Drive' }]);

    const [contextMenu, setContextMenu] = useState<ContextMenu>({ visible: false, x: 0, y: 0, item: null });

    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchItems = async (folderId: string | null) => {
        if (!session) return;
        setIsLoading(true);
        const url = folderId ? `http://localhost:8000/api/files?parentId=${folderId}` : 'http://localhost:8000/api/files';
        try {
            const response = await fetch(url, { headers: { 'Authorization': `Bearer ${session.access_token}` } });
            if (!response.ok) throw new Error('Failed to fetch items');
            const data = await response.json();
            setItems(data);
        } catch (error) { console.error(error); } 
        finally { setIsLoading(false); }
    };

    useEffect(() => {
        if (session) fetchItems(currentFolderId);
    }, [session, currentFolderId]);

    useEffect(() => {
        const handleClick = () => setContextMenu({ ...contextMenu, visible: false });
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, [contextMenu]);

    const handleCreateFolder = async () => {
        if (!session) return;
        const folderName = prompt('Enter new folder name:');
        if (!folderName) return;

        try {
            await fetch('http://localhost:8000/api/files/folder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
                body: JSON.stringify({ name: folderName, parent_id: currentFolderId }),
            });
            await fetchItems(currentFolderId);
        } catch (error) { console.error(error); }
    };
    
    const handleUploadClick = () => fileInputRef.current?.click();

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!session || !event.target.files || event.target.files.length === 0) return;
        const file = event.target.files[0];
        const formData = new FormData();
        formData.append('file', file);
        if (currentFolderId) {
            formData.append('parent_id', currentFolderId);
        }

        setIsUploading(true);
        try {
            await fetch('http://localhost:8000/api/files/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${session.access_token}` },
                body: formData,
            });
            await fetchItems(currentFolderId);
        } catch (error) { console.error(error); alert('Upload failed'); } 
        finally {
            setIsUploading(false);
            if(fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleFolderDoubleClick = (folder: DriveItem) => {
        setBreadcrumbs([...breadcrumbs, { id: folder.id, name: folder.name }]);
        setCurrentFolderId(folder.id);
    };

    const handleBreadcrumbClick = (index: number) => {
        const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
        setBreadcrumbs(newBreadcrumbs);
        setCurrentFolderId(newBreadcrumbs[index].id);
    };
    

    const handleContextMenu = (event: React.MouseEvent, item: DriveItem) => {
        event.preventDefault();
        setContextMenu({ visible: true, x: event.pageX, y: event.pageY, item: item });
    };

    // FIX: Resetting the state after action completes
    const resetContextMenu = () => {
        setContextMenu({ visible: false, x: 0, y: 0, item: null });
    };

    const handleShare = async () => {
        if (!contextMenu.item || !session) return;
        
        const email = prompt(`Enter the email of the user you want to share "${contextMenu.item.name}" with:`);
        if (!email) return;

        try {
            const response = await fetch(`http://localhost:8000/api/files/${contextMenu.item.id}/share`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
                body: JSON.stringify({ email }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to share item.');
            
            alert('Item shared successfully!');
        } catch (error) {
            console.error(error);
            alert(`Error: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            resetContextMenu(); // FIX: Reset state here
        }
    };

    const handleDelete = async () => {
        if (!contextMenu.item || !session) return;
        const confirmDelete = window.confirm(`Are you sure you want to delete "${contextMenu.item.name}"?`);
        if (!confirmDelete) return;

        try {
            await fetch(`http://localhost:8000/api/files/${contextMenu.item.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${session.access_token}` },
            });
            await fetchItems(currentFolderId);
        } catch (error) { console.error(error); alert('Failed to delete item.'); } finally {
            resetContextMenu(); // FIX: Reset state here
        }
    };

    const handleRename = async () => {
        if (!contextMenu.item || !session) return;
        const newName = prompt(`Enter new name for "${contextMenu.item.name}":`, contextMenu.item.name);
        if (!newName || newName === contextMenu.item.name) return;

        try {
            await fetch(`http://localhost:8000/api/files/${contextMenu.item.id}/rename`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
                body: JSON.stringify({ newName }),
            });
            await fetchItems(currentFolderId);
        } catch (error) { console.error(error); alert('Failed to rename item.'); } finally {
            resetContextMenu(); // FIX: Reset state here
        }
    };

    const handleDownload = async () => {
        if (!contextMenu.item || !session || contextMenu.item.type !== 'file') return;
        
        try {
            const response = await fetch(`http://localhost:8000/api/files/${contextMenu.item.id}/download`, {
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
        } catch (error) { console.error(error); alert('Failed to download file.'); } finally {
            resetContextMenu(); // FIX: Reset state here
        }
    };

    if (!user) {
        return (
            <main className="flex flex-col items-center justify-center min-h-screen p-24">
                <h1 className="text-4xl font-bold mb-8">Welcome to Your Drive</h1>
                <div className="text-center">
                    <p>Please sign in to continue.</p>
                    <div className="mt-4 space-x-4">
                        <Link href="/signin" className="px-4 py-2 font-bold text-white bg-green-500 rounded hover:bg-green-700">Sign In</Link>
                        <Link href="/signup" className="px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700">Sign Up</Link>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100" onClick={() => setContextMenu({ ...contextMenu, visible: false })}>
            <header className="bg-white shadow-sm p-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold">My Drive</h1>
                <div className="flex items-center gap-4">
                    <p>{user.email}</p>
                    <button onClick={signOut} className="px-4 py-2 font-bold text-white bg-red-500 rounded hover:bg-red-700">Sign Out</button>
                </div>
            </header>
            
            <main className="p-8">
                <div className="flex justify-between items-center mb-6">
                    <nav className="flex items-center text-sm font-medium">
                        {breadcrumbs.map((crumb, index) => (
                            <div key={crumb.id || 'root'} className="flex items-center">
                                {index > 0 && <span className="mx-2 text-gray-400">/</span>}
                                <button
                                    onClick={() => handleBreadcrumbClick(index)}
                                    className={`hover:underline ${index === breadcrumbs.length - 1 ? 'text-gray-800 font-semibold' : 'text-blue-600'}`}
                                >
                                    {crumb.name}
                                </button>
                            </div>
                        ))}
                    </nav>

                    <div className="flex gap-4">
                        <Link href="/shared" className="text-blue-600 hover:underline">
                            Shared with me
                        </Link>
                        <button onClick={handleCreateFolder} className="px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700">+ Create Folder</button>
                        <button onClick={handleUploadClick} disabled={isUploading} className="px-4 py-2 font-bold text-white bg-green-500 rounded hover:bg-green-700 disabled:bg-gray-400">
                            {isUploading ? 'Uploading...' : '↑ Upload File'}
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {isLoading ? <p>Loading...</p> : items.length > 0 ? (
                        items.map((item) => (
                            <div 
                                key={item.id}
                                onDoubleClick={item.type === 'folder' ? () => handleFolderDoubleClick(item) : undefined}
                                onContextMenu={(e) => handleContextMenu(e, item)}
                                className={`flex flex-col items-center justify-center p-4 bg-white rounded-lg shadow ${item.type === 'folder' ? 'cursor-pointer hover:bg-blue-50' : ''}`}
                            >
                                <span className="text-4xl mb-2">{item.type === 'folder' ? '📁' : '📄'}</span>
                                <span className="text-sm text-center truncate w-full">{item.name}</span>
                            </div>
                        ))
                    ) : ( <p>This folder is empty.</p> )}
                </div>

                {contextMenu.visible && (
                    <div
                        style={{ top: contextMenu.y, left: contextMenu.x }}
                        className="absolute bg-white border rounded shadow-lg z-10"
                    >
                        <ul className="py-1">
                            <li onClick={handleShare} className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Share</li>
                            {contextMenu.item?.type === 'file' && (
                                <li onClick={handleDownload} className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Download</li>
                            )}
                            <li onClick={handleRename} className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Rename</li>
                            <li onClick={handleDelete} className="px-4 py-2 hover:bg-red-100 text-red-600 cursor-pointer">Delete</li>
                        </ul>
                    </div>
                )}
            </main>
        </div>
    );
}