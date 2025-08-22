import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { FaFolder, FaFileImage, FaFilePdf, FaFileVideo } from 'react-icons/fa';
import { MdInsertDriveFile } from 'react-icons/md';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface DriveItem {
    id: string;
    name: string;
    type: 'file' | 'folder';
    parent_id: string | null;
    storage_path: string | null;
    mimetype: string | null;
}

// The getFileIcon function
export const getFileIcon = (item: DriveItem) => {
    // Check for folder
    if (item.type === 'folder') {
        return <FaFolder className="text-4xl text-blue-500" />;
    }

    // Check for common file types
    if (item.mimetype) {
        // Image types (e.g., image/jpeg, image/png)
        if (item.mimetype.startsWith('image/')) {
            return <FaFileImage className="text-4xl text-purple-500" />;
        }
        // PDF files
        if (item.mimetype === 'application/pdf') {
            return <FaFilePdf className="text-4xl text-red-500" />;
        }
        // Video files (e.g., video/mp4)
        if (item.mimetype.startsWith('video/')) {
            return <FaFileVideo className="text-4xl text-green-500" />;
        }
    }

    // Default icon for other files
    return <MdInsertDriveFile className="text-4xl text-gray-500" />;
};