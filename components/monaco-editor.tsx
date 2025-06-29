"use client";

import { useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { useSelector } from "@xstate/store/react";
import { appStore } from "@/lib/store";
import prettier from "prettier/standalone";
import parserHtml from "prettier/plugins/html";
import parserCss from "prettier/plugins/postcss";
import parserBabel from "prettier/plugins/babel";
// import parserXml from "prettier-plugin-xml";

interface MonacoEditorProps {
    value: string;
    onChange: (value: string) => void;
    language: string;
    readOnly?: boolean;
    onSave?: (currentContent: string) => void;
    hasUnsavedChanges?: boolean;
}

export function MonacoEditor({
    value,
    onChange,
    language,
    readOnly = false,
    onSave,
    hasUnsavedChanges = true,
}: MonacoEditorProps) {
    const { theme } = useTheme();
    const editorRef = useRef<any>(null);
    const languageRef = useRef(language); // Track latest language
    const onSaveRef = useRef(onSave); // Track latest onSave
    const { isPrettierEnabled } = useSelector(
        appStore,
        (state) => state.context
    );

    const hasUnsavedChangesRef = useRef(hasUnsavedChanges);
    useEffect(() => {
        hasUnsavedChangesRef.current = hasUnsavedChanges;
    }, [hasUnsavedChanges]);

    // Keep languageRef up to date with prop
    useEffect(() => {
        languageRef.current = language;
    }, [language]);

    // Keep onSaveRef up to date with prop
    useEffect(() => {
        onSaveRef.current = onSave;
    }, [onSave]);

    const formatCode = async (code: string, lang: string): Promise<string> => {
        if (!isPrettierEnabled) return code;

        try {
            const parser = getParserForLanguage(lang);
            if (!parser) return code;

            // Select plugins based on parser
            let plugins: any[] = [
                parserHtml,
                parserCss,
                parserBabel,
                // parserXml,
            ];

            switch (parser) {
                case "html":
                    plugins = [parserHtml];
                    break;
                case "css":
                    plugins = [parserCss];
                    break;
                case "babel":
                    plugins = [parserBabel];
                    break;
                case "json":
                case "xml":
                    return lang;
                //     plugins = [parserXml];
                //     break;
                default:
                    plugins = [];
            }

            const formatted = await prettier.format(code, {
                parser,
                plugins,
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
            formatOnSave: false,
        });

        // Add custom keybindings
        editor.addCommand(
            monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
            async () => {
                // Use latest onSave from ref
                if (onSaveRef.current) {
                    let currentContent = editor.getValue();

                    // Use latest language from ref
                    const currentLanguage = languageRef.current;

                    // Format code if Prettier is enabled
                    if (isPrettierEnabled) {
                        const formatted = await formatCode(
                            currentContent,
                            currentLanguage
                        );
                        if (formatted !== currentContent) {
                            currentContent = formatted;
                            editor.setValue(currentContent);
                        }
                    }

                    onSaveRef.current(currentContent);
                }
            }
        );

        // Add format document command (Alt+Shift+F)
        editor.addCommand(
            monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.KeyF,
            async () => {
                if (isPrettierEnabled) {
                    const currentContent = editor.getValue();
                    // Use latest language from ref
                    const currentLanguage = languageRef.current;
                    const formatted = await formatCode(
                        currentContent,
                        currentLanguage
                    );
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
