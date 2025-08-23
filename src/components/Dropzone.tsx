'use client';

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '@/context/AuthContext';

interface DropzoneProps {
    children: React.ReactNode;
    currentFolderId: string | null;
    onUploadComplete: () => void;
}

export default function Dropzone({ children, currentFolderId, onUploadComplete }: DropzoneProps) {
    const { session } = useAuth();

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (!session) return;

        console.log('--- onDrop function was triggered! ---', new Date().toLocaleTimeString()); 
        
        const uploadPromises = acceptedFiles.map(async (file) => {
            const formData = new FormData();
            formData.append('file', file);
            if (currentFolderId) {
                formData.append('parent_id', currentFolderId);
            }

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
            } catch (error) {
                console.error('Upload failed for file:', file.name, error);
                alert(`Upload failed for ${file.name}: ${error instanceof Error ? error.message : String(error)}`);
            }
        });

        // Wait for all uploads to finish before refreshing the file list
        Promise.all(uploadPromises).then(() => {
            onUploadComplete();
        });

    }, [session, currentFolderId, onUploadComplete]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        noClick: true,
        noKeyboard: true,
    });

    return (
        <div {...getRootProps()} className="relative h-full w-full hidden md:block">
            <input {...getInputProps()} />
            {children}
            {isDragActive && (
                <div className="absolute inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
                    <div className="w-full h-full bg-sky-500 bg-opacity-20 border-4 border-dashed border-sky-500 rounded-lg flex flex-col items-center justify-center">
                        <svg className="w-24 h-24 text-sky-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l-3.75 3.75M12 9.75l3.75 3.75M3 17.25V17.25C3 18.9069 4.34315 20.25 6 20.25H18C19.6569 20.25 21 18.9069 21 17.25V17.25C21 15.5931 19.6569 14.25 18 14.25H6C4.34315 14.25 3 15.5931 3 17.25z" />
                        </svg>
                        <p className="text-2xl font-bold text-gray-700">Drop files to upload</p>
                    </div>
                </div>
            )}
        </div>
    );
}