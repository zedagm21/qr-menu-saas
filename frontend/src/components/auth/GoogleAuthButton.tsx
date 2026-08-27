import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';

interface GoogleAuthButtonProps {
    onSuccess: (credential: string) => Promise<void>;
    onError?: (error?: string) => void;
    isLoading?: boolean;
    text?: 'signin_with' | 'signup_with' | 'continue_with';
}

export const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
    onSuccess,
    onError,
    isLoading = false,
    text = 'continue_with',
}) => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    // Fallback UI when VITE_GOOGLE_CLIENT_ID is not configured in environment
    if (!clientId) {
        return (
            <button
                type="button"
                onClick={() => {
                    toast.error('Google Client ID is not configured yet. Set VITE_GOOGLE_CLIENT_ID in frontend/.env', {
                        duration: 5000,
                        id: 'google-missing-env',
                    });
                }}
                className="w-full flex items-center justify-center gap-3 h-12 px-4 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-[15px] font-medium text-neutral-700 shadow-sm transition-all hover:border-neutral-300"
            >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                    />
                    <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                    />
                    <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.94 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
                    />
                    <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                </svg>
                <span>Continue with Google</span>
            </button>
        );
    }

    return (
        <div className={`w-full flex justify-center ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="w-full max-w-[400px]">
                <GoogleLogin
                    onSuccess={(credentialResponse) => {
                        if (credentialResponse.credential) {
                            onSuccess(credentialResponse.credential);
                        } else {
                            onError?.('No credential returned from Google');
                        }
                    }}
                    onError={() => {
                        onError?.('Google Sign-In failed');
                    }}
                    text={text}
                    shape="rectangular"
                    theme="outline"
                    size="large"
                    width="100%"
                />
            </div>
        </div>
    );
};
