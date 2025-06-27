"use client";

import { useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { useSelector } from "@xstate/store/react";
import { appStore } from "@/lib/store";
import prettier from "prettier";

interface MonacoEditorProps {
    value: string;
    onChange: (value: string) => void;
    language: string;
    readOnly?: boolean;
    onSave?: (currentContent: string) => void;
}

export function MonacoEditor({
    value,
    onChange,
    language,
    readOnly = false,
    onSave,
}: MonacoEditorProps) {
    const { theme } = useTheme();
    const editorRef = useRef<any>(null);
    const { isPrettierEnabled } = useSelector(appStore, (state) => state.context);

    const formatCode = async (code: string, lang: string): Promise<string> => {
        if (!isPrettierEnabled) return code;

        try {
            const parser = getParserForLanguage(lang);
            if (!parser) return code;

            const formatted = await prettier.format(code, {
                parser,
                printWidth: 80,
                tabWidth: 2,
                useTabs: false,
                semi: true,
                singleQuote: false,
                quoteProps: "as-needed",
                trailingComma: "es5",
                bracketSpacing: true,
                bracketSameLine: false,
                arrowParens: "always",
                htmlWhitespaceSensitivity: "css",
                endOfLine: "lf",
            });

            return formatted;
        } catch (error) {
            console.warn("Prettier formatting failed:", error);
            return code;
        }
    };

    const getParserForLanguage = (lang: string): string | null => {
        const languageMap: Record<string, string> = {
            html: "html",
            xhtml: "html",
            css: "css",
            js: "babel",
            javascript: "babel",
            json: "json",
            xml: "xml",
            opf: "xml",
            ncx: "xml",
        };

        return languageMap[lang] || null;
    };

    const handleEditorDidMount = (editor: any, monaco: any) => {
        editorRef.current = editor;

        // Configure editor options
        editor.updateOptions({
            fontSize: 14,
            lineHeight: 1.5,
            minimap: { enabled: true },
            wordWrap: "on",
            automaticLayout: true,
            scrollBeyondLastLine: false,
            renderWhitespace: "selection",
            bracketPairColorization: { enabled: true },
            formatOnSave: false, // We'll handle formatting manually
        });

        // Add custom keybindings
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, async () => {
            if (onSave) {
                let currentContent = editor.getValue();
                
                // Format code if Prettier is enabled
                if (isPrettierEnabled) {
                    const formatted = await formatCode(currentContent, language);
                    if (formatted !== currentContent) {
                        editor.setValue(formatted);
                        currentContent = formatted;
                    }
                }
                
                onSave(currentContent);
            }
        });

        // Add format document command (Alt+Shift+F)
        editor.addCommand(
            monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.KeyF,
            async () => {
                if (isPrettierEnabled) {
                    const currentContent = editor.getValue();
                    const formatted = await formatCode(currentContent, language);
                    if (formatted !== currentContent) {
                        editor.setValue(formatted);
                        onChange(formatted);
                    }
                }
            }
        );
    };

    const getLanguageFromExtension = (lang: string) => {
        const languageMap: Record<string, string> = {
            html: "html",
            xhtml: "html",
            css: "css",
            js: "javascript",
            json: "json",
            xml: "xml",
            opf: "xml",
            ncx: "xml",
        };

        return languageMap[lang] || "plaintext";
    };

    return (
        <div className="h-full w-full">
            <Editor
                height="100%"
                language={getLanguageFromExtension(language)}
                value={value}
                onChange={(val) => onChange(val || "")}
                theme={theme === "dark" ? "vs-dark" : "light"}
                onMount={handleEditorDidMount}
                options={{
                    readOnly,
                    selectOnLineNumbers: true,
                    roundedSelection: false,
                    cursorStyle: "line",
                    automaticLayout: true,
                    glyphMargin: true,
                    folding: true,
                    lineNumbers: "on",
                    lineDecorationsWidth: 10,
                    lineNumbersMinChars: 3,
                    renderLineHighlight: "all",
                    scrollbar: {
                        vertical: "visible",
                        horizontal: "visible",
                        useShadows: false,
                        verticalHasArrows: false,
                        horizontalHasArrows: false,
                    },
                }}
            />
        </div>
    );
}