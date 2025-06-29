"use client";

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

interface ConfirmDeleteDialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    onConfirm: () => void;
    deleteName: string;
}

export function ConfirmDeleteThemeDialog({
    open,
    onOpenChange,
    onConfirm,
    deleteName,
}: ConfirmDeleteDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Custom Theme</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete the theme &quot;
                        {deleteName}
                        &quot;? This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        Delete Theme
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
export function ConfirmDeleteProjectDialog({
    open,
    onOpenChange,
    onConfirm,
    deleteName,
}: ConfirmDeleteDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Project</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete the project &quot;
                        {deleteName}&quot;? This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        Delete Project
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
