import { useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, ExternalLink, Eye } from "lucide-react";

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

    const getFileType = (path: string) => {
        const ext = path.split(".").pop()?.toLowerCase();
        return ext || "unknown";
    };

    const openInNewTab = () => {
        const blob = new Blob([content], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
    };

    useEffect(() => {
        if (
            iframeRef.current &&
            (filePath.endsWith(".html") || filePath.endsWith(".xhtml"))
        ) {
            const iframe = iframeRef.current;
            const doc =
                iframe.contentDocument || iframe.contentWindow?.document;

            if (doc) {
                doc.open();
                doc.write(content);
                doc.close();

                // Add some basic styling for better preview
                const style = doc.createElement("style");
                style.textContent = `
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
          }
          img {
            max-width: 100%;
            height: auto;
          }
          pre {
            background: #f5f5f5;
            padding: 10px;
            border-radius: 4px;
            overflow-x: auto;
          }
          code {
            background: #f5f5f5;
            padding: 2px 4px;
            border-radius: 2px;
          }
        `;
                doc.head.appendChild(style);
            }
        }
    }, [content, filePath]);

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
                        sandbox="allow-same-origin allow-scripts"
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
                    <div className="flex items-center justify-center h-full text-muted-foreground">
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
            <div className="flex items-center justify-between p-3 border-b">
                <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    <span className="text-sm font-medium">Preview</span>
                    <Badge variant="outline" className="text-xs">
                        {getFileType(filePath).toUpperCase()}
                    </Badge>
                </div>

                <div className="flex items-center gap-1">
                    {(filePath.endsWith(".html") ||
                        filePath.endsWith(".xhtml")) && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={openInNewTab}
                            className="h-8 w-8"
                        >
                            <ExternalLink className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-hidden">{renderPreview()}</div>
        </div>
    );
}
