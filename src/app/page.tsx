// 'use client';

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
// }


'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

// Define a type for our file/folder items
interface DriveItem {
    id: string;
    name: string;
    type: 'file' | 'folder';
}

export default function Home() {
    const { user, session, signOut } = useAuth();
    const [items, setItems] = useState<DriveItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false); // New state for upload feedback
    const fileInputRef = useRef<HTMLInputElement>(null); // Ref for the hidden file input

    // Function to fetch files and folders
    const fetchItems = async () => {
        if (!session) return;
        
        setIsLoading(true);
        try {
            const response = await fetch('http://localhost:8000/api/files', {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                },
            });
            if (!response.ok) {
                throw new Error('Failed to fetch items');
            }
            const data = await response.json();
            setItems(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    // Function to handle new folder creation
    const handleCreateFolder = async () => {
        if (!session) return;

        const folderName = prompt('Enter new folder name:');
        if (!folderName) return; // User cancelled

        try {
            const response = await fetch('http://localhost:8000/api/files/folder', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ name: folderName, parent_id: null }), // For now, create in root
            });
            if (!response.ok) {
                throw new Error('Failed to create folder');
            }
            // Refresh the list to show the new folder
            fetchItems();
        } catch (error) {
            console.error(error);
        }
    };

     // Function to trigger the hidden file input
    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

     // Function to handle the actual file upload
    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!session || !event.target.files || event.target.files.length === 0) {
            return;
        }

        const file = event.target.files[0];
        const formData = new FormData();
        formData.append('file', file);
        // We can add parent_id here if we are inside a folder
        // formData.append('parent_id', currentFolderId); 

        setIsUploading(true);
        try {
            const response = await fetch('http://localhost:8000/api/files/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to upload file');
            }
            
            // Refresh the list to show the new file
            await fetchItems();

        } catch (error) {
            console.error(error);
            alert(`Upload failed: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsUploading(false);
            // Reset the file input so the same file can be uploaded again
            if(fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    // Fetch items when the component mounts or session changes
    useEffect(() => {
        if (session) {
            fetchItems();
        }
    }, [session]);

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
            <header className="bg-white shadow-sm p-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold">My Drive</h1>
                <div className="flex items-center gap-4">
                    <p>{user.email}</p>
                    <button 
                        onClick={signOut} 
                        className="px-4 py-2 font-bold text-white bg-red-500 rounded hover:bg-red-700"
                    >
                        Sign Out
                    </button>
                </div>
            </header>
            
            <main className="p-8">
                <div className="mb-6">
                    <button 
                        onClick={handleCreateFolder}
                        className="px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700"
                    >
                        + Create Folder
                    </button>
                     <button 
                        onClick={handleUploadClick}
                        disabled={isUploading}
                        className="px-4 py-2 font-bold text-white bg-green-500 rounded hover:bg-green-700 disabled:bg-gray-400"
                    >
                        {isUploading ? 'Uploading...' : '↑ Upload File'}
                    </button>
                    {/* Hidden file input */}
                    <input 
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </div>



                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {isLoading ? (
                        <p>Loading...</p>
                    ) : items.length > 0 ? (
                        items.map((item) => (
                            <div key={item.id} className="flex flex-col items-center justify-center p-4 bg-white rounded-lg shadow cursor-pointer hover:bg-blue-50">
                                <span className="text-4xl mb-2">
                                    {item.type === 'folder' ? '📁' : '📄'}
                                </span>
                                <span className="text-sm text-center truncate w-full">{item.name}</span>
                            </div>
                        ))
                    ) : (
                        <p>This folder is empty.</p>
                    )}
                </div>
            </main>
        </div>
    );
}