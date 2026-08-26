import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QRStyleConfig, getFallbackLogo, resolveImageUrl } from './QRDesignerPreview';
import { Utensils, Smartphone, Wifi } from 'lucide-react';

interface QRPrintSheetProps {
    config: QRStyleConfig;
    menuUrl: string;
    logoUrl?: string | null;
    copies?: number;
}

export const QRPrintSheet: React.FC<QRPrintSheetProps> = ({
    config,
    menuUrl,
    logoUrl,
    copies = 2,
}) => {
    const rawLogo = config.customLogoUrl || logoUrl;
    const resolvedLogo = resolveImageUrl(rawLogo) || (config.includeLogo ? getFallbackLogo(config.restaurantName, config.fgColor) : null);
    const activeLogo = config.includeLogo ? resolvedLogo : null;
    const errorLevel = activeLogo ? 'H' : 'Q';
    const imageSettings = activeLogo
        ? {
            src: activeLogo,
            height: 36,
            width: 36,
            excavate: true,
        }
        : undefined;

    const cards = Array.from({ length: copies });

    return (
        <div id="print-sheet" className="hidden print:block print:w-full print:p-0">
            <style>{`
                @media print {
                    body * {
                        visibility: hidden !important;
                    }
                    #print-sheet, #print-sheet * {
                        visibility: visible !important;
                    }
                    #print-sheet {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 10mm !important;
                        background: white !important;
                    }
                    @page {
                        size: A4 portrait;
                        margin: 8mm;
                    }
                }
            `}</style>

            <div className="text-center mb-6 border-b pb-4 border-neutral-200">
                <h1 className="text-xl font-bold text-neutral-800">{config.restaurantName} — Printable Table Stand Cards</h1>
                <p className="text-xs text-neutral-500">Cut along dashed lines and fold down the center for double-sided table display.</p>
            </div>

            <div className="grid grid-cols-2 gap-8 items-start">
                {cards.map((_, idx) => (
                    <div
                        key={idx}
                        className="border-2 border-dashed border-neutral-300 rounded-3xl p-6 flex flex-col items-center text-center relative bg-white text-neutral-900 break-inside-avoid"
                    >
                        {/* Cut mark indicator */}
                        <span className="absolute -top-3 left-6 bg-white px-2 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                            ✂ Cut Here
                        </span>

                        {activeLogo && (
                            <img
                                src={activeLogo}
                                alt="Logo"
                                className="w-12 h-12 rounded-xl object-cover mb-2 border border-neutral-200 shadow-xs"
                            />
                        )}

                        <h2 className="text-lg font-black text-neutral-900 tracking-tight mb-0.5">
                            {config.restaurantName || 'Restaurant Menu'}
                        </h2>
                        {config.showSubtitle && config.subText && (
                            <p className="text-xs font-semibold text-neutral-500 mb-4">
                                {config.subText}
                            </p>
                        )}
                        {!config.showSubtitle && <div className="mb-2" />}

                        <div className="p-3 bg-white rounded-2xl border border-neutral-200 shadow-sm mb-3">
                            <QRCodeSVG
                                value={menuUrl}
                                size={150}
                                level={errorLevel}
                                fgColor={config.fgColor}
                                bgColor="#ffffff"
                                imageSettings={imageSettings}
                            />
                        </div>

                        <div
                            className="px-3.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider mb-2"
                            style={{
                                backgroundColor: `${config.fgColor}15`,
                                color: config.fgColor,
                            }}
                        >
                            {config.ctaText || 'Scan to View Menu • የምግብ ዝርዝር ለማየት በስልክዎ ስካን ያድርጉ'}
                        </div>

                        {config.showWifi && config.wifiName && (
                            <p className="text-[10px] text-neutral-500 font-medium">
                                Wi-Fi: <strong className="text-neutral-800">{config.wifiName}</strong>
                            </p>
                        )}

                        <span className="text-[9px] text-neutral-400 font-mono mt-2">
                            {menuUrl}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};
