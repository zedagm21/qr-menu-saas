import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Sparkles, Utensils, Smartphone, Wifi } from 'lucide-react';
import { cn } from '../../../lib/utils';

export type QRTemplateId = 'modern' | 'luxe' | 'table_tent' | 'minimal';

export interface QRStyleConfig {
    template: QRTemplateId;
    fgColor: string;
    bgColor: string;
    cardBgColor: string;
    includeLogo: boolean;
    centerIcon: 'logo' | 'utensils' | 'none';
    customLogoUrl?: string;
    ctaText: string;
    showSubtitle?: boolean;
    subText?: string;
    restaurantName: string;
    tableNumber?: string;
    showWifi: boolean;
    wifiName?: string;
}

export type QRCardScale =
    | 'full'
    | 'sheet_1'
    | 'sheet_2'
    | 'sheet_4'
    | 'sheet_6'
    | 'print_1'
    | 'print_2'
    | 'print_4'
    | 'print_6';

export interface QRCardItemProps {
    config: QRStyleConfig;
    menuUrl: string;
    logoUrl?: string | null;
    scale?: QRCardScale;
    isVector?: boolean;
    className?: string;
}

export interface QRDesignerPreviewProps {
    config: QRStyleConfig;
    menuUrl: string;
    logoUrl?: string | null;
    canvasRef?: React.RefObject<HTMLDivElement>;
    isVector?: boolean;
}

