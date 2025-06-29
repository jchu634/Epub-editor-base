"use client";

import * as React from "react";
import * as colourUtils from "@/lib/colour-utils";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface ColourPickerProps {
    colour?: string;
    onChange?: (value: string) => void;
}

// type ColourMode = "hex" | "rgba" | "hsla";
// type CopyState = { [key in ColourMode]: boolean };

export function ColourPicker({
    colour = "#000000",
    onChange,
}: ColourPickerProps) {
    const [currentcolour, setCurrentcolour] = React.useState(colour);
    const alpha = 1;
    // const [colourMode, setcolourMode] = React.useState<ColourMode>("hex");
    // const [copied, setCopied] = React.useState<CopyState>({
    //     hex: false,
    //     rgba: false,
    //     hsla: false,
    // });
    const colourPlaneRef = React.useRef<HTMLDivElement>(null);
    const isDragging = React.useRef(false);

    const rgb = {
        ...(colourUtils.hexToRgb(currentcolour) || { r: 0, g: 0, b: 0 }),
        a: alpha,
    };
    const hsl = colourUtils.rgbToHsl(rgb);
    // const rgbaString = colourUtils.formatRgba(rgb);
    // const hslaString = colourUtils.formatHsla(hsl);

    const handlecolourChange = (newcolour: string) => {
        setCurrentcolour(newcolour);
        onChange?.(newcolour);
    };

    // const handleAlphaChange = (newAlpha: number) => {
    //     setAlpha(newAlpha);
    // };

    const updateHSL = (h: number, s: number, l: number) => {
        const rgb = colourUtils.hslToRgb({ h, s, l, a: alpha });
        handlecolourChange(colourUtils.rgbToHex(rgb));
    };

    const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
        isDragging.current = true;
        handlecolourPlaneChange(e);
    };

    const handleMouseUp = () => {
        isDragging.current = false;
    };

    const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (isDragging.current) {
            handlecolourPlaneChange(e);
        }
    };

    const handlecolourPlaneChange = (
        e: React.MouseEvent | React.TouchEvent
    ) => {
        if (!colourPlaneRef.current) return;

        const rect = colourPlaneRef.current.getBoundingClientRect();
        const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
        const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

        const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));

        updateHSL(hsl.h, Math.round(x * 100), Math.round((1 - y) * 100));
    };

    React.useEffect(() => {
        const handleGlobalMouseUp = () => {
            isDragging.current = false;
        };

        window.addEventListener("mouseup", handleGlobalMouseUp);
        window.addEventListener("touchend", handleGlobalMouseUp);

        return () => {
            window.removeEventListener("mouseup", handleGlobalMouseUp);
            window.removeEventListener("touchend", handleGlobalMouseUp);
        };
    }, []);

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className="w-48 justify-start text-left font-normal"
                >
                    <div className="w-full flex items-center gap-2">
                        <div
                            className="h-4 w-4 rounded !bg-center !bg-cover transition-all border"
                            style={{
                                backgroundColor: colourUtils.formatRgba(rgb),
                            }}
                        />
                        <div className="truncate flex-1">{currentcolour}</div>
                    </div>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
                <div className="grid gap-4">
                    <div
                        ref={colourPlaneRef}
                        className="relative w-full h-48 rounded-lg cursor-crosshair touch-none"
                        style={{
                            background: `
                linear-gradient(to right, #fff 0%, rgba(255, 255, 255, 0) 100%),
                linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, #000 100%),
                hsl(${hsl.h}, 100%, 50%)
              `,
                        }}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onTouchStart={handleMouseDown}
                        onTouchMove={handleMouseMove}
                        onTouchEnd={handleMouseUp}
                    >
                        <div
                            className="absolute w-4 h-4 border-2 border-white rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none shadow-md"
                            style={{
                                left: `${hsl.s}%`,
                                top: `${100 - hsl.l}%`,
                                backgroundColor: colourUtils.formatRgba(rgb),
                            }}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label>Hue</Label>
                        <div className="relative">
                            <Slider
                                value={[hsl.h]}
                                max={360}
                                step={1}
                                className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_.bg-primary]:bg-transparent [&_.bg-secondary]:bg-transparent"
                                onValueChange={([h]) =>
                                    updateHSL(h, hsl.s, hsl.l)
                                }
                                style={{
                                    backgroundImage: `linear-gradient(to right, 
                    hsl(0, 100%, 50%),
                    hsl(60, 100%, 50%),
                    hsl(120, 100%, 50%),
                    hsl(180, 100%, 50%),
                    hsl(240, 100%, 50%),
                    hsl(300, 100%, 50%),
                    hsl(360, 100%, 50%)
                  )`,
                                }}
                            />
                        </div>
                    </div>{" "}
                </div>
            </PopoverContent>
        </Popover>
    );
}
