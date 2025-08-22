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

interface StorageData {
    totalUsage: number;
    plan: 'free' | 'pro';
    limit: number;
}

interface StorageIndicatorProps {
    // We pass a trigger that changes when we need to refetch the data
    refreshTrigger: number;
}

export default function StorageIndicator({ refreshTrigger }: StorageIndicatorProps) {
    const { session } = useAuth();
    const [storageData, setStorageData] = useState<StorageData>({ totalUsage: 0, plan: 'free', limit: 0 });

    useEffect(() => {
        if (!session) return;
        const fetchStorage = async () => {
            try {
                const response = await fetch('http://localhost:8000/api/user/storage', {
                    headers: { 'Authorization': `Bearer ${session.access_token}` },
                });
                const data = await response.json();
                if (response.ok) {
                    setStorageData(data);
                }
            } catch (error) {
                console.error("Failed to fetch storage usage:", error);
            }
        };
        fetchStorage();
    }, [session, refreshTrigger]);

    const progressPercentage = Math.min(100, (storageData.totalUsage / storageData.limit) * 100);

    return (
        <div className="flex flex-col items-end gap-1">
            <div className="text-sm text-gray-500">
                {formatBytes(storageData.totalUsage)} of {formatBytes(storageData.limit)} used
            </div>
            <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${progressPercentage}%` }}
                ></div>
            </div>
            <span className="text-xs text-gray-400">{storageData.plan} plan</span>
        </div>
    );
}