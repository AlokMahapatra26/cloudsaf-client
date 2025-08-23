'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useEffect, useState, useRef, useCallback } from 'react';
import MoveModal from '@/components/MoveModel';
import Dropzone from '@/components/Dropzone';
import StorageIndicator from '@/components/StorageIndicator';
import RenameDialog from '@/components/RenameDialog';
import ShareDialog from '@/components/ShareDialog';
import CreateFolderDialog from '@/components/CreateFolderDialog';
import { getFileIcon, DriveItem, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { FolderPlus, Loader2, Search, Share2, Trash2, UploadCloud, User2, X, MoreVertical, Move, Download, FilePenLine } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ModeToggle } from '@/components/ModeToggle';
import { toast } from 'sonner';
import Landing from '@/components/Landing';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";


// Interface for the breadcrumb navigation state
interface Breadcrumb {
    id: string | null;
    name: string;
}

export default function Home() {
    // Authentication hook to get user, session, and sign-out function
    const { user, session} = useAuth();

    // State variables to manage UI and data
    const [items, setItems] = useState<DriveItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([{ id: null, name: 'My Drive' }]);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [viewingItem, setViewingItem] = useState<DriveItem | null>(null);
    const [viewingItemUrl, setViewingItemUrl] = useState<string | null>(null);
    const [isViewerLoading, setIsViewerLoading] = useState(false);
    const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
    const [itemToMove, setItemToMove] = useState<DriveItem | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [searchResults, setSearchResults] = useState<DriveItem[] | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // State for various dialogs and the item they are operating on
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
    const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
    const [isCreateFolderDialogOpen, setIsCreateFolderDialogOpen] = useState(false);
    const [dialogItem, setDialogItem] = useState<DriveItem | null>(null);

    // useCallback hook to memoize the onDrop function for the Dropzone component
    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (!session) return;

        acceptedFiles.forEach(async (file) => {
            const formData = new FormData();
            formData.append('file', file);
            if (currentFolderId) {
                formData.append('parent_id', currentFolderId);
            }
            setIsUploading(true);
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/files/upload`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${session.access_token}` },
                    body: formData,
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'An unknown error occurred');
                }
                toast.success(`File uploaded: ${file.name}`);
            } catch (error: any) {
                toast.error(`Upload failed for ${file.name}: ${error.message}`);
            } finally {
                setIsUploading(false);
                fetchItems(currentFolderId);
            }
        });
    }, [session, currentFolderId]);

    // Handles file upload from the file input field
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
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/files/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${session.access_token}` },
                body: formData,
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'An unknown error occurred');
            }
            toast.success("File uploaded successfully!");
            await fetchItems(currentFolderId);
        } catch (error: any) {
            toast.error(`Upload failed: ${error.message}`);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    // Fetches items (files and folders) from the API for the current folder
    const fetchItems = async (folderId: string | null) => {
        if (!session) return;
        setIsLoading(true);
        const url = folderId ? `${process.env.NEXT_PUBLIC_API_URL}/api/files?parentId=${folderId}` : `${process.env.NEXT_PUBLIC_API_URL}/api/files`;
        try {
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch items');
            }
            const data = await response.json();
            setItems(data);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // useEffect hook to fetch items when the session or current folder ID changes
    useEffect(() => {
        if (session) {
            fetchItems(currentFolderId);
        }
    }, [session, currentFolderId]);

    // useEffect hook to fetch a file's public URL for previewing
    useEffect(() => {
        if (!viewingItem || !session) return;

        const fetchFileUrl = async () => {
            setIsViewerLoading(true);
            setViewingItemUrl(null);
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/files/${viewingItem.id}/download`, {
                    headers: { 'Authorization': `Bearer ${session.access_token}` },
                });
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.error || "Could not get file URL.");
                }
                setViewingItemUrl(data.downloadUrl);
            } catch (error: any) {
                toast.error(error.message);
                setViewingItem(null);
            } finally {
                setIsViewerLoading(false);
            }
        };
        fetchFileUrl();
    }, [viewingItem, session]);

    // Handles clicks on files and folders
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

    // Handles clicks on the breadcrumb navigation links
    const handleBreadcrumbClick = (index: number) => {
        const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
        setBreadcrumbs(newBreadcrumbs);
        setCurrentFolderId(newBreadcrumbs[index].id);
    };

    // Triggers the hidden file input
    const handleUploadClick = () => fileInputRef.current?.click();

    // Handles creating a new folder
    const handleCreateFolderClick = () => {
        setIsCreateFolderDialogOpen(true);
    };

    const handleCreateFolderConfirm = async (folderName: string) => {
        if (!session || !folderName) return;
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/files/folder`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
                body: JSON.stringify({ name: folderName, parent_id: currentFolderId }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'An unknown error occurred');
            }
            toast.success("Folder created successfully!");
            await fetchItems(currentFolderId);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsCreateFolderDialogOpen(false);
        }
    };

    // Handles moving an item
    const handleMoveConfirm = async (destinationFolderId: string | null) => {
        if (!itemToMove || !session) return;
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/files/${itemToMove.id}/move`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
                body: JSON.stringify({ destinationFolderId }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to move item.');
            }
            toast.success("Item moved successfully!");
            await fetchItems(currentFolderId);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsMoveModalOpen(false);
            setItemToMove(null);
        }
    };

    // Handles sharing an item
    const handleShareConfirm = async (email: string) => {
        if (!dialogItem || !session) return;
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/files/${dialogItem.id}/share`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
                body: JSON.stringify({ email }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to share item.');
            }
            toast.success("Item shared successfully!");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsShareDialogOpen(false);
            setDialogItem(null);
        }
    };

    // Handles renaming an item
    const handleRenameConfirm = async (newName: string) => {
        if (!dialogItem || !session) return;
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/files/${dialogItem.id}/rename`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
                body: JSON.stringify({ newName }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to rename item.');
            }
            toast.success("Item renamed successfully!");
            await fetchItems(currentFolderId);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsRenameDialogOpen(false);
            setDialogItem(null);
        }
    };

    // Handles deleting an item
    const handleDeleteConfirm = async () => {
        if (!dialogItem || !session) return;
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/files/${dialogItem.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${session.access_token}` },
            });
            toast.success("Item moved to trash.");
            await fetchItems(currentFolderId);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsDeleteDialogOpen(false);
            setDialogItem(null);
        }
    };

    // Function to re-fetch items, useful for refreshing the view
    const refreshItems = () => {
        fetchItems(currentFolderId);
    };

    // New function to handle the click on the options icon
    const handleOptionsClick = (e: React.MouseEvent, item: DriveItem) => {
        e.stopPropagation(); // Prevents the file/folder from opening
        setOpenMenuId(prevId => (prevId === item.id ? null : item.id)); // Toggles the menu
    };

    // New function to handle the download action from the dropdown menu
    const handleDownloadClick = async (item: DriveItem) => {
        if (!session || item.type !== 'file') return;
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/files/${item.id}/download`, {
                headers: { 'Authorization': `Bearer ${session.access_token}` },
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Download failed.");
            const link = document.createElement('a');
            link.href = data.downloadUrl;
            link.download = item.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success("Download started.");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setOpenMenuId(null); // Close the menu after initiating download
        }
    };
    
    // useEffect hook with debounce for search functionality
    useEffect(() => {
        if (!session || searchQuery.trim() === '') {
            setSearchResults(null);
            return;
        }

        const fetchSearchResults = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/files/search?query=${searchQuery}`, {
                    headers: { 'Authorization': `Bearer ${session.access_token}` },
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch search results');
                }
                const data = await response.json();
                console.log("Search API Response:", data); 
                const uniqueResults = data.filter((v: DriveItem, i: number, a: DriveItem[]) => a.findIndex(t => (t.id === v.id)) === i);
                setSearchResults(uniqueResults);
            } catch (error: any) {
                toast.error(error.message);
                setSearchResults([]);
            }
        };

        const timer = setTimeout(fetchSearchResults, 500); // Debounce search request
        return () => clearTimeout(timer);
    }, [searchQuery, session]);

    // If no user is logged in, show the landing page
    if (!user) {
        return <Landing />;
    }

    // Main component rendering
    return (
        <div className="min-h-screen">

            {/* Header section with branding, search, and user controls */}
            <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80 p-4 flex justify-between items-center transition-colors duration-300">
                <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">CloudSAF</h1>
                </div>
                <div className="md:hidden flex items-center gap-2">
                    {!isSearchExpanded && (
                        <Button variant="ghost" size="icon" onClick={() => setIsSearchExpanded(true)} className="text-zinc-600 dark:text-zinc-400 border">
                            <Search className="h-5 w-8 " />
                        </Button>
                    )}
                </div>
                <div className={`flex-1 md:flex-none md:max-w-lg transition-all duration-300 ${isSearchExpanded ? 'absolute inset-x-0 mx-4 md:static md:mx-auto' : 'hidden md:block'}`}>
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
                            <Button variant="ghost" size="icon" onClick={() => setIsSearchExpanded(false)} className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 text-zinc-600 dark:text-zinc-400">
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden sm:block">
                        <StorageIndicator refreshTrigger={items.length} />
                    </div>
                    <ModeToggle />
                    <Link href={"/profile"}>
                        <Button variant="ghost" size="icon" className="h-9 w-9 border">
                            <User2 className="h-5 w-5" />
                        </Button>
                    </Link>
                </div>
            </header>

            {/* Main content area */}
            <main className="p-8">
                {/* Action bar with breadcrumbs and buttons */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
                    <nav className="flex items-center text-sm font-medium overflow-x-auto whitespace-nowrap">
                        {breadcrumbs.map((crumb, index) => (
                            <div key={crumb.id || 'root'} className="flex items-center">
                                {index > 0 && <span className="mx-2 text-zinc-400 dark:text-zinc-600">/</span>}
                                <button
                                    onClick={() => handleBreadcrumbClick(index)}
                                    className={`hover:bg-accent rounded p-0.5 cursor-pointer transition-colors ${index === breadcrumbs.length - 1 ? 'text-zinc-800 font-semibold dark:text-zinc-200' : 'text-zinc-500 dark:text-zinc-400'}`}
                                >
                                    {crumb.name}
                                </button>
                            </div>
                        ))}
                    </nav>
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
                        <Button onClick={handleCreateFolderClick} variant="outline" className='cursor-pointer flex items-center gap-2'>
                            <FolderPlus className="h-4 w-4" />
                            <span className="hidden sm:inline">Create Folder</span>
                        </Button>
                        <Button onClick={handleUploadClick} disabled={isUploading} variant="outline" className='cursor-pointer flex items-center gap-2'>
                            {isUploading ? (
                                <><Loader2 className="h-4 w-4 animate-spin" /><span className="hidden sm:inline">Uploading...</span></>
                            ) : (
                                <><UploadCloud className="h-4 w-4" /><span className="hidden sm:inline">Upload File</span></>
                            )}
                        </Button>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                    </div>
                </div>

                {/* Grid display for files and folders with the new options icon */}
                <div className="grid grid-cols-2 md:grid-cols-6 lg:grid-cols-8 gap-4 ">
                    {isLoading ? (
                        <p>Loading...</p>
                    ) : (searchQuery && searchResults !== null) ? (
                        // This block now uses the correct, updated JSX for the search results
                        searchResults.length > 0 ? (
                            searchResults.map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => handleItemClick(item)}
                                    className="relative group flex flex-col items-center justify-center p-4 border cursor-pointer hover:bg-accent rounded-xl "
                                >
                                    {/* Options Icon Button */}
                                    <button
                                        onClick={(e) => handleOptionsClick(e, item)}
                                        className="absolute top-2 right-2 p-1 rounded-full hover:bg-card z-20 opacity-0 group-hover:opacity-100 transition-opacity "
                                    >
                                        <MoreVertical className="h-5 w-5 " />
                                    </button>

                                    {/* Item Icon and Name */}
                                    {getFileIcon(item)}
                                    <span className="text-sm text-center truncate w-full mt-2">{item.name}</span>

                                    {/* Dropdown Menu - Renders inside the item's container */}
                                    {openMenuId === item.id && (
                                        <div
                                            onClick={(e) => e.stopPropagation()}
                                            className="absolute top-10 right-2 w-40 bg-background border rounded shadow-lg z-10 "
                                        >
                                            <ul className="py-1 ">
                                                <li onClick={() => { setItemToMove(item); setIsMoveModalOpen(true); setOpenMenuId(null); }} className="px-4 py-2 cursor-pointer hover:bg-secondary flex items-center gap-2">
                                                    <Move className="h-4 w-4" /> Move
                                                </li>
                                                <li onClick={() => { setDialogItem(item); setIsShareDialogOpen(true); setOpenMenuId(null); }} className="px-4 py-2 cursor-pointer hover:bg-secondary flex items-center gap-2">
                                                    <Share2 className="h-4 w-4" /> Share
                                                </li>
                                                {item.type === 'file' && (
                                                    <li onClick={() => handleDownloadClick(item)} className="px-4 py-2 cursor-pointer hover:bg-secondary flex items-center gap-2">
                                                        <Download className="h-4 w-4" /> Download
                                                    </li>
                                                )}
                                                <li onClick={() => { setDialogItem(item); setIsRenameDialogOpen(true); setOpenMenuId(null); }} className="px-4 py-2 cursor-pointer hover:bg-secondary flex items-center gap-2">
                                                    <FilePenLine className="h-4 w-4" /> Rename
                                                </li>
                                                <li onClick={() => { setDialogItem(item); setIsDeleteDialogOpen(true); setOpenMenuId(null); }} className="px-4 py-2 text-red-600 cursor-pointer hover:bg-secondary flex items-center gap-2">
                                                    <Trash2 className="h-4 w-4" /> Delete
                                                </li>
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p>No files found matching your search.</p>
                        )
                    ) : (
                        items.length > 0 ? (
                            // The regular file list also needs the updated options menu
                            items.map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => handleItemClick(item)}
                                    className="relative group flex flex-col items-center justify-center p-8 border cursor-pointer hover:bg-accent rounded-xl "
                                >
                                    <button
                                        onClick={(e) => handleOptionsClick(e, item)}
                                        className="absolute top-2 right-2 p-1 rounded-full hover:bg-card z-20 opacity-100 group-hover:opacity-100 transition-opacity"
                                    >
                                        <MoreVertical className="h-5 w-5" />
                                    </button>

                                    {getFileIcon(item)}
                                    <span className="text-sm text-center truncate w-full mt-2">{item.name}</span>

                                    {openMenuId === item.id && (
                                        <div
                                            onClick={(e) => e.stopPropagation()}
                                            className="absolute top-10 right-2 w-40 bg-background border rounded shadow-lg z-10"
                                        >
                                            <ul className="py-1">
                                                <li onClick={() => { setItemToMove(item); setIsMoveModalOpen(true); setOpenMenuId(null); }} className="px-4 py-2 cursor-pointer hover:bg-secondary flex items-center gap-2">
                                                    <Move className="h-4 w-4" /> Move
                                                </li>
                                                <li onClick={() => { setDialogItem(item); setIsShareDialogOpen(true); setOpenMenuId(null); }} className="px-4 py-2 cursor-pointer hover:bg-secondary flex items-center gap-2">
                                                    <Share2 className="h-4 w-4" /> Share
                                                </li>
                                                {item.type === 'file' && (
                                                    <li onClick={() => handleDownloadClick(item)} className="px-4 py-2 cursor-pointer hover:bg-secondary flex items-center gap-2">
                                                        <Download className="h-4 w-4" /> Download
                                                    </li>
                                                )}
                                                <li onClick={() => { setDialogItem(item); setIsRenameDialogOpen(true); setOpenMenuId(null); }} className="px-4 py-2 cursor-pointer hover:bg-secondary flex items-center gap-2">
                                                    <FilePenLine className="h-4 w-4" /> Rename
                                                </li>
                                                <li onClick={() => { setDialogItem(item); setIsDeleteDialogOpen(true); setOpenMenuId(null); }} className="px-4 py-2 text-red-600 cursor-pointer hover:bg-secondary flex items-center gap-2">
                                                    <Trash2 className="h-4 w-4" /> Delete
                                                </li>
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <span></span>
                        )
                    )}
                </div>

                {/* File viewer modal */}
                {viewingItem && (
                    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setViewingItem(null)}>
                        <div className="bg-card p-4 rounded-lg max-w-4xl max-h-[90vh] w-full h-full flex flex-col" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-lg truncate">{viewingItem.name}</h3>
                                <button onClick={() => setViewingItem(null)} className="text-2xl font-bold">&times;</button>
                            </div>
                            <div className="flex-grow flex items-center justify-center">
                                {isViewerLoading ? (
                                    <p>Loading...</p>
                                ) : viewingItemUrl ? (
                                    <>
                                        {viewingItem.mimetype?.startsWith('image/') && (<img src={viewingItemUrl} alt={viewingItem.name} className="max-w-full max-h-full object-contain" />)}
                                        {viewingItem.mimetype?.startsWith('video/') && (<video src={viewingItemUrl} controls className="max-w-full max-h-full"></video>)}
                                        {viewingItem.mimetype === 'application/pdf' && (<iframe src={viewingItemUrl} className="w-full h-full"></iframe>)}
                                        {!viewingItem.mimetype?.startsWith('image/') && !viewingItem.mimetype?.startsWith('video/') && viewingItem.mimetype !== 'application/pdf' && (<p>Preview is not available for this file type.</p>)}
                                    </>
                                ) : (
                                    <p>Could not load file.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Dropzone component for drag-and-drop uploads */}
                <Dropzone currentFolderId={currentFolderId} onUploadComplete={refreshItems}>
                    <div className="flex flex-col items-center justify-center w-full p-10 mt-4 border-2 border-dashed rounded-lg text-center cursor-pointer bg-card">
                        <svg className="w-12 h-12 text-gray-400 mb-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2" /></svg>
                        <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Drag and drop files here</span></p>
                        <p className="text-xs text-gray-500">or use the "Upload File" button</p>
                    </div>
                </Dropzone>

                {/* Modals and Dialogs */}
                {isMoveModalOpen && itemToMove && (
                    <MoveModal itemToMove={itemToMove} onClose={() => setIsMoveModalOpen(false)} onMoveConfirm={handleMoveConfirm} />
                )}

                {dialogItem && (
                    <>
                        <ShareDialog
                            isOpen={isShareDialogOpen}
                            onClose={() => setIsShareDialogOpen(false)}
                            onConfirm={handleShareConfirm}
                            itemName={dialogItem.name}
                        />
                        <RenameDialog
                            isOpen={isRenameDialogOpen}
                            onClose={() => setIsRenameDialogOpen(false)}
                            onConfirm={handleRenameConfirm}
                            currentName={dialogItem.name}
                        />
                        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will move "{dialogItem.name}" to the trash. You can restore it later.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">Move to Trash</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </>
                )}

                 
                <CreateFolderDialog
                    isOpen={isCreateFolderDialogOpen}
                    onClose={() => setIsCreateFolderDialogOpen(false)}
                    onConfirm={handleCreateFolderConfirm}
                />
            </main>
        </div>
    );
}