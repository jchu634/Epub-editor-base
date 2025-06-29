import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    // ExternalLink,
    Eye,
    Sun,
    Moon,
    Monitor,
    Palette,
    Plus,
    X,
    Edit,
    // Bug,
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
import { ConfirmDeleteThemeDialog } from "@/components/ui/confirm-delete-dialog";

// A simple debounce utility function
// eslint-disable-next-line
function debounce<T extends (...args: any[]) => void>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: Parameters<T>) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

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
    const scrollPositionRef = useRef({ x: 0, y: 0 });
    const isContentHtmlRef = useRef(false);
    const serviceWorkerRegistrationRef =
        useRef<ServiceWorkerRegistration | null>(null);

    // --- Custom theme state (unchanged) ---
    const [previewTheme, setPreviewTheme] = useState<PreviewTheme>("system");
    const { theme } = useTheme();
    const [customThemes, setCustomThemes] = useState<CustomTheme[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingTheme, setEditingTheme] = useState<CustomTheme | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [themeToDelete, setThemeToDelete] = useState<CustomTheme | null>(
        null
    );

    useEffect(() => {
        const savedThemes = localStorage.getItem("epub-editor-custom-themes");
        if (savedThemes) {
            try {
                setCustomThemes(JSON.parse(savedThemes));
            } catch (error) {
                console.error("Failed to parse custom themes:", error);
                localStorage.removeItem("epub-editor-custom-themes");
            }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem(
            "epub-editor-custom-themes",
            JSON.stringify(customThemes)
        );
    }, [customThemes]);

    const allThemes = useMemo(() => {
        return {
            ...BUILT_IN_THEMES,
            ...Object.fromEntries(
                customThemes.map((theme) => [theme.id, theme])
            ),
        };
    }, [customThemes]);

    const actualTheme = useMemo(() => {
        if (previewTheme === "system") {
            // Always fallback to 'light' if theme is not found
            return allThemes[theme || "light"] || allThemes["light"];
        }
        // Always fallback to 'light' if previewTheme is not found
        return allThemes[previewTheme] || allThemes["light"];
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

    // const openInNewTab = () => {
    //     const blob = new Blob([content], { type: "text/html" });
    //     const url = URL.createObjectURL(blob);
    //     window.open(url, "_blank");
    // };

    const getThemeIcon = (themeId: string) => {
        if (themeId === "light") return <Sun className="h-3.5 w-3.5" />;
        if (themeId === "dark") return <Moon className="h-3.5 w-3.5" />;
        if (themeId === "system") return <Monitor className="h-3.5 w-3.5" />;
        return <Palette className="h-3.5 w-3.5" />;
    };

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
                            className="size-6 p-0 cursor-pointer"
                        >
                            {getThemeIcon(previewTheme)}
                            <span className="sr-only">
                                Toggle preview theme
                            </span>
                        </Button>
                    </Badge>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
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

            <ConfirmDeleteThemeDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={confirmDeleteTheme}
                deleteName={themeToDelete?.name || ""}
            />
        </>
    );

    const iframeStyles = `* { box-sizing: border-box; }
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
                }`;

    // --- SERVICE WORKER AND SCROLL LOGIC ---

    // Save scroll position before content changes
    const saveScrollPosition = useCallback(() => {
        if (iframeRef.current && isContentHtmlRef.current) {
            const iframeWindow = iframeRef.current.contentWindow;
            if (iframeWindow) {
                scrollPositionRef.current = {
                    x: iframeWindow.scrollX,
                    y: iframeWindow.scrollY,
                };
            }
        }
    }, []);

    // Restore scroll position after content changes
    const restoreScrollPosition = useCallback(() => {
        if (iframeRef.current && isContentHtmlRef.current) {
            const iframeWindow = iframeRef.current.contentWindow;
            if (iframeWindow) {
                iframeWindow.scrollTo({
                    top: scrollPositionRef.current.y,
                    left: scrollPositionRef.current.x,
                    behavior: "instant",
                });
            }
        }
    }, []);

    // Debounced function to update the service worker and reload the iframe
    // eslint-disable-next-line
    const updatePreviewDebounced = useCallback(
        debounce((fullHtml: string) => {
            if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                // 1. Save the current scroll position
                saveScrollPosition();

                // 2. Send the new content to the service worker
                navigator.serviceWorker.controller.postMessage({
                    type: "UPDATE_CONTENT",
                    content: fullHtml,
                });

                // 3. Reload the iframe to fetch the new content from the service worker
                if (iframeRef.current) {
                    // The 'load' event will handle restoring the scroll position
                    iframeRef.current.onload = restoreScrollPosition;
                    iframeRef.current.contentWindow?.location.reload();
                }
            }
        }, 300), // 300ms debounce delay
        [saveScrollPosition, restoreScrollPosition] // Dependencies for useCallback
    );

    // Effect to register the service worker
    useEffect(() => {
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker
                .register("/preview-sw.js")
                .then((registration) => {
                    serviceWorkerRegistrationRef.current = registration;
                    console.log(
                        "Service Worker registered with scope:",
                        registration.scope
                    );
                })
                .catch((error) => {
                    console.error("Service Worker registration failed:", error);
                });
        }

        // Cleanup: unregister the service worker when the component unmounts
        return () => {
            serviceWorkerRegistrationRef.current
                ?.unregister()
                .then((success) => {
                    if (success) {
                        console.log("Service Worker unregistered.");
                    }
                });
        };
    }, []);

    // Effect to update the preview when content or theme changes
    useEffect(() => {
        const fileType = getFileType(filePath);
        isContentHtmlRef.current = fileType === "html" || fileType === "xhtml";

        if (isContentHtmlRef.current) {
            const fullHtml = `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Preview</title>
            <style>${iframeStyles}</style>
            ${baseUrl ? `<base href="${baseUrl}" />` : ""}
        </head>
        <body>
            ${content}
        </body>
        </html>`;

            updatePreviewDebounced(fullHtml);
        }
    }, [content, filePath, iframeStyles, baseUrl, updatePreviewDebounced]);

    // --- END SERVICE WORKER AND SCROLL LOGIC ---

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
                        sandbox="allow-same-origin allow-scripts" // allow-scripts is needed for location.reload()
                        src="/preview-content" // Static URL intercepted by the service worker
                    />
                );
            case "css":
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
                        {/* eslint-disable-next-line */}
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

    // const logIframeScrollPosition = () => {
    //     if (iframeRef.current && iframeRef.current.contentWindow) {
    //         const x = iframeRef.current.contentWindow.scrollX;
    //         const y = iframeRef.current.contentWindow.scrollY;
    //         console.log("Iframe scroll position:", { x, y });
    //     } else {
    //         console.log("Iframe not ready or not HTML content.");
    //     }
    // };

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

                    {/* TODO: Make actually useful
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={openInNewTab}
                        className="size-4 cursor-pointer"
                    >
                        <ExternalLink className="size-4" />
                    </Button> */}
                    {/* <Button
                        variant="ghost"
                        size="icon"
                        onClick={logIframeScrollPosition}
                        className="size-4 cursor-pointer"
                        title="Log iframe scroll position"
                    >
                        <Bug className="size-4" />
                    </Button> */}
                </div>
            </div>
            <div className="flex-1 overflow-hidden">{renderPreview()}</div>
        </div>
    );
}

// Unchanged interfaces and constants
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
