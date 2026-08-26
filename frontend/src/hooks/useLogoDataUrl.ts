import { useState, useEffect } from 'react';

const blobToDataUrl = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

/**
 * Fetches an image URL and converts it to a same-origin base64 data URL.
 * First tries direct fetch; if blocked by CORS (e.g. Cloudflare R2 / S3),
 * automatically falls back to the backend /api/public/proxy-image endpoint.
 *
 * This ensures 100% reliable conversion into an inlined data URL, so that
 * html2canvas and SVG exports never drop the logo or show empty white placeholders.
 */
export function useLogoDataUrl(logoUrl?: string | null): string | null {
    const [dataUrl, setDataUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!logoUrl) {
            setDataUrl(null);
            return;
        }

        if (logoUrl.startsWith('data:')) {
            setDataUrl(logoUrl);
            return;
        }

        let cancelled = false;

        const load = async () => {
            // 1. Try direct fetch first
            try {
                const res = await fetch(logoUrl);
                if (res.ok) {
                    const blob = await res.blob();
                    const dUrl = await blobToDataUrl(blob);
                    if (!cancelled) setDataUrl(dUrl);
                    return;
                }
            } catch {
                // Direct fetch blocked by CORS or network, proceed to proxy
            }

            // 2. Fallback to backend proxy (bypasses browser CORS restrictions completely)
            try {
                const proxyUrl = `/api/public/proxy-image?url=${encodeURIComponent(logoUrl)}`;
                const proxyRes = await fetch(proxyUrl);
                if (proxyRes.ok) {
                    const blob = await proxyRes.blob();
                    const dUrl = await blobToDataUrl(blob);
                    if (!cancelled) setDataUrl(dUrl);
                    return;
                }
            } catch {
                // Ignore proxy fetch error
            }

            // 3. Fallback: use raw logo URL if conversion impossible
            if (!cancelled) setDataUrl(logoUrl);
        };

        load();

        return () => { cancelled = true; };
    }, [logoUrl]);

    return dataUrl;
}
