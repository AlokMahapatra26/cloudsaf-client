'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ActionDialogProps {
    open: boolean;
    onClose: () => void;
    title: string;
    description: string;
    label: string;
    placeholder: string;
    defaultValue?: string;
    onConfirm: (value: string) => void;
    isConfirming: boolean;
}

export function ActionDialog({
    open,
    onClose,
    title,
    description,
    label,
    placeholder,
    defaultValue = '',
    onConfirm,
    isConfirming,
}: ActionDialogProps) {
    const [inputValue, setInputValue] = useState(defaultValue);

    useEffect(() => {
        setInputValue(defaultValue);
    }, [defaultValue]);

    const handleConfirm = () => {
        onConfirm(inputValue);
        if (!isConfirming) {
            setInputValue('');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="input" className="text-right">
                            {label}
                        </Label>
                        <Input
                            id="input"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder={placeholder}
                            className="col-span-3"
                            disabled={isConfirming}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleConfirm();
                                }
                            }}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isConfirming}>
                        Cancel
                    </Button>
                    <Button onClick={handleConfirm} disabled={isConfirming || inputValue.trim() === ''}>
                        {isConfirming ? 'Loading...' : 'Confirm'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}