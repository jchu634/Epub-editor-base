import { useEffect, useRef, useState, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    RefreshCw,
    ExternalLink,
    Eye,
    Sun,
    Moon,
    Monitor,
    Contrast,
    Palette,
    Plus,
    X,
    Edit,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";
import { CustomThemeDialog } from "@/components/ui/custom-theme-dialog";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";

interface PreviewPaneProps {
    content: string;
    filePath: string;
    baseUrl?: string;
}

export function PreviewPane({
    content,
    filePath,
    baseUrl = "",
}: PreviewPaneProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [isLoading, setIsLoading] = useState(false);

    // --- Custom theme state ---
    const [previewTheme, setPreviewTheme] = useState<PreviewTheme>("system");
    const { theme } = useTheme();
    const [customThemes, setCustomThemes] = useState<CustomTheme[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingTheme, setEditingTheme] = useState<CustomTheme | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [themeToDelete, setThemeToDelete] = useState<CustomTheme | null>(
        null
    );

    // Load custom themes from localStorage
    useEffect(() => {
        const savedThemes = localStorage.getItem("epub-editor-custom-themes");
        if (savedThemes) {
            try {
                setCustomThemes(JSON.parse(savedThemes));
            } catch (error) {
                // ignore
            }
        }
    }, []);

    // Save custom themes to localStorage
    useEffect(() => {
        if (customThemes.length > 0) {
            localStorage.setItem(
                "epub-editor-custom-themes",
                JSON.stringify(customThemes)
            );
        }
    }, [customThemes]);

    // All themes
    const allThemes = useMemo(() => {
        return {
            ...BUILT_IN_THEMES,
            ...Object.fromEntries(
                customThemes.map((theme) => [theme.id, theme])
            ),
        };
    }, [customThemes]);

    // Actual theme to use
    const actualTheme = useMemo(() => {
        if (previewTheme === "system") {
            return allThemes[theme || "light"];
        }
        return allThemes[previewTheme] || allThemes.light;
    }, [previewTheme, theme, allThemes]);

    const addCustomTheme = (theme: Omit<CustomTheme, "id" | "isCustom">) => {
        const customTheme: CustomTheme = {
            id: `custom-${Date.now()}`,
            ...theme,
            isCustom: true,
        };
        setCustomThemes((prev) => [...prev, customTheme]);
        setDialogOpen(false);
    };

    const updateCustomTheme = (
        themeId: string,
        updatedTheme: Omit<CustomTheme, "id" | "isCustom">
    ) => {
        setCustomThemes((prev) =>
            prev.map((theme) =>
                theme.id === themeId ? { ...theme, ...updatedTheme } : theme
            )
        );
        setEditingTheme(null);
        setDialogOpen(false);
    };

    const handleEditTheme = (theme: CustomTheme) => {
        setEditingTheme(theme);
        setDialogOpen(true);
    };

    const handleDeleteTheme = (theme: CustomTheme) => {
        setThemeToDelete(theme);
        setDeleteDialogOpen(true);
    };

    const confirmDeleteTheme = () => {
        if (themeToDelete) {
            setCustomThemes((prev) =>
                prev.filter((theme) => theme.id !== themeToDelete.id)
            );
            if (previewTheme === themeToDelete.id) {
                setPreviewTheme("system");
            }
            setThemeToDelete(null);
            setDeleteDialogOpen(false);
        }
    };

    const handleCreateNewTheme = () => {
        setEditingTheme(null);
        setDialogOpen(true);
    };

    // --- End custom theme state ---

    const getFileType = (path: string) => {
        const ext = path.split(".").pop()?.toLowerCase();
        return ext || "unknown";
    };

    const openInNewTab = () => {
        const blob = new Blob([content], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
    };

    // --- THEME ICON ---
    const getThemeIcon = (themeId: string) => {
        if (themeId === "light") return <Sun className="h-3.5 w-3.5" />;
        if (themeId === "dark") return <Moon className="h-3.5 w-3.5" />;
        if (themeId === "system") return <Monitor className="h-3.5 w-3.5" />;
        return <Palette className="h-3.5 w-3.5" />;
    };

    // --- THEME TOGGLE DROPDOWN ---
    const PreviewThemeToggle = () => (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Badge
                        variant="secondary"
                        className="text-xs px-1.5 cursor-pointer"
                    >
                        {actualTheme.name}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                        >
                            {getThemeIcon(previewTheme)}
                            <span className="sr-only">
                                Toggle preview theme
                            </span>
                        </Button>
                    </Badge>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    {/* Built-in themes */}
                    <DropdownMenuItem
                        onClick={() => setPreviewTheme("light")}
                        className="cursor-pointer text-xs"
                    >
                        <Sun className="mr-2 h-3.5 w-3.5" />
                        <span>Light</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => setPreviewTheme("dark")}
                        className="cursor-pointer text-xs"
                    >
                        <Moon className="mr-2 h-3.5 w-3.5" />
                        <span>Dark</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => setPreviewTheme("system")}
                        className="cursor-pointer text-xs"
                    >
                        <Monitor className="mr-2 h-3.5 w-3.5" />
                        <span>Global</span>
                    </DropdownMenuItem>

                    {customThemes.length > 0 && (
                        <>
                            <DropdownMenuSeparator />

                            {/* Custom themes */}
                            {customThemes.map((theme) => (
                                <DropdownMenuItem
                                    key={theme.id}
                                    onClick={() => setPreviewTheme(theme.id)}
                                    className="cursor-pointer text-xs flex items-center justify-between group pr-2"
                                >
                                    <div className="flex items-center flex-1">
                                        <Palette className="mr-2 h-3.5 w-3.5" />
                                        <span className="flex-1">
                                            {theme.name}
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-1 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-5 w-5 p-0 bg-accent cursor-pointer"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditTheme(theme);
                                            }}
                                            title="Edit theme"
                                        >
                                            <Edit className="h-3 w-3" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-5 w-5 p-0 cursor-pointer"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteTheme(theme);
                                            }}
                                            title="Delete theme"
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </DropdownMenuItem>
                            ))}
                        </>
                    )}

                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        className="cursor-pointer text-xs"
                        onClick={handleCreateNewTheme}
                    >
                        <Plus className="mr-2 h-3.5 w-3.5" />
                        <span>Add Custom Theme</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <CustomThemeDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onCreate={addCustomTheme}
                onUpdate={updateCustomTheme}
                editingTheme={editingTheme ?? undefined}
            />

            <ConfirmDeleteDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={confirmDeleteTheme}
                themeName={themeToDelete?.name || ""}
            />
        </>
    );

    // --- HTML/XHTML THEME PREVIEW ---
    useEffect(() => {
        const fileType = getFileType(filePath);
        if (
            iframeRef.current &&
            (fileType === "html" || fileType === "xhtml")
        ) {
            const iframe = iframeRef.current;
            const doc =
                iframe.contentDocument || iframe.contentWindow?.document;

            if (doc) {
                // Remove XML declaration and DOCTYPE
                let htmlContent = content.replace(/<\?xml[^>]*\?>\s*/i, "");
                htmlContent = htmlContent.replace(/<!DOCTYPE[^>]*>\s*/i, "");
                // Extract body content if present
                const bodyMatch = htmlContent.match(
                    /<body[^>]*>([\s\S]*)<\/body>/i
                );
                if (bodyMatch) {
                    htmlContent = bodyMatch[1];
                }
                doc.open();
                doc.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1">
                        <style>
                            * { box-sizing: border-box; }
                            body {
                                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                                line-height: 1.6;
                                color: ${actualTheme.color};
                                background: ${actualTheme.background};
                                margin: 0;
                                padding: 1rem;
                                font-size: 16px;
                                transition: all 0.3s ease;
                            }
                            h1, h2, h3, h4, h5, h6 {
                                color: ${actualTheme.headingColor};
                                margin-top: 1.5em;
                                margin-bottom: 0.5em;
                                font-weight: 600;
                                line-height: 1.3;
                            }
                            h1 { font-size: 2em; }
                            h2 { font-size: 1.5em; }
                            h3 { font-size: 1.25em; }
                            p {
                                margin-bottom: 1em;
                                text-align: justify;
                                hyphens: auto;
                            }
                            a {
                                color: ${actualTheme.linkColor};
                                text-decoration: underline;
                                text-decoration-thickness: 1px;
                                text-underline-offset: 2px;
                            }
                            a:visited {
                                color: ${actualTheme.linkVisitedColor};
                            }
                            a:hover {
                                text-decoration-thickness: 2px;
                            }
                            blockquote {
                                border-left: 4px solid ${actualTheme.linkColor};
                                margin: 1em 0;
                                padding-left: 1em;
                                font-style: italic;
                                opacity: 0.9;
                            }
                            code {
                                background: ${actualTheme.codeBackground};
                                padding: 0.2em 0.4em;
                                border-radius: 3px;
                                font-family: "Intel One Mono", 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
                                font-size: 0.9em;
                                border: 1px solid ${actualTheme.borderColor};
                            }
                            pre {
                                background: ${actualTheme.codeBackground};
                                padding: 1em;
                                border-radius: 6px;
                                overflow-x: auto;
                                border: 1px solid ${actualTheme.borderColor};
                            }
                            pre code {
                                background: none;
                                padding: 0;
                                border: none;
                            }
                            img {
                                max-width: 100%;
                                height: auto;
                                border-radius: 4px;
                                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                            }
                            table {
                                width: 100%;
                                border-collapse: collapse;
                                margin: 1em 0;
                            }
                            th, td {
                                border: 1px solid ${actualTheme.borderColor};
                                padding: 0.5em;
                                text-align: left;
                            }
                            th {
                                background: ${actualTheme.codeBackground};
                                font-weight: 600;
                            }
                            ul, ol {
                                padding-left: 1.5em;
                                margin-bottom: 1em;
                            }
                            li {
                                margin-bottom: 0.25em;
                            }
                            hr {
                                border: none;
                                border-top: 2px solid ${actualTheme.borderColor};
                                margin: 2em 0;
                            }
                            .epub-content {
                                max-width: 100%;
                                margin: 0 auto;
                            }
                            .chapter-title {
                                text-align: center;
                                margin-bottom: 2em;
                            }
                            .drop-cap {
                                float: left;
                                font-size: 3em;
                                line-height: 1;
                                margin-right: 0.1em;
                                margin-top: 0.1em;
                                color: ${actualTheme.headingColor};
                            }
                            
                            @media (max-width: 600px) {
                                body { padding: 0.5rem; font-size: 14px; }
                                h1 { font-size: 1.75em; }
                                h2 { font-size: 1.4em; }
                                h3 { font-size: 1.2em; }
                            }
                        </style>
                    </head>
                    <body>
                        <div class="epub-content">
                            ${htmlContent}
                        </div>
                    </body>
                    </html>
                `);
                doc.close();
            }
        }
    }, [content, filePath, actualTheme]);

    // --- END THEME PREVIEW ---

    const renderPreview = () => {
        const fileType = getFileType(filePath);

        switch (fileType) {
            case "html":
            case "xhtml":
                return (
                    <iframe
                        ref={iframeRef}
                        className="w-full h-full border-0"
                        title="Preview"
                        sandbox="allow-same-origin"
                        key={`${actualTheme.id}-${content.length}`}
                    />
                );
            case "css":
                return (
                    <ScrollArea className="h-full">
                        <pre className="p-4 text-sm font-mono whitespace-pre-wrap">
                            <code>{content}</code>
                        </pre>
                    </ScrollArea>
                );
            case "js":
            case "json":
            case "xml":
            case "opf":
            case "ncx":
                return (
                    <ScrollArea className="h-full">
                        <pre className="p-4 text-sm font-mono whitespace-pre-wrap">
                            <code>{content}</code>
                        </pre>
                    </ScrollArea>
                );
            case "jpg":
            case "jpeg":
            case "png":
            case "gif":
            case "svg":
                const imageUrl = `data:image/${fileType};base64,${btoa(
                    content
                )}`;
                return (
                    <div className="flex items-center justify-center h-full p-4">
                        <img
                            src={imageUrl}
                            alt="Preview"
                            className="max-w-full max-h-full object-contain"
                        />
                    </div>
                );
            default:
                return (
                    <div className="flex items-center justify-center h-full text-muted-foreground ">
                        <div className="text-center">
                            <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Preview not available for this file type</p>
                            <Badge variant="outline" className="mt-2">
                                {fileType.toUpperCase()}
                            </Badge>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between p-3 border-b bg-muted/50">
                <div className="flex items-center gap-2">
                    <Eye className="size-4" />
                    <span className="text-sm font-medium">Preview</span>
                    <Badge variant="outline" className="text-xs">
                        {getFileType(filePath).toUpperCase()}
                    </Badge>
                </div>
                <div className="flex items-center gap-2">
                    {(getFileType(filePath) === "html" ||
                        getFileType(filePath) === "xhtml") && (
                        <PreviewThemeToggle />
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={openInNewTab}
                        className="size-4"
                    >
                        <ExternalLink className="size-4" />
                    </Button>
                </div>
            </div>
            <div className="flex-1 overflow-hidden">{renderPreview()}</div>
        </div>
    );
}

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

type PreviewTheme = "light" | "dark" | "system" | string;

const BUILT_IN_THEMES: Record<string, CustomTheme> = {
    light: {
        id: "light",
        name: "Light",
        background: "#ffffff",
        color: "#333333",
        headingColor: "#1a1a1a",
        linkColor: "#2563eb",
        linkVisitedColor: "#7c3aed",
        borderColor: "#e5e7eb",
        codeBackground: "#f3f4f6",
        isCustom: false,
    },
    dark: {
        id: "dark",
        name: "Dark",
        background: "#0f0f0f",
        color: "#e5e5e5",
        headingColor: "#f5f5f5",
        linkColor: "#60a5fa",
        linkVisitedColor: "#c084fc",
        borderColor: "#374151",
        codeBackground: "#1f2937",
        isCustom: false,
    },
};
