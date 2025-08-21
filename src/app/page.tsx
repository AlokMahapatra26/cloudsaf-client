// {'use client';

// import { useAuth } from '@/context/AuthContext';
// import Link from 'next/link';

// export default function Home() {
//     const { user, signOut } = useAuth();

//     return (
//         <main className="flex flex-col items-center justify-center min-h-screen p-24">
//             <h1 className="text-4xl font-bold mb-8">Welcome to Your Drive</h1>

//             {user ? (
//                 <div className="text-center">
//                     <p>You are signed in as: <strong>{user.email}</strong></p>
//                     <button 
//                         onClick={signOut} 
//                         className="mt-4 px-4 py-2 font-bold text-white bg-red-500 rounded hover:bg-red-700"
//                     >
//                         Sign Out
//                     </button>
//                     {/* This is where your file/folder components will go! */}
//                 </div>
//             ) : (
//                 <div className="text-center">
//                     <p>Please sign in to continue.</p>
//                     <div className="mt-4 space-x-4">
//                         <Link href="/signin" className="px-4 py-2 font-bold text-white bg-green-500 rounded hover:bg-green-700">
//                             Sign In
//                         </Link>
//                         <Link href="/signup" className="px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700">
//                             Sign Up
//                         </Link>
//                     </div>
//                 </div>
//             )}
//         </main>
//     );
// }}


'use client';

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
}

interface Breadcrumb {
    id: string | null;
    name: string;
}

export default function Home() {
    const { user, session, signOut } = useAuth();
    const [items, setItems] = useState<DriveItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([{ id: null, name: 'My Drive' }]);
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



    // Fetch items when the component mounts or session changes
    // useEffect(() => {
    //     if (session) {
    //         fetchItems();
    //     }
    // }, [session]);

    // This is the login/signup view for non-authenticated users
    if (!user) {
        return (
            <main className="flex flex-col items-center justify-center min-h-screen p-24">
                <h1 className="text-4xl font-bold mb-8">Welcome to Your Drive</h1>
                <div className="text-center">
                    <p>Please sign in to continue.</p>
                    <div className="mt-4 space-x-4">
                        <Link href="/signin" className="px-4 py-2 font-bold text-white bg-green-500 rounded hover:bg-green-700">
                            Sign In
                        </Link>
                        <Link href="/signup" className="px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700">
                            Sign Up
                        </Link>
                    </div>
                </div>
            </main>
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
                                className={`flex flex-col items-center justify-center p-4 bg-white rounded-lg shadow ${item.type === 'folder' ? 'cursor-pointer hover:bg-blue-50' : ''}`}
                            >
                                <span className="text-4xl mb-2">{item.type === 'folder' ? '📁' : '📄'}</span>
                                <span className="text-sm text-center truncate w-full">{item.name}</span>
                            </div>
                        ))
                    ) : (<p>This folder is empty.</p>)}
                </div>
            </main>
        </div>
    );
}

