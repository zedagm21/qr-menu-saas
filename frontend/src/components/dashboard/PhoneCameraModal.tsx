import React, { useEffect, useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Smartphone, CheckCircle2, Loader2, X, Sparkles, Copy, Check } from 'lucide-react';
import { uploadSessionApi } from '../../services/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface PhoneCameraModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPhotoReceived: (imageUrl: string) => void;
    itemName?: string;
}

export const PhoneCameraModal: React.FC<PhoneCameraModalProps> = ({
    isOpen,
    onClose,
    onPhotoReceived,
    itemName,
}) => {
    const { t } = useTranslation();
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isCompleted, setIsCompleted] = useState<boolean>(false);
    const [receivedImage, setReceivedImage] = useState<string | null>(null);
    const [copied, setCopied] = useState<boolean>(false);

    const pollingRef = useRef<NodeJS.Timeout | null>(null);

    // Initialize session when modal opens
    useEffect(() => {
        if (!isOpen) {
            if (pollingRef.current) clearInterval(pollingRef.current);
            setSessionId(null);
            setToken(null);
            setIsLoading(true);
            setIsCompleted(false);
            setReceivedImage(null);
            return;
        }

        let isMounted = true;
        setIsLoading(true);
        setIsCompleted(false);

        uploadSessionApi.create()
            .then(res => {
                if (!isMounted) return;
                const { sessionId: sid, token: tok } = res.data;
                setSessionId(sid);
                setToken(tok);
                setIsLoading(false);

                // Start polling every 1.5s
                pollingRef.current = setInterval(async () => {
                    try {
                        const statusRes = await uploadSessionApi.getStatus(sid, tok);
                        if (statusRes.data.status === 'COMPLETED' && statusRes.data.imageUrl) {
                            if (pollingRef.current) clearInterval(pollingRef.current);
                            setIsCompleted(true);
                            setReceivedImage(statusRes.data.imageUrl);
                            toast.success(t('camera_modal.photo_received', { defaultValue: 'Photo received from your phone!' }), {
                                icon: '📸',
                                duration: 3500,
                            });
                            onPhotoReceived(statusRes.data.imageUrl);
                            setTimeout(() => {
                                onClose();
                            }, 1500);
                        } else if (statusRes.data.status === 'EXPIRED') {
                            if (pollingRef.current) clearInterval(pollingRef.current);
                            toast.error(t('camera_modal.session_expired', { defaultValue: 'Session expired. Please try again.' }));
                            onClose();
                        }
                    } catch (e) {
                        // ignore occasional network hiccups while polling
                    }
                }, 1500);
            })
            .catch(err => {
                if (!isMounted) return;
                setIsLoading(false);
                toast.error(t('camera_modal.failed_init', { defaultValue: 'Failed to start camera session' }));
                onClose();
            });

        return () => {
            isMounted = false;
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const companionUrl = sessionId && token
        ? `${window.location.origin}/camera-upload?session=${sessionId}&token=${token}`
        : '';

    const handleCopy = () => {
        if (!companionUrl) return;
        navigator.clipboard.writeText(companionUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success(t('camera_modal.link_copied', { defaultValue: 'Companion link copied!' }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
            <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-neutral-200 dark:border-neutral-800 text-center overflow-hidden">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {isCompleted ? (
                    <div className="py-6 space-y-4 animate-scale-up">
                        <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
                        </div>
                        <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                            {t('camera_modal.photo_synced', { defaultValue: 'Photo Received!' })}
                        </h3>
                        {receivedImage && (
                            <div className="w-28 h-28 mx-auto rounded-2xl overflow-hidden shadow-md border-2 border-emerald-500">
                                <img src={receivedImage} alt="Received" className="w-full h-full object-cover" />
                            </div>
                        )}
                        <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                            {t('camera_modal.transferring_to_form', { defaultValue: 'Applied to your food menu form...' })}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {/* Title & Subtitle */}
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[color:var(--color-brand-50)] dark:bg-[color:var(--color-brand-500)]/10 text-[color:var(--color-brand-600)] dark:text-[color:var(--color-brand-400)] text-xs font-bold mb-2">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>{t('camera_modal.badge', { defaultValue: 'Phone-to-Desktop Sync' })}</span>
                            </div>
                            <h3 className="text-xl font-black text-neutral-900 dark:text-white tracking-tight">
                                {t('camera_modal.title', { defaultValue: 'Snap Photo with Your Phone' })}
                            </h3>
                            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1 max-w-xs mx-auto">
                                {itemName
                                    ? t('camera_modal.desc_item', { item: itemName, defaultValue: `Scan to capture a live photo for "${itemName}"` })
                                    : t('camera_modal.desc', { defaultValue: 'Scan this QR code with your smartphone camera to capture a dish photo.' })
                                }
                            </p>
                        </div>

                        {/* QR Code Container */}
                        <div className="relative inline-flex items-center justify-center p-4 rounded-2xl bg-white shadow-inner border border-neutral-200 dark:border-neutral-700">
                            {isLoading ? (
                                <div className="w-[200px] h-[200px] flex flex-col items-center justify-center gap-2 text-neutral-400">
                                    <Loader2 className="w-8 h-8 animate-spin text-[color:var(--color-brand-500)]" />
                                    <span className="text-xs font-medium">Generating QR...</span>
                                </div>
                            ) : companionUrl ? (
                                <QRCodeSVG
                                    value={companionUrl}
                                    size={200}
                                    level="M"
                                    includeMargin={false}
                                />
                            ) : null}
                        </div>

                        {/* Live Radar Pulse Indicator */}
                        <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                            </span>
                            <span>{t('camera_modal.waiting_capture', { defaultValue: 'Waiting for camera capture on your phone...' })}</span>
                        </div>

                        {/* Direct link copy helper */}
                        <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-2">
                            <span className="text-[11px] text-neutral-400 font-medium flex items-center gap-1">
                                <Smartphone className="w-3.5 h-3.5" />
                                <span>{t('camera_modal.instant_connect', { defaultValue: 'Opens phone camera instantly' })}</span>
                            </span>
                            <button
                                type="button"
                                onClick={handleCopy}
                                className="text-[11px] font-bold text-[color:var(--color-brand-600)] dark:text-[color:var(--color-brand-400)] hover:underline flex items-center gap-1"
                            >
                                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                <span>{copied ? 'Copied' : 'Copy Link'}</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
