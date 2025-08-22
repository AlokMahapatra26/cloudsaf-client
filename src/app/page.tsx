'use client';

import Landing from '@/components/Landing';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import MoveModal from '@/components/MoveModel';
import Dropzone from '@/components/Dropzone';
import StorageIndicator from '@/components/StorageIndicator';
import { getFileIcon, DriveItem } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { FolderPlus, Loader2, Search, Share2, Trash2, UploadCloud, User2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';


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

    const [viewingItem, setViewingItem] = useState<DriveItem | null>(null);
    const [viewingItemUrl, setViewingItemUrl] = useState<string | null>(null);
    const [isViewerLoading, setIsViewerLoading] = useState(false);

    const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
    const [itemToMove, setItemToMove] = useState<DriveItem | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [searchResults, setSearchResults] = useState<DriveItem[] | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!session || searchQuery.trim() === '') {
            setSearchResults(null);
            return;
        }

        const fetchSearchResults = async () => {
            try {
                const response = await fetch(`http://localhost:8000/api/files/search?query=${searchQuery}`, {
                    headers: { 'Authorization': `Bearer ${session.access_token}` },
                });
                if (!response.ok) throw new Error('Failed to fetch search results');
                const data = await response.json();


                const uniqueResults = data.filter((v: DriveItem, i: number, a: DriveItem[]) => a.findIndex(t => (t.id === v.id)) === i);
                setSearchResults(uniqueResults);

            } catch (error) {
                console.error("Search error:", error);
                setSearchResults([]);
            }
        };

        const timer = setTimeout(fetchSearchResults, 500);
        return () => clearTimeout(timer);
    }, [searchQuery, session]);



    const handleMoveClick = () => {
        if (!contextMenu.item) return;
        setItemToMove(contextMenu.item);
        setIsMoveModalOpen(true);
        resetContextMenu();
    };

    const handleMoveConfirm = async (destinationFolderId: string | null) => {
        if (!itemToMove || !session) return;

        try {
            await fetch(`http://localhost:8000/api/files/${itemToMove.id}/move`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
                body: JSON.stringify({ destinationFolderId }),
            });
            // Refresh the file list after moving
            await fetchItems(currentFolderId);
        } catch (error) {
            console.error("Failed to move item:", error);
            alert("Failed to move item.");
        } finally {
            setIsMoveModalOpen(false);
            setItemToMove(null);
        }
    };


    useEffect(() => {
        if (!viewingItem || !session) return;

        const fetchFileUrl = async () => {
            setIsViewerLoading(true);
            setViewingItemUrl(null);
            try {
                const response = await fetch(`http://localhost:8000/api/files/${viewingItem.id}/download`, {
                    headers: { 'Authorization': `Bearer ${session.access_token}` },
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error);
                setViewingItemUrl(data.downloadUrl);
            } catch (error) {
                console.error("Failed to fetch file URL:", error);
                alert('Could not load file for preview.');
                setViewingItem(null); // Close viewer on error
            } finally {
                setIsViewerLoading(false);
            }
        };

        fetchFileUrl();
    }, [viewingItem, session]);

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
            const response = await fetch('http://localhost:8000/api/files/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${session.access_token}` },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'An unknown error occurred');
            }

            await fetchItems(currentFolderId);
        } catch (error) { console.error(error); alert(`Upload failed: ${error instanceof Error ? error.message : String(error)}`); }
        finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
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
            resetContextMenu();
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
            resetContextMenu();
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
            resetContextMenu();
        }
    };


    const handleItemClick = (item: DriveItem) => {
        if (item.type === 'folder') {
            setBreadcrumbs([...breadcrumbs, { id: item.id, name: item.name }]);
            setCurrentFolderId(item.id);
            setSearchQuery('');
            setSearchResults(null);
        } else {
            setViewingItem(item);
        }
    };

    const refreshItems = () => {
        fetchItems(currentFolderId);
    };



    if (!user) {
        return (
            <Landing />
        );
    }

    return (

        <div className="min-h-screen" onClick={() => setContextMenu({ ...contextMenu, visible: false })}>

            <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80 p-4 flex justify-between items-center transition-colors duration-300">

                <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">CloudSAF</h1>
                </div>

                {/* Mobile Search Icon */}
                <div className="md:hidden flex items-center gap-2">
                    {!isSearchExpanded && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsSearchExpanded(true)}
                            className="text-zinc-600 dark:text-zinc-400 border"
                        >
                            <Search className="h-5 w-8 "  />
                        </Button>
                    )}
                </div>

                {/* Expanded Search Bar (Mobile & Desktop) */}
                <div
                    className={`flex-1 md:flex-none md:max-w-lg transition-all duration-300 ${isSearchExpanded ? 'absolute inset-x-0 mx-4 md:static md:mx-auto' : 'hidden md:block'}`}
                >
                    <div className="relative flex items-center">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-500 " />
                        <Input
                            type="text"
                            placeholder="Search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 bg-zinc-100 dark:bg-zinc-800 border-none focus:bg-white dark:focus:bg-zinc-950 "
                            onBlur={() => setIsSearchExpanded(false)}
                        />
                        {isSearchExpanded && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsSearchExpanded(false)}
                                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 text-zinc-600 dark:text-zinc-400"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Right-side elements */}
                <div className="flex items-center gap-4">
                   
                    <div className="hidden sm:block">
                        <StorageIndicator refreshTrigger={items.length} />
                    </div>
                    {/* User Profile Button */}
                    <Link href={"/profile"}>
                        <Button variant="ghost" size="icon" className="h-9 w-9 border">
                            <User2 className="h-5 w-5" />
                        </Button>
                    </Link>
                </div>
            </header>

            <main className="p-8">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
                    {/* Breadcrumbs Section */}
                    <nav className="flex items-center text-sm font-medium overflow-x-auto whitespace-nowrap">
                        {breadcrumbs.map((crumb, index) => (
                            <div key={crumb.id || 'root'} className="flex items-center">
                                {index > 0 && <span className="mx-2 text-zinc-400 dark:text-zinc-600">/</span>}
                                <button
                                    onClick={() => handleBreadcrumbClick(index)}
                                    className={`hover:underline transition-colors ${index === breadcrumbs.length - 1 ? 'text-zinc-800 font-semibold dark:text-zinc-200' : 'text-zinc-500 dark:text-zinc-400'}`}
                                >
                                    {crumb.name}
                                </button>
                            </div>
                        ))}
                    </nav>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        <Button asChild variant="ghost" className='cursor-pointer'>
                            <Link href="/shared" className="flex items-center gap-2">
                                <Share2 className="h-4 w-4" />
                                <span className="hidden sm:inline">Shared with me</span>
                            </Link>
                        </Button>
                        <Button asChild variant="ghost" className='cursor-pointer'>
                            <Link href="/trash" className="flex items-center gap-2">
                                <Trash2 className="h-4 w-4" />
                                <span className="hidden sm:inline">Trash</span>
                            </Link>
                        </Button>
                        <Button onClick={handleCreateFolder} variant="outline" className='cursor-pointer flex items-center gap-2'>
                            <FolderPlus className="h-4 w-4" />
                            <span className="hidden sm:inline">Create Folder</span>
                        </Button>
                        <Button onClick={handleUploadClick} disabled={isUploading} variant="outline" className='cursor-pointer flex items-center gap-2'>
                            {isUploading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span className="hidden sm:inline">Uploading...</span>
                                </>
                            ) : (
                                <>
                                    <UploadCloud className="h-4 w-4" />
                                    <span className="hidden sm:inline">Upload File</span>
                                </>
                            )}
                        </Button>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                    </div>
                </div>


                <div className="grid grid-cols-2 md:grid-cols-6 lg:grid-cols-8 gap-4">
                    {isLoading ? <p>Loading...</p> : (searchQuery && searchResults !== null) ? (

                        searchResults.length > 0 ? (
                            searchResults.map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => handleItemClick(item)}
                                    onContextMenu={(e) => handleContextMenu(e, item)}
                                    className="flex flex-col items-center justify-center p-4 bg-white rounded-lg shadow cursor-pointer hover:bg-blue-50"
                                >
                                    {getFileIcon(item)}
                                    <span className="text-sm text-center truncate w-full">{item.name}</span>
                                </div>
                            ))
                        ) : (<p>No files found matching your search.</p>)
                    ) : (

                        items.length > 0 ? (
                            items.map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => handleItemClick(item)}
                                    onContextMenu={(e) => handleContextMenu(e, item)}
                                    className="flex flex-col items-center justify-center p-8  bg-white  border cursor-pointer hover:bg-blue-50 rounded-xl"
                                >
                                    {getFileIcon(item)}
                                    <span className="text-sm text-center truncate w-full">{item.name}</span>
                                </div>
                            ))
                        ) : (<p>This folder is empty.</p>)
                    )}
                </div>

                {contextMenu.visible && (
                    <div
                        style={{ top: contextMenu.y, left: contextMenu.x }}
                        className="absolute bg-white border rounded shadow-lg z-10"
                    >
                        <ul className="py-1">
                            <li onClick={handleMoveClick} className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Move</li>
                            <li onClick={handleShare} className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Share</li>
                            {contextMenu.item?.type === 'file' && (
                                <li onClick={handleDownload} className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Download</li>
                            )}
                            <li onClick={handleRename} className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Rename</li>
                            <li onClick={handleDelete} className="px-4 py-2 hover:bg-red-100 text-red-600 cursor-pointer">Delete</li>
                        </ul>
                    </div>
                )}

                {viewingItem && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
                        onClick={() => setViewingItem(null)} // Close modal on background click
                    >
                        <div className="bg-white p-4 rounded-lg max-w-4xl max-h-[90vh] w-full h-full flex flex-col" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-lg truncate">{viewingItem.name}</h3>
                                <button onClick={() => setViewingItem(null)} className="text-2xl font-bold">&times;</button>
                            </div>
                            <div className="flex-grow flex items-center justify-center">
                                {isViewerLoading ? (
                                    <p>Loading...</p>
                                ) : viewingItemUrl ? (
                                    <>
                                        {viewingItem.mimetype?.startsWith('image/') && (
                                            <img src={viewingItemUrl} alt={viewingItem.name} className="max-w-full max-h-full object-contain" />
                                        )}
                                        {viewingItem.mimetype?.startsWith('video/') && (
                                            <video src={viewingItemUrl} controls className="max-w-full max-h-full"></video>
                                        )}
                                        {viewingItem.mimetype === 'application/pdf' && (
                                            <iframe src={viewingItemUrl} className="w-full h-full"></iframe>
                                        )}
                                        {!viewingItem.mimetype?.startsWith('image/') && !viewingItem.mimetype?.startsWith('video/') && viewingItem.mimetype !== 'application/pdf' && (
                                            <p>Preview is not available for this file type.</p>
                                        )}
                                    </>
                                ) : (
                                    <p>Could not load file.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}



                <Dropzone currentFolderId={currentFolderId} onUploadComplete={refreshItems}>
                    {/* This is the new styled dropzone area */}
                    <div className="flex flex-col items-center justify-center w-full p-10 mt-4 border-2 border-dashed rounded-lg text-center cursor-pointer bg-gray-50 hover:bg-gray-100">
                        {/* Cloud Upload Icon (SVG) */}
                        <svg className="w-12 h-12 text-gray-400 mb-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2" />
                        </svg>

                        <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">Drag and drop files here</span>
                        </p>
                        <p className="text-xs text-gray-500">
                            or use the "Upload File" button
                        </p>
                    </div>
                </Dropzone>

                {isMoveModalOpen && itemToMove && (
                    <MoveModal
                        itemToMove={itemToMove}
                        onClose={() => setIsMoveModalOpen(false)}
                        onMoveConfirm={handleMoveConfirm}
                    />
                )}
            </main>
        </div>

    );
}

