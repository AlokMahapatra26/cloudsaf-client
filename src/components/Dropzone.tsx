// client/src/components/Dropzone.tsx
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
        
        // Use Promise.all to wait for all uploads to finish before refreshing
        const uploadPromises = acceptedFiles.map(file => {
            const formData = new FormData();
            formData.append('file', file);
            if (currentFolderId) {
                formData.append('parent_id', currentFolderId);
            }

            return fetch('http://localhost:8000/api/files/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${session.access_token}` },
                body: formData,
            }).catch(error => console.error('Upload failed for file:', file.name, error));
        });

        Promise.all(uploadPromises).then(() => {
            // Call the callback to tell the parent page to refresh its file list
            onUploadComplete();
        });

    }, [session, currentFolderId, onUploadComplete]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        noClick: true,
        noKeyboard: true,
    });

    return (
        <div {...getRootProps()} className="relative h-full w-full">
            <input {...getInputProps()} />
            {children}
            {isDragActive && (
                <div className="absolute inset-0 bg-blue-500 bg-opacity-50 flex items-center justify-center z-50 pointer-events-none">
                    <div className="text-center text-white">
                        <p className="text-4xl font-bold">Drop files to upload</p>
                    </div>
                </div>
            )}
        </div>
    );
}