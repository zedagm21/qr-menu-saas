/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

export interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
        platform: string;
    }>;
    prompt(): Promise<void>;
}

declare global {
    interface Window {
        __pwaDeferredPrompt?: BeforeInstallPromptEvent | null;
    }
}
