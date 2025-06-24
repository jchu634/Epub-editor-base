"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ColourPicker } from "@/components/ui/colour-picker";

interface CustomTheme {
    id: string;
    name: string;
    background: string;
    color: string;
    headingColor: string;
    linkColor: string;
    linkVisitedColor: string;
    borderColor: string;
    codeBackground: string;
    isCustom: boolean;
}

interface CustomThemeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreate: (theme: {
        name: string;
        background: string;
        color: string;
        headingColor: string;
        linkColor: string;
        linkVisitedColor: string;
        borderColor: string;
        codeBackground: string;
    }) => void;
    onUpdate?: (
        themeId: string,
        theme: {
            name: string;
            background: string;
            color: string;
            headingColor: string;
            linkColor: string;
            linkVisitedColor: string;
            borderColor: string;
            codeBackground: string;
        }
    ) => void;
    editingTheme?: CustomTheme;
}

const DEFAULT_THEME: CustomTheme = {
    id: "",
    name: "",
    background: "#ffffff",
    color: "#333333",
    headingColor: "#1a1a1a",
    linkColor: "#2563eb",
    linkVisitedColor: "#7c3aed",
    borderColor: "#e5e7eb",
    codeBackground: "#f3f4f6",
    isCustom: true,
};

export function CustomThemeDialog({
    open,
    onOpenChange,
    onCreate,
    onUpdate,
    editingTheme = DEFAULT_THEME,
}: CustomThemeDialogProps) {
    const [name, setName] = useState(editingTheme.name || "");
    const [background, setBackground] = useState(
        editingTheme.background || "#ffffff"
    );
    const [color, setColor] = useState(editingTheme.color || "#333333");
    const [headingColor, setHeadingColor] = useState(
        editingTheme.headingColor || "#1a1a1a"
    );
    const [linkColor, setLinkColor] = useState(
        editingTheme.linkColor || "#2563eb"
    );
    const [linkVisitedColor, setLinkVisitedColor] = useState(
        editingTheme.linkVisitedColor || "#7c3aed"
    );
    const [borderColor, setBorderColor] = useState(
        editingTheme.borderColor || "#e5e7eb"
    );
    const [codeBackground, setCodeBackground] = useState(
        editingTheme.codeBackground || "#f3f4f6"
    );

    const isEditing = !!editingTheme && !!editingTheme.id;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) return;

        const themeData = {
            name: name.trim(),
            background,
            color,
            headingColor,
            linkColor,
            linkVisitedColor,
            borderColor,
            codeBackground,
        };

        if (isEditing && editingTheme && onUpdate) {
            onUpdate(editingTheme.id, themeData);
        } else {
            onCreate(themeData);
        }
    };

    const handleCancel = () => {
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing
                            ? "Edit Custom Theme"
                            : "Create Custom Theme"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Modify the colors and settings for your custom theme."
                            : "Create a new custom theme for the preview pane. Choose colors that work well together for reading."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="theme-name">Theme Name</Label>
                        <Input
                            id="theme-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter theme name"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Background Color</Label>
                            <ColourPicker
                                colour={background}
                                onChange={setBackground}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Border Color</Label>
                            <ColourPicker
                                colour={borderColor}
                                onChange={setBorderColor}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Heading Color</Label>
                            <ColourPicker
                                colour={headingColor}
                                onChange={setHeadingColor}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Text Color</Label>
                            <ColourPicker colour={color} onChange={setColor} />
                        </div>

                        <div className="space-y-2">
                            <Label>Link Color</Label>
                            <ColourPicker
                                colour={linkColor}
                                onChange={setLinkColor}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Visited Link Color</Label>
                            <ColourPicker
                                colour={linkVisitedColor}
                                onChange={setLinkVisitedColor}
                            />
                        </div>

                        <div className="space-y-2 ">
                            <Label>Code Background</Label>
                            <ColourPicker
                                colour={codeBackground}
                                onChange={setCodeBackground}
                            />
                        </div>
                    </div>

                    {/* Live Preview */}
                    <div className="space-y-2">
                        <Label>Preview</Label>
                        <div
                            className="p-4 rounded-lg border-2 text-sm"
                            style={{
                                backgroundColor: background,
                                color: color,
                                borderColor: borderColor,
                            }}
                        >
                            <h3
                                className="font-semibold mb-2"
                                style={{ color: headingColor }}
                            >
                                Sample Heading
                            </h3>
                            <p className="mb-2">
                                This is sample text to preview your theme
                                colors.
                            </p>
                            <p className="mb-2">
                                <a
                                    href="#"
                                    style={{ color: linkColor }}
                                    className="underline"
                                >
                                    Sample link
                                </a>{" "}
                                and{" "}
                                <a
                                    href="#"
                                    style={{ color: linkVisitedColor }}
                                    className="underline"
                                >
                                    visited link
                                </a>
                            </p>
                            <code
                                className="px-2 py-1 rounded text-xs"
                                style={{
                                    backgroundColor: codeBackground,
                                    border: `1px solid ${borderColor}`,
                                }}
                            >
                                Sample code
                            </code>
                        </div>
                    </div>

                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancel}
                            className="w-full sm:w-auto"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={!name.trim()}
                            className="w-full sm:w-auto"
                        >
                            {isEditing ? "Update Theme" : "Create Theme"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
