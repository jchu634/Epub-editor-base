// public/preview-sw.js

// This variable will hold the latest HTML content for the preview.
let previewContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview</title>
</head>
<body>
    <p>Waiting for content...</p>
</body>
</html>`;

// The URL the iframe will request.
const PREVIEW_URL = "/preview-content";

// --- SERVICE WORKER LIFECYCLE ---

// On install, activate immediately.
self.addEventListener("install", (event) => {
    self.skipWaiting();
});

// On activation, take control of clients.
self.addEventListener("activate", (event) => {
    event.waitUntil(self.clients.claim());
});

// --- EVENT LISTENERS ---

// Listen for messages from the main application.
self.addEventListener("message", (event) => {
    // We expect messages with a 'type' and 'content' payload.
    if (event.data && event.data.type === "UPDATE_CONTENT") {
        previewContent = event.data.content;
    }
});

// Intercept fetch requests.
self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);

    // If the request is for our specific preview URL, serve the stored content.
    if (url.pathname === PREVIEW_URL) {
        // Respond with the stored HTML content.
        const response = new Response(previewContent, {
            headers: {
                "Content-Type": "text/html; charset=utf-8",
            },
        });
        event.respondWith(response);
    }
    // For all other requests, do nothing and let the browser handle it normally.
});
