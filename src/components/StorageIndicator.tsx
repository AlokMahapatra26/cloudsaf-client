'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

// Helper function to format bytes into KB, MB, GB, etc.
const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

interface StorageIndicatorProps {
    // We pass a trigger that changes when we need to refetch the data
    refreshTrigger: number;
}

export default function StorageIndicator({ refreshTrigger }: StorageIndicatorProps) {
    const { session } = useAuth();
    const [storageUsage, setStorageUsage] = useState(0);

    useEffect(() => {
        if (!session) return;
        
        const fetchStorage = async () => {
            try {
                const response = await fetch('http://localhost:8000/api/user/storage', {
                    headers: { 'Authorization': `Bearer ${session.access_token}` },
                });
                const data = await response.json();
                if (response.ok) {
                    setStorageUsage(data.totalUsage);
                }
            } catch (error) {
                console.error("Failed to fetch storage usage:", error);
            }
        };

        fetchStorage();
    }, [session, refreshTrigger]); // Re-fetches when session or the trigger changes

    return (
        <div className="text-sm text-gray-500">
            {formatBytes(storageUsage)} used
        </div>
    );
}