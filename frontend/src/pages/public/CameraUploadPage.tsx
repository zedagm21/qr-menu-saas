import React, { useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Camera, Image as ImageIcon, CheckCircle2, RotateCcw, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { uploadSessionApi } from '../../services/api';
import { compressImage, isHeicFile } from '../../lib/imageCompression';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export default function CameraUploadPage() {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('session');
    const token = searchParams.get('token');

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isConverting, setIsConverting] = useState<boolean>(false);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [uploadPercent, setUploadPercent] = useState<number>(0);
    const [isDone, setIsDone] = useState<boolean>(false);

    const cameraInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            if (isHeicFile(file)) {
                setIsConverting(true);
            }
            const compressed = await compressImage(file);
            setSelectedFile(compressed);
            setPreviewUrl(URL.createObjectURL(compressed));
        } catch (err) {
            console.error('Error processing photo:', err);
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        } finally {
            setIsConverting(false);
            e.target.value = '';
        }
    };

    const handleUpload = async () => {
        if (!sessionId || !token || !selectedFile) {
            toast.error(t('camera_page.missing_session', { defaultValue: 'Invalid or missing session. Please rescan QR code.' }));
            return;
        }

        setIsUploading(true);
        setUploadPercent(0);

        try {
            await uploadSessionApi.uploadPhoto(sessionId, token, selectedFile, (p) => {
                setUploadPercent(p);
            });
            setIsDone(true);
            toast.success(t('camera_page.success_sent', { defaultValue: 'Photo transferred to desktop!' }), {
                icon: '🎉',
                duration: 4000,
            });
        } catch (err: any) {
            console.error('Upload failed:', err);
            const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to upload photo';
            toast.error(msg);
        } finally {
            setIsUploading(false);
        }
    };

    const handleRetake = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setIsDone(false);
        setUploadPercent(0);
    };

    if (!sessionId || !token) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-neutral-900 text-white text-center">
                <div className="w-16 h-16 rounded-3xl bg-neutral-800 flex items-center justify-center text-3xl mb-4">
                    ⚠️
                </div>
                <h1 className="text-xl font-bold mb-2">{t('camera_page.invalid_link', { defaultValue: 'Invalid Camera Link' })}</h1>
                <p className="text-sm text-neutral-400 max-w-xs">
                    {t('camera_page.scan_again', { defaultValue: 'Please scan the QR code displayed on your computer dashboard again.' })}
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-neutral-950 text-white selection:bg-amber-500">
            {/* Top Bar */}
            <div className="h-16 px-5 border-b border-white/10 flex items-center justify-between backdrop-blur-md bg-neutral-950/80 sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center shadow-lg">
                        <Camera className="w-4 h-4 text-black" />
                    </div>
                    <span className="font-extrabold text-sm tracking-wide uppercase">{t('camera_page.title', { defaultValue: 'Menu Camera Companion' })}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{t('camera_page.connected', { defaultValue: 'Connected' })}</span>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col justify-center items-center p-6 max-w-md mx-auto w-full text-center">
                {isDone ? (
                    <div className="space-y-6 animate-scale-up py-8">
                        <div className="w-24 h-24 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-2xl border border-emerald-500/30">
                            <CheckCircle2 className="w-14 h-14 stroke-[2.5]" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tight">
                                {t('camera_page.photo_transferred', { defaultValue: 'Sent to Computer!' })}
                            </h2>
                            <p className="text-sm text-neutral-400 mt-2">
                                {t('camera_page.received_on_desktop', { defaultValue: 'Your desktop session received the photo and applied it to the menu item.' })}
                            </p>
                        </div>
                        {previewUrl && (
                            <div className="w-44 h-44 mx-auto rounded-3xl overflow-hidden shadow-2xl border-2 border-emerald-500">
                                <img src={previewUrl} alt="Transferred" className="w-full h-full object-cover" />
                            </div>
                        )}
                        <button
                            onClick={handleRetake}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition-all active:scale-95 cursor-pointer"
                        >
                            <RotateCcw className="w-4 h-4" />
                            <span>{t('camera_page.snap_another', { defaultValue: 'Snap Another Photo' })}</span>
                        </button>
                    </div>
                ) : previewUrl ? (
                    <div className="space-y-6 w-full animate-fade-in">
                        <div>
                            <h2 className="text-xl font-bold tracking-tight text-white">{t('camera_page.preview_title', { defaultValue: 'Review Photo' })}</h2>
                            <p className="text-xs text-neutral-400 mt-1">{t('camera_page.preview_sub', { defaultValue: 'Make sure the food is clear and well-lit' })}</p>
                        </div>

                        {/* Image Preview Container */}
                        <div className="relative w-full aspect-square rounded-3xl overflow-hidden shadow-2xl border border-white/20 bg-neutral-900">
                            <img src={previewUrl} alt="Captured preview" className="w-full h-full object-cover" />
                            {isUploading && (
                                <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center p-6 gap-3">
                                    <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
                                    <span className="text-sm font-bold text-white">Sending to Computer... {uploadPercent}%</span>
                                    <div className="w-48 h-2 bg-white/20 rounded-full overflow-hidden">
                                        <div className="h-full bg-amber-500 transition-all duration-300 rounded-full" style={{ width: `${uploadPercent}%` }} />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <button
                                type="button"
                                onClick={handleRetake}
                                disabled={isUploading}
                                className="h-14 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                            >
                                <RotateCcw className="w-4 h-4" />
                                <span>{t('camera_page.retake', { defaultValue: 'Retake' })}</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleUpload}
                                disabled={isUploading}
                                className="h-14 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                            >
                                <span>{t('camera_page.send_desktop', { defaultValue: 'Send to Computer' })}</span>
                                <ArrowRight className="w-4 h-4 stroke-[3]" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8 w-full">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/20 mb-1">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>{t('camera_page.ready_to_snap', { defaultValue: 'Ready to Snap' })}</span>
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                                {t('camera_page.take_dish_photo', { defaultValue: 'Take Food Photo' })}
                            </h2>
                            <p className="text-sm text-neutral-400 max-w-xs mx-auto">
                                {t('camera_page.instruction', { defaultValue: 'Take a photo of the dish with your camera or select an existing photo from your gallery.' })}
                            </p>
                        </div>

                        {/* Loading indicator if converting HEIC */}
                        {isConverting && (
                            <div className="flex items-center justify-center gap-2 py-4 text-amber-400 text-sm font-bold">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>{t('camera_page.optimizing', { defaultValue: 'Optimizing photo for menu...' })}</span>
                            </div>
                        )}

                        {/* Large Action Buttons */}
                        <div className="space-y-4">
                            {/* Primary: Direct Camera Capture */}
                            <button
                                type="button"
                                onClick={() => cameraInputRef.current?.click()}
                                disabled={isConverting}
                                className="w-full h-20 rounded-3xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:brightness-110 text-neutral-950 font-black text-lg flex items-center justify-center gap-3.5 shadow-xl shadow-amber-500/20 active:scale-[0.98] transition-all cursor-pointer"
                            >
                                <div className="w-10 h-10 rounded-2xl bg-black/10 flex items-center justify-center">
                                    <Camera className="w-6 h-6 stroke-[2.5]" />
                                </div>
                                <span>{t('camera_page.btn_take_photo', { defaultValue: 'Take Live Photo' })}</span>
                            </button>

                            {/* Secondary: Choose from Gallery */}
                            <button
                                type="button"
                                onClick={() => galleryInputRef.current?.click()}
                                disabled={isConverting}
                                className="w-full h-14 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all cursor-pointer border border-white/10"
                            >
                                <ImageIcon className="w-4 h-4 text-neutral-400" />
                                <span>{t('camera_page.btn_choose_gallery', { defaultValue: 'Choose from Photo Gallery' })}</span>
                            </button>
                        </div>

                        {/* Hidden file inputs */}
                        <input
                            ref={cameraInputRef}
                            type="file"
                            accept="image/*,image/heic,image/heif,.heic,.heif"
                            capture="environment"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <input
                            ref={galleryInputRef}
                            type="file"
                            accept="image/*,image/heic,image/heif,.heic,.heif"
                            onChange={handleFileChange}
                            className="hidden"
                        />

                        <p className="text-[11px] text-neutral-500 font-medium">
                            {t('camera_page.supported_note', { defaultValue: 'Supports iPhone HEIC, Samsung, Android, PNG & JPEG' })}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
