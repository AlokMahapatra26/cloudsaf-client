'use client';

import Landing from '@/components/Landing';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

// Define a type for our file/folder items
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

    // Function to fetch files and folders
    const fetchItems = async (folderId: string | null) => {
        if (!session) return;

        setIsLoading(true);
        // Append parentId as a query parameter if it exists
        const url = folderId
            ? `http://localhost:8000/api/files?parentId=${folderId}`
            : 'http://localhost:8000/api/files';

        try {
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                },
            });
            if (!response.ok) throw new Error('Failed to fetch items');
            const data = await response.json();
            setItems(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };


    // Fetch items whenever the current folder changes
    useEffect(() => {
        if (session) {
            fetchItems(currentFolderId);
        }
    }, [session, currentFolderId]);

    // Close context menu when clicking elsewhere
    useEffect(() => {
        const handleClick = () => setContextMenu({ ...contextMenu, visible: false });
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, [contextMenu]);

    // Function to handle new folder creation
    const handleCreateFolder = async () => {
        if (!session) return;
        const folderName = prompt('Enter new folder name:');
        if (!folderName) return;

        try {
            await fetch('http://localhost:8000/api/files/folder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
                body: JSON.stringify({ name: folderName, parent_id: currentFolderId }), // Pass current folder ID
            });
            await fetchItems(currentFolderId); // Refresh current folder
        } catch (error) { console.error(error); }
    };

    // Function to trigger the hidden file input
    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };


    // Function to handle the actual file upload
    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!session || !event.target.files || event.target.files.length === 0) return;
        const file = event.target.files[0];
        const formData = new FormData();
        formData.append('file', file);
        if (currentFolderId) {
            formData.append('parent_id', currentFolderId); // Pass current folder ID
        }

        setIsUploading(true);
        try {
            await fetch('http://localhost:8000/api/files/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${session.access_token}` },
                body: formData,
            });
            await fetchItems(currentFolderId); // Refresh current folder
        } catch (error) { console.error(error); alert('Upload failed'); }
        finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleFolderDoubleClick = (folder: DriveItem) => {
        // Add the new folder to breadcrumbs
        setBreadcrumbs([...breadcrumbs, { id: folder.id, name: folder.name }]);
        // Set the current folder to the one clicked
        setCurrentFolderId(folder.id);
    };

    // NEW: Handle clicking on a breadcrumb
    const handleBreadcrumbClick = (index: number) => {
        const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
        setBreadcrumbs(newBreadcrumbs);
        setCurrentFolderId(newBreadcrumbs[index].id);
    };


    const handleContextMenu = (event: React.MouseEvent, item: DriveItem) => {
        event.preventDefault();
        setContextMenu({ visible: true, x: event.pageX, y: event.pageY, item: item });
    };

    // NEW: Handle Delete Action
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
        } catch (error) { console.error(error); alert('Failed to delete item.'); }
    };

    // NEW: Handle Rename Action
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
        } catch (error) { console.error(error); alert('Failed to rename item.'); }
    };

    // NEW: Handle Download Action
    const handleDownload = async () => {
        if (!contextMenu.item || !session || contextMenu.item.type !== 'file') return;
        
        try {
            const response = await fetch(`http://localhost:8000/api/files/${contextMenu.item.id}/download`, {
                headers: { 'Authorization': `Bearer ${session.access_token}` },
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);

            // Create a temporary link to trigger the download
            const link = document.createElement('a');
            link.href = data.downloadUrl;
            link.download = contextMenu.item.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) { console.error(error); alert('Failed to download file.'); }
    };


    // This is the login/signup view for non-authenticated users
    if (!user) {
        return (
            <Landing/>
        );
    }

    // This is the main dashboard for authenticated users
    return (
        <div className="min-h-screen bg-gray-100">
            <header className="bg-zinc-900 border-b border-zinc-800 p-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-zinc-100">CloudSAF</h1>

                <div className="flex items-center gap-4">
                    <p className="text-zinc-300">{user.email}</p>

                    <Button
                        onClick={signOut}
                        className="bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
                    >
                        Sign Out
                    </Button>
                </div>
            </header>

            <main className="p-8">
                <div className="mb-6 flex gap-4">
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

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <Button
                            onClick={handleCreateFolder}
                            variant="secondary" // zinc-styled neutral button
                            className="bg-zinc-800 text-zinc-100 hover:bg-zinc-700 cursor-pointer"
                        >
                            + Create Folder
                        </Button>

                        <Button
                            onClick={handleUploadClick}
                            disabled={isUploading}
                            className="bg-zinc-900 text-zinc-100 hover:bg-zinc-800 cursor-pointer"
                        >
                            {isUploading ? "Uploading..." : "↑ Upload File"}
                        </Button>

                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                        />
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
                    ) : (<p>This folder is empty.</p>)}
                </div>

                {/* NEW: Context Menu Component */}
                {contextMenu.visible && (
                    <div
                        style={{ top: contextMenu.y, left: contextMenu.x }}
                        className="absolute bg-white border rounded shadow-lg z-10"
                    >
                        <ul className="py-1">
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

