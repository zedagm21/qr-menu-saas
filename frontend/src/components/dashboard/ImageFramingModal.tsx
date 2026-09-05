import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { X, ZoomIn, ZoomOut, RotateCw, Check, RefreshCw, Crop, Move } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import toast from 'react-hot-toast';

export interface ImageFramingModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageSource: string | File | null;
    imageType: 'logo' | 'cover';
    restaurantName?: string;
    onApply: (file: File) => Promise<void> | void;
}

export const ImageFramingModal: React.FC<ImageFramingModalProps> = ({
    isOpen,
    onClose,
    imageSource,
    imageType,
    restaurantName = 'Restaurant',
    onApply,
}) => {
    const { t } = useTranslation();

    const [loadedImg, setLoadedImg] = useState<HTMLImageElement | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isApplying, setIsApplying] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number }>({ x: 0, y: 0, offsetX: 0, offsetY: 0 });

    const viewportRef = useRef<HTMLDivElement>(null);
    const previewCanvasRef = useRef<HTMLCanvasElement>(null);
    const previewCanvas2Ref = useRef<HTMLCanvasElement>(null);

    // Load image from File or URL
    useEffect(() => {
        if (!isOpen || !imageSource) {
            setLoadedImg(null);
            return;
        }

        setIsLoading(true);
        let objectUrl: string | null = null;
        const img = new Image();
        img.crossOrigin = 'anonymous';

        if (imageSource instanceof File) {
            objectUrl = URL.createObjectURL(imageSource);
            img.src = objectUrl;
        } else {
            img.src = imageSource;
        }

        img.onload = () => {
            setLoadedImg(img);
            setIsLoading(false);
            // Reset transforms on new image load
            setZoom(1);
            setRotation(0);
            setOffset({ x: 0, y: 0 });
        };

        img.onerror = () => {
            setIsLoading(false);
            console.error('[ImageFramingModal] Failed to load image');
            toast.error(t('toast.error', { defaultValue: 'Failed to load image for framing' }));
        };

        return () => {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [isOpen, imageSource]);

    // Viewport dimensions in CSS pixels
    const [viewportSize, setViewportSize] = useState({ width: 320, height: 320 });

    useEffect(() => {
        const updateSize = () => {
            if (!viewportRef.current) return;
            const containerWidth = Math.min(window.innerWidth - 64, 540);
            if (imageType === 'logo') {
                const size = Math.min(containerWidth, 320);
                setViewportSize({ width: size, height: size });
            } else {
                // 3:1 aspect ratio
                const width = containerWidth;
                const height = Math.round(width / 3);
                setViewportSize({ width, height });
            }
        };

        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, [imageType, isOpen]);

    // Compute base scale so image always covers the viewport box
    const getBaseMetrics = useCallback(() => {
        if (!loadedImg) return { baseScale: 1, imgWidth: 1, imgHeight: 1 };
        const isRotated = rotation === 90 || rotation === 270;
        const imgWidth = isRotated ? loadedImg.naturalHeight : loadedImg.naturalWidth;
        const imgHeight = isRotated ? loadedImg.naturalWidth : loadedImg.naturalHeight;

        // Scale to cover the viewport
        const scaleX = viewportSize.width / imgWidth;
        const scaleY = viewportSize.height / imgHeight;
        const baseScale = Math.max(scaleX, scaleY);

        return { baseScale, imgWidth, imgHeight };
    }, [loadedImg, rotation, viewportSize]);

    // Clamp offsets so the image doesn't expose empty edges
    const clampOffset = useCallback((x: number, y: number, currentZoom: number) => {
        const { baseScale, imgWidth, imgHeight } = getBaseMetrics();
        const effectiveWidth = imgWidth * baseScale * currentZoom;
        const effectiveHeight = imgHeight * baseScale * currentZoom;

        const maxOffsetX = Math.max(0, (effectiveWidth - viewportSize.width) / 2);
        const maxOffsetY = Math.max(0, (effectiveHeight - viewportSize.height) / 2);

        return {
            x: Math.min(maxOffsetX, Math.max(-maxOffsetX, x)),
            y: Math.min(maxOffsetY, Math.max(-maxOffsetY, y)),
        };
    }, [getBaseMetrics, viewportSize]);

    // Update clamp whenever zoom or rotation changes
    useEffect(() => {
        setOffset((prev) => clampOffset(prev.x, prev.y, zoom));
    }, [zoom, rotation, clampOffset]);

    // Pointer Drag Handlers
    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!loadedImg) return;
        setIsDragging(true);
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        dragStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            offsetX: offset.x,
            offsetY: offset.y,
        };
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDragging) return;
        const deltaX = e.clientX - dragStartRef.current.x;
        const deltaY = e.clientY - dragStartRef.current.y;
        const newX = dragStartRef.current.offsetX + deltaX;
        const newY = dragStartRef.current.offsetY + deltaY;
        setOffset(clampOffset(newX, newY, zoom));
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDragging) return;
        setIsDragging(false);
        try {
            (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        } catch {}
    };

    // Wheel Zoom handler
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const delta = -e.deltaY * 0.0015;
        setZoom((prev) => {
            const next = Math.min(3, Math.max(1, prev + delta));
            return parseFloat(next.toFixed(3));
        });
    };

    // Draw Live Previews onto preview canvases
    const drawPreviewToCanvas = useCallback((canvas: HTMLCanvasElement | null, width: number, height: number) => {
        if (!canvas || !loadedImg) return;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, width, height);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        const { baseScale } = getBaseMetrics();
        const scaleFactor = width / viewportSize.width;

        ctx.save();
        // Move to center of preview canvas
        ctx.translate(width / 2 + offset.x * scaleFactor, height / 2 + offset.y * scaleFactor);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(zoom * scaleFactor * baseScale, zoom * scaleFactor * baseScale);

        // Draw image centered
        ctx.drawImage(
            loadedImg,
            -loadedImg.naturalWidth / 2,
            -loadedImg.naturalHeight / 2,
            loadedImg.naturalWidth,
            loadedImg.naturalHeight
        );
        ctx.restore();
    }, [loadedImg, getBaseMetrics, offset, rotation, zoom, viewportSize]);

    // Update live previews on any change
    useEffect(() => {
        if (!loadedImg) return;
        if (imageType === 'logo') {
            // Preview 1: 96x96 circle badge
            drawPreviewToCanvas(previewCanvasRef.current, 96, 96);
            // Preview 2: 48x48 top bar avatar
            drawPreviewToCanvas(previewCanvas2Ref.current, 48, 48);
        } else {
            // Preview 1: 360x120 desktop banner
            drawPreviewToCanvas(previewCanvasRef.current, 360, 120);
            // Preview 2: 240x80 mobile modal hero
            drawPreviewToCanvas(previewCanvas2Ref.current, 240, 80);
        }
    }, [loadedImg, imageType, drawPreviewToCanvas]);

    // Reset controls
    const handleReset = () => {
        setZoom(1);
        setRotation(0);
        setOffset({ x: 0, y: 0 });
    };

    // Rotate 90 deg clockwise
    const handleRotate = () => {
        setRotation((prev) => (prev + 90) % 360);
    };

    // Apply & Export Cropped File
    const handleApply = async () => {
        if (!loadedImg) return;
        try {
            setIsApplying(true);

            // Export dimensions: High-Res
            const exportWidth = imageType === 'logo' ? 1000 : 1800;
            const exportHeight = imageType === 'logo' ? 1000 : 600;

            const exportCanvas = document.createElement('canvas');
            exportCanvas.width = exportWidth;
            exportCanvas.height = exportHeight;
            const ctx = exportCanvas.getContext('2d');
            if (!ctx) throw new Error('Could not create canvas context');

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            const { baseScale } = getBaseMetrics();
            const exportScaleFactor = exportWidth / viewportSize.width;

            ctx.save();
            ctx.translate(
                exportWidth / 2 + offset.x * exportScaleFactor,
                exportHeight / 2 + offset.y * exportScaleFactor
            );
            ctx.rotate((rotation * Math.PI) / 180);
            ctx.scale(zoom * exportScaleFactor * baseScale, zoom * exportScaleFactor * baseScale);

            ctx.drawImage(
                loadedImg,
                -loadedImg.naturalWidth / 2,
                -loadedImg.naturalHeight / 2,
                loadedImg.naturalWidth,
                loadedImg.naturalHeight
            );
            ctx.restore();

            const blob = await new Promise<Blob | null>((resolve) =>
                exportCanvas.toBlob(resolve, 'image/jpeg', 0.92)
            );

            if (!blob) throw new Error('Canvas export failed');

            const fileName = imageType === 'logo' ? 'restaurant-logo.jpg' : 'restaurant-cover.jpg';
            const croppedFile = new File([blob], fileName, {
                type: 'image/jpeg',
                lastModified: Date.now(),
            });

            await onApply(croppedFile);
            onClose();
        } catch (err) {
            console.error('[ImageFramingModal] Apply failed:', err);
            toast.error(t('toast.error', { defaultValue: 'Failed to process image framing' }));
        } finally {
            setIsApplying(false);
        }
    };

    if (!isOpen) return null;

    const modalTitle = imageType === 'logo'
        ? t('restaurant.adjust_logo_title', { defaultValue: 'Adjust Logo Framing' })
        : t('restaurant.adjust_cover_title', { defaultValue: 'Adjust Cover Image Framing' });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-2xl bg-white dark:bg-[#161616] rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
                
                {/* Modal Header */}
                <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-neutral-100 dark:border-neutral-800/80 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[color:var(--color-brand-500)]/10 dark:bg-[color:var(--color-brand-500)]/20 text-[color:var(--color-brand-500)] flex items-center justify-center">
                            <Crop className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100 leading-tight">
                                {modalTitle}
                            </h3>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                {t('restaurant.crop_hint', { defaultValue: 'Drag to reposition visible area. Use slider or scroll to zoom.' })}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isApplying}
                        className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Modal Body / Canvas Viewport */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col items-center gap-4 select-none">
                    
                    {/* Viewport Frame Container */}
                    <div className="relative flex items-center justify-center w-full max-w-[540px] bg-neutral-950 rounded-2xl p-4 overflow-hidden shadow-inner border border-neutral-800">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center h-48 gap-2 text-neutral-400">
                                <RefreshCw className="w-6 h-6 animate-spin text-[color:var(--color-brand-500)]" />
                                <span className="text-xs font-semibold">Loading photo...</span>
                            </div>
                        ) : (
                            <div
                                ref={viewportRef}
                                onPointerDown={handlePointerDown}
                                onPointerMove={handlePointerMove}
                                onPointerUp={handlePointerUp}
                                onPointerCancel={handlePointerUp}
                                onWheel={handleWheel}
                                style={{
                                    width: `${viewportSize.width}px`,
                                    height: `${viewportSize.height}px`,
                                }}
                                className={cn(
                                    "relative overflow-hidden cursor-grab active:cursor-grabbing touch-none border-2 border-white/80 shadow-2xl",
                                    imageType === 'logo' ? "rounded-2xl" : "rounded-xl"
                                )}
                            >
                                {/* Rendered Image inside Viewport */}
                                {loadedImg && (
                                    <div
                                        style={{
                                            position: 'absolute',
                                            left: '50%',
                                            top: '50%',
                                            transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) rotate(${rotation}deg) scale(${zoom * getBaseMetrics().baseScale})`,
                                            transformOrigin: 'center center',
                                            pointerEvents: 'none',
                                        }}
                                    >
                                        <img
                                            src={loadedImg.src}
                                            alt="Crop preview"
                                            className="max-w-none select-none pointer-events-none"
                                            style={{
                                                width: `${loadedImg.naturalWidth}px`,
                                                height: `${loadedImg.naturalHeight}px`,
                                            }}
                                            draggable={false}
                                        />
                                    </div>
                                )}

                                {/* Rule-of-Thirds Grid Overlay */}
                                <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 border border-white/20">
                                    <div className="border-r border-b border-white/20" />
                                    <div className="border-r border-b border-white/20" />
                                    <div className="border-b border-white/20" />
                                    <div className="border-r border-b border-white/20" />
                                    <div className="border-r border-b border-white/20" />
                                    <div className="border-b border-white/20" />
                                    <div className="border-r border-b border-white/20" />
                                    <div className="border-r border-b border-white/20" />
                                    <div />
                                </div>

                                {/* Circular guide mask overlay for logo */}
                                {imageType === 'logo' && (
                                    <div className="absolute inset-0 rounded-full border-2 border-dashed border-[color:var(--color-brand-400)]/80 pointer-events-none" />
                                )}

                                {/* Floating Drag Indicator Hint */}
                                <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white/80 text-[10px] font-bold pointer-events-none">
                                    <Move className="w-3 h-3" />
                                    <span>Drag to pan</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Interactive Controls Toolbar */}
                    <div className="w-full max-w-[540px] flex items-center justify-between gap-3 bg-neutral-100 dark:bg-neutral-900/90 rounded-2xl p-3 border border-neutral-200/60 dark:border-neutral-800">
                        {/* Zoom Control */}
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <button
                                type="button"
                                onClick={() => setZoom((prev) => Math.max(1, parseFloat((prev - 0.15).toFixed(2))))}
                                disabled={zoom <= 1}
                                className="w-8 h-8 rounded-xl bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 disabled:opacity-40 flex items-center justify-center text-neutral-700 dark:text-neutral-200 shadow-2xs border border-neutral-200/60 dark:border-neutral-700 cursor-pointer"
                                title="Zoom Out"
                            >
                                <ZoomOut className="w-4 h-4" />
                            </button>
                            <input
                                type="range"
                                min="1"
                                max="3"
                                step="0.02"
                                value={zoom}
                                onChange={(e) => setZoom(parseFloat(e.target.value))}
                                className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-[color:var(--color-brand-500)]"
                            />
                            <button
                                type="button"
                                onClick={() => setZoom((prev) => Math.min(3, parseFloat((prev + 0.15).toFixed(2))))}
                                disabled={zoom >= 3}
                                className="w-8 h-8 rounded-xl bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 disabled:opacity-40 flex items-center justify-center text-neutral-700 dark:text-neutral-200 shadow-2xs border border-neutral-200/60 dark:border-neutral-700 cursor-pointer"
                                title="Zoom In"
                            >
                                <ZoomIn className="w-4 h-4" />
                            </button>
                            <span className="text-xs font-mono font-bold text-neutral-600 dark:text-neutral-400 w-11 text-right">
                                {Math.round(zoom * 100)}%
                            </span>
                        </div>

                        {/* Rotate 90 deg */}
                        <button
                            type="button"
                            onClick={handleRotate}
                            className="h-8 px-2.5 rounded-xl bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 flex items-center gap-1.5 text-xs font-bold shadow-2xs border border-neutral-200/60 dark:border-neutral-700 cursor-pointer shrink-0"
                            title={t('restaurant.rotate_90', { defaultValue: 'Rotate 90°' })}
                        >
                            <RotateCw className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">90°</span>
                        </button>

                        {/* Reset */}
                        <button
                            type="button"
                            onClick={handleReset}
                            className="h-8 px-2.5 rounded-xl bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 flex items-center gap-1.5 text-xs font-bold shadow-2xs border border-neutral-200/60 dark:border-neutral-700 cursor-pointer shrink-0"
                            title={t('restaurant.reset', { defaultValue: 'Reset' })}
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{t('restaurant.reset', { defaultValue: 'Reset' })}</span>
                        </button>
                    </div>

                    {/* Live Previews Section */}
                    <div className="w-full max-w-[540px] flex flex-col gap-2 pt-1">
                        <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                            {t('restaurant.live_preview', { defaultValue: 'Live Preview on Menu' })}
                        </span>

                        {imageType === 'logo' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {/* Preview 1: Header top-bar avatar */}
                                <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800 flex items-center gap-2.5">
                                    <canvas
                                        ref={previewCanvas2Ref}
                                        className="w-8 h-8 rounded-full border border-neutral-300 dark:border-neutral-700 shadow-xs shrink-0"
                                    />
                                    <div className="min-w-0">
                                        <span className="text-xs font-black text-neutral-900 dark:text-white truncate block">
                                            {restaurantName}
                                        </span>
                                        <span className="text-[10px] text-neutral-400 block">
                                            {t('restaurant.preview_topbar', { defaultValue: 'Header Avatar' })}
                                        </span>
                                    </div>
                                </div>

                                {/* Preview 2: About Modal Badge */}
                                <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800 flex items-center gap-3">
                                    <canvas
                                        ref={previewCanvasRef}
                                        className="w-12 h-12 rounded-full ring-2 ring-white dark:ring-neutral-800 shadow-md shrink-0"
                                    />
                                    <div className="min-w-0">
                                        <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 block">
                                            {t('restaurant.preview_about_hero', { defaultValue: 'About Modal Badge' })}
                                        </span>
                                        <span className="text-[10px] text-neutral-400 block">
                                            Circular Avatar
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {/* Preview 1: Desktop Banner */}
                                <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800 flex flex-col gap-1.5">
                                    <canvas
                                        ref={previewCanvasRef}
                                        className="w-full h-16 rounded-lg object-cover border border-neutral-200 dark:border-neutral-700 shadow-2xs"
                                    />
                                    <span className="text-[10px] font-bold text-neutral-500 text-center">
                                        {t('restaurant.preview_desktop_banner', { defaultValue: 'Desktop Banner (3:1)' })}
                                    </span>
                                </div>

                                {/* Preview 2: About Modal Hero */}
                                <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800 flex flex-col gap-1.5">
                                    <div className="relative rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700">
                                        <canvas
                                            ref={previewCanvas2Ref}
                                            className="w-full h-16 object-cover"
                                        />
                                        <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                                    </div>
                                    <span className="text-[10px] font-bold text-neutral-500 text-center">
                                        {t('restaurant.preview_modal_hero', { defaultValue: 'About Modal Hero' })}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-2.5 px-5 sm:px-6 py-4 border-t border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-900/50 shrink-0">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isApplying}
                        className="rounded-xl font-bold h-10 px-4"
                    >
                        {t('common.cancel', { defaultValue: 'Cancel' })}
                    </Button>
                    <Button
                        type="button"
                        onClick={handleApply}
                        disabled={!loadedImg || isApplying}
                        isLoading={isApplying}
                        icon={<Check className="w-4 h-4" />}
                        className="rounded-xl font-bold h-10 px-6 bg-[color:var(--color-brand-500)] hover:bg-[color:var(--color-brand-600)] text-white shadow-md shadow-[color:var(--color-brand-500)]/20 cursor-pointer"
                    >
                        {t('restaurant.apply_save', { defaultValue: 'Apply & Save' })}
                    </Button>
                </div>

            </div>
        </div>
    );
};
