import React from 'react';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
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

export type QRCardScale = 'full' | 'sheet_1' | 'sheet_2' | 'sheet_4' | 'sheet_6';

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
    isVector = false,
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

    const qrSize = isFull ? 190 : isS1 ? 120 : isS2 ? 72 : isS4 ? 48 : 36;
    const logoPx = Math.max(Math.round(qrSize * 0.20), 8);

    const imageSettings = activeLogo
        ? {
            src: activeLogo,
            height: logoPx,
            width: logoPx,
            excavate: true,
            crossOrigin: 'anonymous' as const,
        }
        : undefined;

    const QRComponent = isVector ? QRCodeSVG : (isFull ? QRCodeCanvas : QRCodeSVG);

    // ── Template 1: Modern Minimal ──
    if (config.template === 'modern') {
        return (
            <div
                className={cn(
                    'w-full rounded-2xl shadow-sm border transition-all duration-200 flex flex-col items-center text-center relative overflow-hidden',
                    isFull && 'max-w-[340px] rounded-3xl p-6 sm:p-7 shadow-2xl border',
                    isS1 && 'p-6 rounded-2xl',
                    isS2 && 'p-4 rounded-xl',
                    isS4 && 'p-2 rounded-lg',
                    isS6 && 'p-1.5 rounded-md',
                    className
                )}
                style={{
                    backgroundColor: config.cardBgColor || '#ffffff',
                    borderColor: `${config.fgColor}25`,
                }}
            >
                <div
                    className={cn('absolute top-0 left-0 right-0', isFull || isS1 ? 'h-2' : 'h-1')}
                    style={{ backgroundColor: config.fgColor }}
                />

                {isFull && hasCustomLogo && resolvedLogo && (
                    <div className="w-12 h-12 rounded-xl p-1 bg-white shadow-xs border border-neutral-100 mb-2 overflow-hidden">
                        <img src={resolvedLogo} alt="Logo" className="w-full h-full object-cover rounded-lg" />
                    </div>
                )}

                <h2
                    className={cn(
                        'font-black tracking-tight truncate max-w-full',
                        isFull && 'text-xl mb-1',
                        isS1 && 'text-sm mb-1',
                        isS2 && 'text-xs mb-0.5',
                        isS4 && 'text-[9px] mb-0.5',
                        isS6 && 'text-[8px] mb-0.5'
                    )}
                    style={{ color: config.fgColor }}
                >
                    {config.restaurantName || 'Restaurant Name'}
                </h2>

                {config.showSubtitle && config.subText && (
                    <p className={cn(
                        'font-semibold text-neutral-500 truncate max-w-full',
                        isFull ? 'text-xs mb-3' : isS1 ? 'text-[11px] mb-2' : 'text-[7px] mb-1'
                    )}>
                        {config.subText}
                    </p>
                )}

                <div
                    className={cn(
                        'rounded-xl shadow-inner border bg-white flex items-center justify-center',
                        isFull ? 'p-3.5 my-2 rounded-2xl' : 'p-1 my-0.5'
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
                        'rounded-xl font-black uppercase tracking-wider flex items-center justify-center gap-1 shadow-xs text-center leading-snug w-full',
                        isFull ? 'mt-4 px-4 py-2 text-[11px] rounded-2xl' : isS1 ? 'mt-2 px-3 py-1 text-[9px]' : 'mt-1 px-1.5 py-0.5 text-[6.5px]'
                    )}
                    style={{
                        backgroundColor: `${config.fgColor}15`,
                        color: config.fgColor,
                    }}
                >
                    {isFull && <Smartphone className="w-3.5 h-3.5 flex-shrink-0" />}
                    <span className="break-words">{config.ctaText || 'Scan to View Menu • የምግብ ዝርዝር ለማየት በስልክዎ ስካን ያድርጉ'}</span>
                </div>

                {config.showWifi && config.wifiName && (isFull || isS1 || isS2) && (
                    <div className={cn('text-neutral-400 font-medium flex items-center gap-1', isFull ? 'mt-3 text-[11px]' : 'mt-1 text-[8px]')}>
                        <Wifi className={isFull ? 'w-3 h-3' : 'w-2 h-2'} />
                        <span>Wi-Fi: <strong className="text-neutral-700">{config.wifiName}</strong></span>
                    </div>
                )}
            </div>
        );
    }

    // ── Template 2: Luxe Dining ──
    if (config.template === 'luxe') {
        return (
            <div
                className={cn(
                    'w-full rounded-2xl shadow-sm border transition-all duration-200 flex flex-col items-center text-center relative overflow-hidden bg-neutral-950 text-white',
                    isFull && 'max-w-[340px] rounded-3xl p-6 sm:p-8 shadow-2xl border-2',
                    isS1 && 'p-6 rounded-2xl border-2',
                    isS2 && 'p-4 rounded-xl border',
                    isS4 && 'p-2 rounded-lg border',
                    isS6 && 'p-1.5 rounded-md border',
                    className
                )}
                style={{ borderColor: config.fgColor }}
            >
                {/* Decorative border */}
                <div
                    className={cn(
                        'absolute rounded-xl border border-dashed pointer-events-none opacity-40',
                        isFull ? 'inset-2.5 rounded-2xl' : 'inset-1'
                    )}
                    style={{ borderColor: config.fgColor }}
                />

                <div className={cn('flex items-center gap-1', isFull ? 'mb-2' : 'mb-0.5')}>
                    <Sparkles className={isFull ? 'w-3.5 h-3.5' : 'w-2 h-2'} style={{ color: config.fgColor }} />
                    <span
                        className={cn('font-black uppercase tracking-widest', isFull ? 'text-[10px]' : 'text-[6px]')}
                        style={{ color: config.fgColor }}
                    >
                        Exquisite Dining
                    </span>
                    <Sparkles className={isFull ? 'w-3.5 h-3.5' : 'w-2 h-2'} style={{ color: config.fgColor }} />
                </div>

                <h2
                    className={cn(
                        'font-serif font-black tracking-wide text-white truncate max-w-full',
                        isFull && 'text-2xl mb-1',
                        isS1 && 'text-sm mb-1',
                        isS2 && 'text-xs mb-0.5',
                        isS4 && 'text-[9px] mb-0.5',
                        isS6 && 'text-[8px] mb-0.5'
                    )}
                >
                    {config.restaurantName || 'Restaurant Name'}
                </h2>

                {config.showSubtitle && config.subText && (
                    <p className={cn(
                        'font-medium text-neutral-400 tracking-wider uppercase truncate max-w-full',
                        isFull ? 'text-[11px] mb-3' : isS1 ? 'text-[9px] mb-2' : 'text-[6.5px] mb-1'
                    )}>
                        {config.subText}
                    </p>
                )}

                <div
                    className={cn('rounded-xl bg-white shadow-2xl border flex items-center justify-center relative', isFull ? 'p-3.5 my-2 rounded-2xl border-2' : 'p-1 my-0.5')}
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

                <div className={cn('text-center leading-snug w-full px-1', isFull ? 'mt-4' : 'mt-1')}>
                    <p className={cn('font-bold tracking-wider uppercase text-white', isFull ? 'text-xs' : isS1 ? 'text-[9px]' : 'text-[6.5px]')}>
                        {config.ctaText || 'Scan to View Menu • የምግብ ዝርዝር ለማየት በስልክዎ ስካን ያድርጉ'}
                    </p>
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
                    className={cn('text-center text-white flex flex-col items-center justify-center relative shadow-xs', isFull ? 'p-4' : isS1 ? 'p-2.5' : 'p-1')}
                    style={{ backgroundColor: config.fgColor }}
                >
                    <Utensils className={isFull ? 'w-4 h-4 mb-0.5 opacity-90' : 'w-2 h-2 opacity-90'} />
                    <h2 className={cn('font-black tracking-tight truncate max-w-full', isFull ? 'text-base' : isS1 ? 'text-xs' : 'text-[8.5px]')}>
                        {config.restaurantName || 'Restaurant Name'}
                    </h2>
                </div>

                <div className={cn('flex flex-col items-center text-center', isFull ? 'p-5' : isS1 ? 'p-3' : 'p-1.5')}>
                    <div className={cn('rounded-xl bg-neutral-50 border border-neutral-200 shadow-inner flex items-center justify-center', isFull ? 'p-3 my-1.5' : 'p-1 my-0.5')}>
                        <QRComponent
                            value={menuUrl}
                            size={qrSize}
                            level={errorLevel}
                            fgColor={config.fgColor}
                            bgColor="#f9fafb"
                            imageSettings={imageSettings}
                        />
                    </div>

                    <div className={cn('text-center w-full px-1', isFull ? 'mt-3 space-y-1' : 'mt-1')}>
                        <h3 className={cn('font-black text-neutral-900 leading-snug', isFull ? 'text-xs' : isS1 ? 'text-[9px]' : 'text-[7px]')}>
                            {config.ctaText || 'Scan to View Menu • የምግብ ዝርዝር ለማየት በስልክዎ ስካን ያድርጉ'}
                        </h3>
                        {config.showSubtitle && config.subText && (
                            <p className={cn('font-medium text-neutral-500 truncate max-w-full', isFull ? 'text-xs' : 'text-[6.5px]')}>
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
                isFull && 'max-w-[320px] rounded-3xl p-6 sm:p-7 shadow-2xl',
                isS1 && 'p-6 rounded-2xl',
                isS2 && 'p-4 rounded-xl',
                isS4 && 'p-2 rounded-lg',
                isS6 && 'p-1.5 rounded-md',
                className
            )}
        >
            <div className={cn('rounded-xl bg-white shadow-xs border border-neutral-200 flex items-center justify-center', isFull ? 'p-3.5 mb-3 rounded-2xl' : 'p-1 mb-1')}>
                <QRComponent
                    value={menuUrl}
                    size={qrSize}
                    level={errorLevel}
                    fgColor={config.fgColor}
                    bgColor="#ffffff"
                    imageSettings={imageSettings}
                />
            </div>

            <h3 className={cn('font-black text-neutral-900 truncate max-w-full', isFull ? 'text-base mb-1' : isS1 ? 'text-xs' : 'text-[8.5px]')}>
                {config.restaurantName || 'Restaurant Menu'}
            </h3>
            <p className={cn('font-bold text-neutral-500 uppercase tracking-wider text-center leading-snug max-w-full', isFull ? 'text-xs' : isS1 ? 'text-[8px]' : 'text-[6.5px]')}>
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
    isVector = false,
}) => {
    return (
        <div ref={canvasRef} className="w-full flex items-center justify-center p-2 sm:p-4">
            <QRCardItem
                config={config}
                menuUrl={menuUrl}
                logoUrl={logoUrl}
                scale="full"
                isVector={isVector}
            />
        </div>
    );
};
