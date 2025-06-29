"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
    const { setTheme, theme, systemTheme } = useTheme();

    // Determine the current theme, defaulting to system if not set
    const currentTheme = theme === "system" || !theme ? systemTheme : theme;

    const toggleTheme = () => {
        setTheme(currentTheme === "dark" ? "light" : "dark");
    };

    return (
        <Button
            variant="outline"
            size="icon"
            className="size-9 cursor-pointer"
            onClick={toggleTheme}
            aria-label="Toggle theme"
        >
            <Sun
                className={`h-[1.2rem] w-[1.2rem] transition-all ${
                    currentTheme === "dark"
                        ? "rotate-0 scale-0"
                        : "rotate-0 scale-100"
                }`}
            />
            <Moon
                className={`absolute h-[1.2rem] w-[1.2rem] transition-all ${
                    currentTheme === "dark"
                        ? "rotate-0 scale-100"
                        : "rotate-90 scale-0"
                }`}
            />
            <span className="sr-only">Toggle theme</span>
        </Button>
    );
}
