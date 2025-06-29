import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Inkproof Editor",
    description: "Easily edit ePUB books on the web.",
    manifest: "/manifest.json",
    themeColor: "#2563eb",
    viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "Inkproof Editor",
    },
    icons: {
        icon: [
            { url: "/logo-192.png", sizes: "192x192", type: "image/png" },
            { url: "/logo-512.png", sizes: "512x512", type: "image/png" },
        ],
        apple: [
            { url: "/logo-192.png", sizes: "192x192", type: "image/png" },
        ],
    },
};

function ServiceWorkerRegistration() {
    if (typeof window !== 'undefined') {
        // Register service worker on client side
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then((registration) => {
                        console.log('Service Worker registered with scope:', registration.scope);
                        
                        // Check for updates
                        registration.addEventListener('updatefound', () => {
                            const newWorker = registration.installing;
                            if (newWorker) {
                                newWorker.addEventListener('statechange', () => {
                                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                        // New content is available, prompt user to refresh
                                        if (confirm('New version available! Refresh to update?')) {
                                            window.location.reload();
                                        }
                                    }
                                });
                            }
                        });
                    })
                    .catch((error) => {
                        console.error('Service Worker registration failed:', error);
                    });
            });

            // Listen for service worker messages
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'CACHE_UPDATED') {
                    console.log('Cache updated:', event.data.url);
                }
            });
        }

        // Handle install prompt
        let deferredPrompt: any;
        window.addEventListener('beforeinstallprompt', (e) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later
            deferredPrompt = e;
            
            // Show install button or banner
            console.log('PWA install prompt available');
            
            // You could show a custom install button here
            // For now, we'll just log it
        });

        window.addEventListener('appinstalled', () => {
            console.log('PWA was installed');
            deferredPrompt = null;
        });
    }

    return null;
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link rel="manifest" href="/manifest.json" />
                <meta name="theme-color" content="#2563eb" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="default" />
                <meta name="apple-mobile-web-app-title" content="Inkproof Editor" />
                <link rel="apple-touch-icon" href="/logo-192.png" />
                <meta name="msapplication-TileColor" content="#2563eb" />
                <meta name="msapplication-TileImage" content="/logo-192.png" />
            </head>
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    {children}
                    <Toaster richColors position="bottom-right" />
                </ThemeProvider>
                <ServiceWorkerRegistration />
            </body>
        </html>
    );
}