export const getFallbackLogo = (name?: string, color: string = '#18181b') => {
    const initial = (name || 'R').trim().charAt(0).toUpperCase() || 'R';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
        <rect width="96" height="96" rx="28" fill="#ffffff" stroke="${color}" stroke-width="6"/>
        <text x="48" y="62" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="44" font-weight="900" text-anchor="middle" fill="${color}">${initial}</text>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const resolveImageUrl = (url?: string | null) => {
    if (!url) return null;
    if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    if (url.startsWith('/')) {
        return `${window.location.origin}${url}`;
    }
    return `${window.location.origin}/${url}`;
};

export const QRCardItem: React.FC<QRCardItemProps> = ({
    config,
    menuUrl,
    logoUrl,
    scale = 'full',
    className,
}) => {
    const rawLogo = config.customLogoUrl || logoUrl;
    const resolvedLogo = resolveImageUrl(rawLogo) || (config.includeLogo ? getFallbackLogo(config.restaurantName, config.fgColor) : null);
    const activeLogo = config.includeLogo ? resolvedLogo : null;
    const hasCustomLogo = Boolean(rawLogo);
    const errorLevel = activeLogo ? 'H' : 'Q';

    // Calculate dimensions based on scale
    const isFull = scale === 'full';
    const isS1 = scale === 'sheet_1';
    const isS2 = scale === 'sheet_2';
    const isS4 = scale === 'sheet_4';
    const isS6 = scale === 'sheet_6';

    const isP1 = scale === 'print_1';
    const isP2 = scale === 'print_2';
    const isP4 = scale === 'print_4';
    const isP6 = scale === 'print_6';
    const isPrint = isP1 || isP2 || isP4 || isP6;

    const qrSize =
        isP1 ? 480 :
        isP2 ? 340 :
        isP4 ? 260 :
        isP6 ? 190 :
        isFull ? 190 :
        isS1 ? 120 :
        isS2 ? 72 :
        isS4 ? 48 : 36;

    const logoPx = Math.max(Math.round(qrSize * 0.20), 8);

    const imageSettings = activeLogo
        ? {
            src: activeLogo,
            height: logoPx,
            width: logoPx,
            excavate: true,
        }
        : undefined;

    const QRComponent = QRCodeCanvas;

    // ── Template 1: Modern Minimal ──
    if (config.template === 'modern') {
        return (
            <div
                className={cn(
                    'w-full rounded-2xl shadow-sm border transition-all duration-200 flex flex-col items-center text-center relative overflow-hidden',
                    isFull && 'max-w-[340px] rounded-3xl p-6 sm:p-7 pt-8 sm:pt-9 shadow-2xl border',
                    isP1 && 'w-full max-w-[880px] p-12 pt-16 rounded-[40px] shadow-none border-4',
                    isP2 && 'w-full max-w-[680px] p-8 pt-12 rounded-[32px] shadow-none border-3',
                    isP4 && 'w-full max-w-[500px] p-6 pt-9 rounded-[24px] shadow-none border-2',
                    isP6 && 'w-full max-w-[400px] p-4 pt-6 rounded-[18px] shadow-none border',
                    isS1 && 'p-6 pt-7 rounded-2xl',
                    isS2 && 'p-4 pt-5 rounded-xl',
                    isS4 && 'p-2 pt-3 rounded-lg',
                    isS6 && 'p-1.5 pt-2 rounded-md',
                    className
                )}
                style={{
                    backgroundColor: config.cardBgColor || '#ffffff',
                    borderColor: `${config.fgColor}25`,
                }}
            >
                {/* Top Accent Strip (locked to top z-0) */}
                <div
                    className={cn(
                        'absolute top-0 left-0 right-0 z-0',
                        isP1 ? 'h-5' : isP2 ? 'h-4' : isP4 ? 'h-3' : isP6 ? 'h-2' : (isFull || isS1 ? 'h-2.5' : 'h-1.5')
                    )}
                    style={{ backgroundColor: config.fgColor }}
                />

                {/* Content Container (z-10 ensures zero border overlap) */}
                <div className="relative z-10 w-full flex flex-col items-center">
                    {(isFull || isPrint) && hasCustomLogo && resolvedLogo && (
                        <div className={cn(
                            'bg-white shadow-xs border border-neutral-100 overflow-hidden flex items-center justify-center',
                            isP1 ? 'w-24 h-24 rounded-2xl mb-4 p-2' :
                            isP2 ? 'w-18 h-18 rounded-2xl mb-3 p-1.5' :
                            isP4 ? 'w-14 h-14 rounded-xl mb-2.5 p-1' :
                            isP6 ? 'w-10 h-10 rounded-lg mb-1.5 p-1' :
                            'w-12 h-12 rounded-xl p-1 mb-2.5'
                        )}>
                            <img src={resolvedLogo} alt="Logo" className="w-full h-full object-cover rounded-lg" />
                        </div>
                    )}

                    <h2
                        className={cn(
                            'font-black tracking-tight break-words max-w-full leading-snug px-1',
                            isP1 ? 'text-5xl mb-3' :
                            isP2 ? 'text-4xl mb-2' :
                            isP4 ? 'text-3xl mb-1.5' :
                            isP6 ? 'text-xl mb-1' :
                            isFull ? 'text-xl mb-1' :
                            isS1 ? 'text-sm mb-1' :
                            isS2 ? 'text-xs mb-0.5' :
                            isS4 ? 'text-[9px] mb-0.5' : 'text-[8px] mb-0.5'
                        )}
                        style={{ color: config.fgColor }}
                    >
                        {config.restaurantName || 'Restaurant Name'}
                    </h2>

                    {config.showSubtitle && config.subText && (
                        <p className={cn(
                            'font-semibold text-neutral-500 break-words max-w-full px-1',
                            isP1 ? 'text-2xl mb-6' :
                            isP2 ? 'text-xl mb-4' :
                            isP4 ? 'text-lg mb-3' :
                            isP6 ? 'text-sm mb-2' :
                            isFull ? 'text-xs mb-3' :
                            isS1 ? 'text-[11px] mb-2' : 'text-[7px] mb-1'
                        )}>
                            {config.subText}
                        </p>
                    )}

                    <div
                        className={cn(
                            'rounded-xl shadow-inner border bg-white flex items-center justify-center',
                            isP1 ? 'p-8 my-4 rounded-3xl border-2' :
                            isP2 ? 'p-6 my-3 rounded-2xl border-2' :
                            isP4 ? 'p-4 my-2.5 rounded-2xl border-2' :
                            isP6 ? 'p-3 my-2 rounded-xl border' :
                            isFull ? 'p-3.5 my-2.5 rounded-2xl' : 'p-1 my-0.5'
                        )}
                        style={{ borderColor: `${config.fgColor}20` }}
                    >
                        <QRComponent
                            value={menuUrl}
                            size={qrSize}
                            level={errorLevel}
                            fgColor={config.fgColor}
                            bgColor="#ffffff"
                            imageSettings={imageSettings}
                        />
                    </div>

                    <div
                        className={cn(
                            'rounded-xl font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs text-center leading-snug w-full',
                            isP1 ? 'mt-8 px-8 py-4 text-2xl rounded-3xl' :
                            isP2 ? 'mt-6 px-6 py-3 text-xl rounded-2xl' :
                            isP4 ? 'mt-4 px-5 py-2.5 text-base rounded-2xl' :
                            isP6 ? 'mt-3 px-3 py-1.5 text-xs rounded-xl' :
                            isFull ? 'mt-4 px-4 py-2.5 text-[11px] rounded-2xl' :
                            isS1 ? 'mt-2 px-3 py-1 text-[9px]' : 'mt-1 px-1.5 py-0.5 text-[6.5px]'
                        )}
                        style={{
                            backgroundColor: `${config.fgColor}15`,
                            color: config.fgColor,
                        }}
                    >
                        {(isFull || isPrint) && <Smartphone className={isP1 ? 'w-6 h-6' : isP2 ? 'w-5 h-5' : isP4 ? 'w-4 h-4' : 'w-3.5 h-3.5'} />}
                        <span className="break-words">{config.ctaText || 'Scan to View Menu • የምግብ ዝርዝር ለማየት በስልክዎ ስካን ያድርጉ'}</span>
                    </div>

                    {config.showWifi && config.wifiName && (isFull || isPrint || isS1 || isS2) && (
                        <div className={cn(
                            'text-neutral-400 font-medium flex items-center gap-1.5',
                            isP1 ? 'mt-6 text-xl' :
                            isP2 ? 'mt-4 text-lg' :
                            isP4 ? 'mt-3 text-sm' :
                            isP6 ? 'mt-2 text-xs' :
                            isFull ? 'mt-3 text-[11px]' : 'mt-1 text-[8px]'
                        )}>
                            <Wifi className={isP1 ? 'w-5 h-5' : isP2 ? 'w-4 h-4' : 'w-3 h-3'} />
                            <span>Wi-Fi: <strong className="text-neutral-700">{config.wifiName}</strong></span>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ── Template 2: Luxe Dining ──
    if (config.template === 'luxe') {
        return (
            <div
                className={cn(
                    'w-full rounded-2xl shadow-sm border transition-all duration-200 flex flex-col items-center text-center relative overflow-hidden bg-neutral-950 text-white',
                    isFull && 'max-w-[340px] rounded-3xl p-7 sm:p-8 shadow-2xl border-2',
                    isP1 && 'w-full max-w-[880px] p-14 rounded-[40px] shadow-none border-4',
                    isP2 && 'w-full max-w-[680px] p-10 rounded-[32px] shadow-none border-3',
                    isP4 && 'w-full max-w-[500px] p-7 rounded-[24px] shadow-none border-2',
                    isP6 && 'w-full max-w-[400px] p-5 rounded-[18px] shadow-none border',
                    isS1 && 'p-6 rounded-2xl border-2',
                    isS2 && 'p-4 rounded-xl border',
                    isS4 && 'p-2 rounded-lg border',
                    isS6 && 'p-1.5 rounded-md border',
                    className
                )}
                style={{ borderColor: config.fgColor }}
            >
                {/* Decorative Dashed Border (framed cleanly at z-0) */}
                <div
                    className={cn(
                        'absolute rounded-xl border border-dashed pointer-events-none opacity-40 z-0',
                        isP1 ? 'inset-6 rounded-3xl' : isP2 ? 'inset-5 rounded-2xl' : isP4 ? 'inset-3.5 rounded-xl' : isFull ? 'inset-3 rounded-2xl' : 'inset-1'
                    )}
                    style={{ borderColor: config.fgColor }}
                />

                {/* Content Container (z-10 guarantees no border crosses text) */}
                <div className="relative z-10 w-full flex flex-col items-center">
                    <div className={cn('flex items-center gap-1.5', isP1 ? 'mb-4' : isP2 ? 'mb-3' : isP4 ? 'mb-2' : isFull ? 'mb-2' : 'mb-0.5')}>
                        <Sparkles className={isP1 ? 'w-6 h-6' : isP2 ? 'w-5 h-5' : isP4 ? 'w-4 h-4' : 'w-3.5 h-3.5'} style={{ color: config.fgColor }} />
                        <span
                            className={cn(
                                'font-black uppercase tracking-widest',
                                isP1 ? 'text-lg' : isP2 ? 'text-base' : isP4 ? 'text-xs' : isFull ? 'text-[10px]' : 'text-[6px]'
                            )}
                            style={{ color: config.fgColor }}
                        >
                            Exquisite Dining
                        </span>
                        <Sparkles className={isP1 ? 'w-6 h-6' : isP2 ? 'w-5 h-5' : isP4 ? 'w-4 h-4' : 'w-3.5 h-3.5'} style={{ color: config.fgColor }} />
                    </div>

                    <h2
                        className={cn(
                            'font-serif font-black tracking-wide text-white break-words max-w-full leading-snug px-1',
                            isP1 ? 'text-5xl mb-3' :
                            isP2 ? 'text-4xl mb-2' :
                            isP4 ? 'text-3xl mb-1.5' :
                            isP6 ? 'text-xl mb-1' :
                            isFull ? 'text-2xl mb-1' :
                            isS1 ? 'text-sm mb-1' :
                            isS2 ? 'text-xs mb-0.5' :
                            isS4 ? 'text-[9px] mb-0.5' : 'text-[8px] mb-0.5'
                        )}
                    >
                        {config.restaurantName || 'Restaurant Name'}
                    </h2>

                    {config.showSubtitle && config.subText && (
                        <p className={cn(
                            'font-medium text-neutral-400 tracking-wider uppercase break-words max-w-full px-1',
                            isP1 ? 'text-xl mb-6' :
                            isP2 ? 'text-lg mb-4' :
                            isP4 ? 'text-sm mb-3' :
                            isFull ? 'text-[11px] mb-3' :
                            isS1 ? 'text-[9px] mb-2' : 'text-[6.5px] mb-1'
                        )}>
                            {config.subText}
                        </p>
                    )}

                    <div
                        className={cn(
                            'rounded-xl bg-white shadow-2xl border flex items-center justify-center relative',
                            isP1 ? 'p-8 my-4 rounded-3xl border-4' :
                            isP2 ? 'p-6 my-3 rounded-2xl border-3' :
                            isP4 ? 'p-4 my-2.5 rounded-2xl border-2' :
                            isP6 ? 'p-3 my-2 rounded-xl border' :
                            isFull ? 'p-3.5 my-2 rounded-2xl border-2' : 'p-1 my-0.5'
                        )}
                        style={{ borderColor: config.fgColor }}
                    >
                        <QRComponent
                            value={menuUrl}
                            size={qrSize}
                            level={errorLevel}
                            fgColor={config.fgColor === '#ffffff' ? '#000000' : config.fgColor}
                            bgColor="#ffffff"
                            imageSettings={imageSettings}
                        />
                    </div>

                    <div className={cn('text-center leading-snug w-full px-1', isP1 ? 'mt-8' : isP2 ? 'mt-6' : isP4 ? 'mt-4' : isFull ? 'mt-4' : 'mt-1')}>
                        <p className={cn(
                            'font-bold tracking-wider uppercase text-white',
                            isP1 ? 'text-2xl' : isP2 ? 'text-xl' : isP4 ? 'text-base' : isFull ? 'text-xs' : isS1 ? 'text-[9px]' : 'text-[6.5px]'
                        )}>
                            {config.ctaText || 'Scan to View Menu • የምግብ ዝርዝር ለማየት በስልክዎ ስካን ያድርጉ'}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // ── Template 3: Foldable Table Stand / Tent ──
    if (config.template === 'table_tent') {
        return (
            <div
                className={cn(
                    'w-full rounded-2xl shadow-sm border transition-all duration-200 flex flex-col overflow-hidden text-neutral-900 bg-white',
                    isFull && 'max-w-[340px] rounded-3xl shadow-2xl border',
                    isP1 && 'w-full max-w-[880px] rounded-[40px] shadow-none border-4',
                    isP2 && 'w-full max-w-[680px] rounded-[32px] shadow-none border-3',
                    isP4 && 'w-full max-w-[500px] rounded-[24px] shadow-none border-2',
                    isP6 && 'w-full max-w-[400px] rounded-[18px] shadow-none border',
                    isS1 && 'rounded-2xl',
                    isS2 && 'rounded-xl',
                    isS4 && 'rounded-lg',
                    isS6 && 'rounded-md',
                    className
                )}
                style={{ borderColor: `${config.fgColor}30` }}
            >
                {/* Header Banner */}
                <div
                    className={cn(
                        'text-center text-white flex flex-col items-center justify-center relative shadow-xs',
                        isP1 ? 'p-8' : isP2 ? 'p-6' : isP4 ? 'p-4' : isFull ? 'p-4' : isS1 ? 'p-2.5' : 'p-1'
                    )}
                    style={{ backgroundColor: config.fgColor }}
                >
                    <Utensils className={isP1 ? 'w-8 h-8 mb-1.5 opacity-90' : isP2 ? 'w-6 h-6 mb-1 opacity-90' : isFull ? 'w-4 h-4 mb-0.5 opacity-90' : 'w-2 h-2 opacity-90'} />
                    <h2 className={cn(
                        'font-black tracking-tight break-words max-w-full leading-snug px-1',
                        isP1 ? 'text-4xl' : isP2 ? 'text-3xl' : isP4 ? 'text-2xl' : isFull ? 'text-base' : isS1 ? 'text-xs' : 'text-[8.5px]'
                    )}>
                        {config.restaurantName || 'Restaurant Name'}
                    </h2>
                </div>

                <div className={cn(
                    'flex flex-col items-center text-center',
                    isP1 ? 'p-10' : isP2 ? 'p-8' : isP4 ? 'p-6' : isFull ? 'p-5' : isS1 ? 'p-3' : 'p-1.5'
                )}>
                    <div className={cn(
                        'rounded-xl bg-neutral-50 border border-neutral-200 shadow-inner flex items-center justify-center',
                        isP1 ? 'p-8 my-4 rounded-3xl' :
                        isP2 ? 'p-6 my-3 rounded-2xl' :
                        isP4 ? 'p-4 my-2.5 rounded-2xl' :
                        isFull ? 'p-3 my-1.5' : 'p-1 my-0.5'
                    )}>
                        <QRComponent
                            value={menuUrl}
                            size={qrSize}
                            level={errorLevel}
                            fgColor={config.fgColor}
                            bgColor="#f9fafb"
                            imageSettings={imageSettings}
                        />
                    </div>

                    <div className={cn('text-center w-full px-1', isP1 ? 'mt-8 space-y-2' : isP2 ? 'mt-6 space-y-1.5' : isP4 ? 'mt-4 space-y-1' : isFull ? 'mt-3 space-y-1' : 'mt-1')}>
                        <h3 className={cn(
                            'font-black text-neutral-900 leading-snug',
                            isP1 ? 'text-3xl' : isP2 ? 'text-2xl' : isP4 ? 'text-lg' : isFull ? 'text-xs' : isS1 ? 'text-[9px]' : 'text-[7px]'
                        )}>
                            {config.ctaText || 'Scan to View Menu • የምግብ ዝርዝር ለማየት በስልክዎ ስካን ያድርጉ'}
                        </h3>
                        {config.showSubtitle && config.subText && (
                            <p className={cn(
                                'font-medium text-neutral-500 break-words max-w-full px-1',
                                isP1 ? 'text-xl' : isP2 ? 'text-base' : isP4 ? 'text-sm' : isFull ? 'text-xs' : 'text-[6.5px]'
                            )}>
                                {config.subText}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ── Template 4: Polaroid Minimal ──
    return (
        <div
            className={cn(
                'w-full rounded-2xl shadow-sm border border-neutral-200 bg-white transition-all duration-200 flex flex-col items-center text-center',
                isFull && 'max-w-[320px] rounded-3xl p-6 sm:p-7 pt-8 sm:pt-9 shadow-2xl',
                isP1 && 'w-full max-w-[880px] p-12 pt-16 rounded-[40px] shadow-none border-4',
                isP2 && 'w-full max-w-[680px] p-8 pt-12 rounded-[32px] shadow-none border-3',
                isP4 && 'w-full max-w-[500px] p-6 pt-9 rounded-[24px] shadow-none border-2',
                isP6 && 'w-full max-w-[400px] p-4 pt-6 rounded-[18px] shadow-none border',
                isS1 && 'p-6 rounded-2xl',
                isS2 && 'p-4 rounded-xl',
                isS4 && 'p-2 rounded-lg',
                isS6 && 'p-1.5 rounded-md',
                className
            )}
        >
            <div className={cn(
                'rounded-xl bg-white shadow-xs border border-neutral-200 flex items-center justify-center',
                isP1 ? 'p-8 mb-6 rounded-3xl border-2' :
                isP2 ? 'p-6 mb-4 rounded-2xl border-2' :
                isP4 ? 'p-4 mb-3 rounded-2xl border' :
                isP6 ? 'p-3 mb-2 rounded-xl border' :
                isFull ? 'p-3.5 mb-3 rounded-2xl' : 'p-1 mb-1'
            )}>
                <QRComponent
                    value={menuUrl}
                    size={qrSize}
                    level={errorLevel}
                    fgColor={config.fgColor}
                    bgColor="#ffffff"
                    imageSettings={imageSettings}
                />
            </div>

            <h3 className={cn(
                'font-black text-neutral-900 break-words max-w-full leading-snug px-1',
                isP1 ? 'text-4xl mb-2' :
                isP2 ? 'text-3xl mb-1.5' :
                isP4 ? 'text-2xl mb-1' :
                isP6 ? 'text-lg mb-0.5' :
                isFull ? 'text-base mb-1' :
                isS1 ? 'text-xs' : 'text-[8.5px]'
            )}>
                {config.restaurantName || 'Restaurant Menu'}
            </h3>
            <p className={cn(
                'font-bold text-neutral-500 uppercase tracking-wider text-center leading-snug max-w-full',
                isP1 ? 'text-2xl' :
                isP2 ? 'text-xl' :
                isP4 ? 'text-base' :
                isP6 ? 'text-xs' :
                isFull ? 'text-xs' :
                isS1 ? 'text-[8px]' : 'text-[6.5px]'
            )}>
                {config.ctaText || 'Scan to View Menu • የምግብ ዝርዝር ለማየት በስልክዎ ስካን ያድርጉ'}
            </p>
        </div>
    );
};

export const QRDesignerPreview: React.FC<QRDesignerPreviewProps> = ({
    config,
    menuUrl,
    logoUrl,
    canvasRef,
}) => {
    return (
        <div ref={canvasRef} className="w-full flex items-center justify-center p-2 sm:p-4">
            <QRCardItem
                config={config}
                menuUrl={menuUrl}
                logoUrl={logoUrl}
                scale="full"
            />
        </div>
    );
};
