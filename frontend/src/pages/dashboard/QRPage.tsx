import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import {
    QrCode, Download, Copy, ExternalLink, RefreshCw,
    Share2, Sparkles, Printer, Palette, Layout,
    Type, Check, Image as ImageIcon, Smartphone, Wifi, ArrowRight
} from 'lucide-react';
import { useQRCodes, useEnsureQRCode } from '../../hooks/useQR';
import { useAuth } from '../../contexts/AuthContext';
import { useRestaurant } from '../../hooks/useRestaurant';
import { useLogoDataUrl } from '../../hooks/useLogoDataUrl';
import { Button } from '../../components/ui/Button';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { QRDesignerPreview, QRStyleConfig, QRTemplateId, resolveImageUrl, getFallbackLogo } from '../../components/dashboard/qr/QRDesignerPreview';
import { QRPrintModal } from '../../components/dashboard/qr/QRPrintModal';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

// Curated color preset themes
const COLOR_PRESETS = [
    { id: 'black', name: 'Classic Charcoal', fg: '#18181b', bg: '#ffffff', accent: '#27272a' },
    { id: 'gold', name: 'Warm Gold', fg: '#d97706', bg: '#ffffff', accent: '#b45309' },
    { id: 'emerald', name: 'Emerald Forest', fg: '#059669', bg: '#ffffff', accent: '#047857' },
    { id: 'midnight', name: 'Midnight Navy', fg: '#0f172a', bg: '#ffffff', accent: '#1e293b' },
    { id: 'ruby', name: 'Ruby Wine', fg: '#dc2626', bg: '#ffffff', accent: '#b91c1c' },
    { id: 'indigo', name: 'Royal Indigo', fg: '#4f46e5', bg: '#ffffff', accent: '#4338ca' },
];

const TEMPLATES: { id: QRTemplateId; name: string; desc: string; icon: string }[] = [
    { id: 'modern', name: 'Modern Minimal', desc: 'Clean card with logo & scan badge', icon: '✨' },
    { id: 'luxe', name: 'Luxe Dining', desc: 'Dark theme with gold double-borders', icon: '👑' },
    { id: 'table_tent', name: 'Table Stand', desc: 'Foldable stand with Wi-Fi & table info', icon: '⛺' },
    { id: 'minimal', name: 'Polaroid Badge', desc: 'Simple, high-contrast frame', icon: '📷' },
];

const LANGUAGE_PRESETS = [
    {
        id: 'bilingual',
        label: '🇪🇹🇬🇧 Bilingual (EN + AM)',
        cta: 'Scan to View Menu • የምግብ ዝርዝር ለማየት በስልክዎ ስካን ያድርጉ',
        sub: 'Contactless Digital Menu • ዲጂታል የምግብ ዝርዝር',
    },
    {
        id: 'en',
        label: '🇬🇧 English Only',
        cta: 'Scan with Camera to View Menu',
        sub: 'Contactless Digital Menu',
    },
    {
        id: 'am',
        label: '🇪🇹 Amharic Only',
        cta: 'የምግብ ዝርዝር ለማየት በስልክዎ ስካን ያድርጉ',
        sub: 'ዲጂታል የምግብ ዝርዝር',
    },
];

export default function QRPage() {
    const { t, i18n } = useTranslation();
    const { user, restaurant: authRestaurant } = useAuth();
    const { data: liveRestaurant } = useRestaurant();
    const restaurant = liveRestaurant || authRestaurant;

    // Pre-fetch the logo and convert to a same-origin data URL so the canvas
    // (QRCodeCanvas + html2canvas) never becomes tainted by cross-origin images.
    const logoDataUrl = useLogoDataUrl(restaurant?.logoUrl);
    // Use the data URL if available, otherwise fall back to the raw URL
    const safeLogoUrl = logoDataUrl ?? restaurant?.logoUrl ?? null;

    const { data: qrCodes, isLoading } = useQRCodes();
    const { mutate: ensure, isPending: isGenerating } = useEnsureQRCode();

    const qr = Array.isArray(qrCodes) ? qrCodes[0] : null;
    const currentSlug = liveRestaurant?.slug || restaurant?.slug;
    const menuUrl = currentSlug ? `${window.location.origin}/r/${currentSlug}` : (qr?.targetUrl ?? '');

    // Studio Configuration State - DEFAULT includeLogo to true, showSubtitle to false
    const [config, setConfig] = useState<QRStyleConfig>({
        template: 'modern',
        fgColor: '#18181b',
        bgColor: '#ffffff',
        cardBgColor: '#ffffff',
        includeLogo: true,
        centerIcon: 'logo',
        restaurantName: restaurant?.name || 'Restaurant Menu',
        ctaText: 'Scan to View Menu • የምግብ ዝርዝር ለማየት በስልክዎ ስካን ያድርጉ',
        showSubtitle: false,
        subText: '',
        tableNumber: '',
        showWifi: false,
        wifiName: '',
    });

    React.useEffect(() => {
        if (restaurant) {
            setConfig(prev => ({
                ...prev,
                restaurantName: restaurant.name || prev.restaurantName,
            }));
        }
    }, [restaurant]);

    const [activeTab, setActiveTab] = useState<'template' | 'color' | 'content'>('template');
    const [copied, setCopied] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

    const canvasContainerRef = useRef<HTMLDivElement>(null);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(menuUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success(t('qr.copied', { defaultValue: 'Menu URL copied to clipboard!' }));
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${restaurant?.name ?? 'Restaurant'} Menu`,
                    text: t('qr.share_text', { defaultValue: 'Check out our digital menu!' }),
                    url: menuUrl,
                });
            } catch (err: any) {
                if (err.name !== 'AbortError') {
                    handleCopy();
                }
            }
        } else {
            handleCopy();
        }
    };

    const handleDownloadPNG = async () => {
        setIsDownloading(true);
        try {
            if (!canvasContainerRef.current) {
                toast.error(t('toast.qrCanvasError', { defaultValue: 'Card preview not found' }));
                return;
            }

            // Capture the entire styled designer card in high resolution (3x scale)
            const cardEl = (canvasContainerRef.current.firstElementChild as HTMLElement) || canvasContainerRef.current;
            const bgColor = config.template === 'luxe' ? '#0a0a0a' : (config.cardBgColor || '#ffffff');
            const canvas = await html2canvas(cardEl, {
                scale: 3,
                useCORS: true,
                allowTaint: true,
                backgroundColor: bgColor,
                logging: false,
            });

            const link = document.createElement('a');
            link.download = `${currentSlug ?? 'menu'}-${config.template}-card.png`;
            link.href = canvas.toDataURL('image/png', 1.0);
            link.click();
            toast.success(t('qr.png_downloaded', { defaultValue: 'High-resolution card PNG downloaded!' }));
        } catch (e) {
            console.error('Download error:', e);
        } finally {
            setIsDownloading(false);
        }
    };

    const handleDownloadSVG = async () => {
        try {
            const rawLogo = config.customLogoUrl || safeLogoUrl;
            const resolvedLogo = resolveImageUrl(rawLogo) || (config.includeLogo ? getFallbackLogo(config.restaurantName, config.fgColor) : undefined);

            const svgString = await QRCode.toString(menuUrl, {
                type: 'svg',
                errorCorrectionLevel: resolvedLogo ? 'H' : 'Q',
                margin: 1,
                color: {
                    dark: config.fgColor || '#000000',
                    light: '#FFFFFF',
                },
            });

            const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${currentSlug ?? 'menu'}-vector-qr.svg`;
            link.click();
            URL.revokeObjectURL(url);
            toast.success(t('qr.svg_downloaded', { defaultValue: 'True Vector SVG downloaded!' }));
        } catch (e) {
            console.error('SVG download error:', e);
            toast.error('Failed to download SVG');
        }
    };

    const handlePrint = () => {
        setIsPrintModalOpen(true);
    };

    return (
        <>
            <Helmet><title>{t('qr.title', { defaultValue: 'Aesthetic QR Studio' })} — OurMenu</title></Helmet>

            {/* Print & PDF Sheet Customization Modal */}
            <QRPrintModal
                isOpen={isPrintModalOpen}
                onClose={() => setIsPrintModalOpen(false)}
                config={config}
                menuUrl={menuUrl}
                logoUrl={safeLogoUrl}
            />

            <div className="min-h-full bg-gradient-to-br from-neutral-50 via-white to-neutral-100/80 dark:from-neutral-950 dark:via-neutral-900/90 dark:to-neutral-900 p-4 sm:p-6 lg:p-10 pb-28 lg:pb-12 transition-colors duration-200 print:hidden">
                <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">

                    {/* ── Page Header ── */}
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1.5">
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[color:var(--color-brand-50)] dark:bg-[color:var(--color-brand-500)]/10 text-[color:var(--color-brand-700)] dark:text-[color:var(--color-brand-400)] border border-[color:var(--color-brand-200)] dark:border-[color:var(--color-brand-500)]/20 flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" />
                                    <span>{t('qr.studio_badge', { defaultValue: 'Custom QR Studio' })}</span>
                                </span>
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-neutral-50 tracking-tight">
                                {t('qr.title', { defaultValue: 'QR Code Designer' })}
                            </h1>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                                {t('qr.subtitle', { defaultValue: 'Create custom branded QR codes and printable table stands.' })}
                            </p>
                        </div>

                        {/* Top quick actions */}
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <Button
                                variant="outline"
                                onClick={handleShare}
                                className="h-10 px-4 rounded-xl border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold"
                                icon={<Share2 className="w-4 h-4" />}
                            >
                                {t('qr.share', { defaultValue: 'Share' })}
                            </Button>
                            <a href={menuUrl} target="_blank" rel="noopener noreferrer">
                                <Button
                                    variant="outline"
                                    className="h-10 px-4 rounded-xl border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold"
                                    icon={<ExternalLink className="w-4 h-4" />}
                                >
                                    {t('qr.open_menu', { defaultValue: 'Live Menu' })}
                                </Button>
                            </a>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            <div className="lg:col-span-5"><SkeletonCard className="h-[480px] rounded-3xl" /></div>
                            <div className="lg:col-span-7"><SkeletonCard className="h-[480px] rounded-3xl" /></div>
                        </div>
                    ) : !qr ? (
                        <div className="backdrop-blur-md bg-white/95 dark:bg-neutral-900/95 border border-neutral-200/90 dark:border-neutral-800/90 rounded-[28px] p-8 sm:p-12 text-center shadow-sm max-w-lg mx-auto">
                            <div className="w-20 h-20 mx-auto rounded-3xl bg-[color:var(--color-brand-50)] dark:bg-[color:var(--color-brand-500)]/10 text-[color:var(--color-brand-600)] dark:text-[color:var(--color-brand-400)] flex items-center justify-center text-4xl mb-6 shadow-sm">
                                🪄
                            </div>
                            <h2 className="text-2xl font-black text-neutral-900 dark:text-neutral-50 mb-2">
                                {t('qr.generate_title', { defaultValue: 'Generate Your QR Code' })}
                            </h2>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-8 max-w-sm mx-auto leading-relaxed">
                                {t('qr.generate_desc', { defaultValue: 'Create a permanent dynamic QR code that connects customers directly to your live digital menu.' })}
                            </p>
                            <Button
                                variant="primary"
                                className="h-12 w-full sm:w-auto px-8 rounded-2xl bg-[color:var(--color-brand-500)] hover:bg-[color:var(--color-brand-600)] text-white font-bold shadow-lg"
                                onClick={() => ensure()}
                                isLoading={isGenerating}
                                icon={<QrCode className="w-5 h-5" />}
                                size="lg"
                            >
                                {t('qr.generate', { defaultValue: 'Generate QR Code' })}
                            </Button>
                        </div>
                    ) : (
                        /* ── Studio Split Layout ── */
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                            {/* ── Left Column: Live 3D Card Preview ── */}
                            <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-20">
                                <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-neutral-100 via-neutral-50 to-neutral-200 dark:from-neutral-900 dark:via-neutral-950 dark:to-neutral-900 border border-neutral-200/80 dark:border-neutral-800 flex flex-col items-center justify-center min-h-[480px] shadow-inner overflow-hidden">
                                    {/* Ambient backdrop glow */}
                                    <div
                                        className="absolute w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none"
                                        style={{ backgroundColor: config.fgColor }}
                                    />

                                    {/* Live Canvas Card */}
                                    <QRDesignerPreview
                                        config={config}
                                        menuUrl={menuUrl}
                                        logoUrl={safeLogoUrl}
                                        canvasRef={canvasContainerRef}
                                    />

                                    <p className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 mt-2 flex items-center gap-1.5">
                                        <Smartphone className="w-3.5 h-3.5" />
                                        <span>{t('qr.live_interactive_preview', { defaultValue: 'Live Scan & Print Preview' })}</span>
                                    </p>
                                </div>

                                {/* URL Copy Snippet */}
                                <div className="backdrop-blur-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-2 flex items-center gap-2 shadow-xs">
                                    <span className="text-[13px] text-neutral-600 dark:text-neutral-300 flex-1 truncate font-mono px-3 select-all">
                                        {menuUrl}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleCopy}
                                        className="h-9 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0"
                                    >
                                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                        <span>{copied ? t('common.copied', { defaultValue: 'Copied' }) : t('common.copy', { defaultValue: 'Copy' })}</span>
                                    </button>
                                </div>
                            </div>

                            {/* ── Right Column: Customization Studio Controls ── */}
                            <div className="lg:col-span-7 space-y-6">

                                {/* Navigation Studio Tabs */}
                                <div className="flex p-1.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/80 gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('template')}
                                        className={cn(
                                            'flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer',
                                            activeTab === 'template'
                                                ? 'bg-white dark:bg-neutral-900 text-neutral-950 dark:text-white shadow-sm'
                                                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                                        )}
                                    >
                                        <Layout className="w-4 h-4" />
                                        <span>{t('qr.tab_templates', { defaultValue: 'Frame Style' })}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('color')}
                                        className={cn(
                                            'flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer',
                                            activeTab === 'color'
                                                ? 'bg-white dark:bg-neutral-900 text-neutral-950 dark:text-white shadow-sm'
                                                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                                        )}
                                    >
                                        <Palette className="w-4 h-4" />
                                        <span>{t('qr.tab_colors', { defaultValue: 'Brand Palette' })}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('content')}
                                        className={cn(
                                            'flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer',
                                            activeTab === 'content'
                                                ? 'bg-white dark:bg-neutral-900 text-neutral-950 dark:text-white shadow-sm'
                                                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                                        )}
                                    >
                                        <Type className="w-4 h-4" />
                                        <span>{t('qr.tab_content', { defaultValue: 'Text & Branding' })}</span>
                                    </button>
                                </div>

                                {/* Tab 1: Template & Frame Chooser */}
                                {activeTab === 'template' && (
                                    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 space-y-5 animate-fade-in shadow-xs">
                                        <div>
                                            <h3 className="text-base font-extrabold text-neutral-900 dark:text-white">
                                                {t('qr.choose_template', { defaultValue: 'Choose Table Stand Style' })}
                                            </h3>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                                Select a designer layout for your printed restaurant cards.
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                            {TEMPLATES.map((tmpl) => (
                                                <button
                                                    key={tmpl.id}
                                                    type="button"
                                                    onClick={() => setConfig(c => ({ ...c, template: tmpl.id }))}
                                                    className={cn(
                                                        'p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-start gap-3.5',
                                                        config.template === tmpl.id
                                                            ? 'border-[color:var(--color-brand-500)] bg-[color:var(--color-brand-50)]/40 dark:bg-[color:var(--color-brand-500)]/10 shadow-sm'
                                                            : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/30'
                                                    )}
                                                >
                                                    <span className="text-2xl p-2 rounded-xl bg-white dark:bg-neutral-800 shadow-xs border border-neutral-200 dark:border-neutral-700">
                                                        {tmpl.icon}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <h4 className="font-extrabold text-sm text-neutral-900 dark:text-white">
                                                            {tmpl.name}
                                                        </h4>
                                                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
                                                            {tmpl.desc}
                                                        </p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Tab 2: Brand Color Presets */}
                                {activeTab === 'color' && (
                                    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 space-y-6 animate-fade-in shadow-xs">
                                        <div>
                                            <h3 className="text-base font-extrabold text-neutral-900 dark:text-white">
                                                {t('qr.palette_title', { defaultValue: 'QR & Frame Colors' })}
                                            </h3>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                                Choose a color theme that matches your restaurant aesthetic.
                                            </p>
                                        </div>

                                        {/* Curated Presets Grid */}
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                            {COLOR_PRESETS.map((p) => {
                                                const isSelected = config.fgColor === p.fg;
                                                return (
                                                    <button
                                                        key={p.id}
                                                        type="button"
                                                        onClick={() => setConfig(c => ({ ...c, fgColor: p.fg }))}
                                                        className={cn(
                                                            'p-3 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center gap-3',
                                                            isSelected
                                                                ? 'border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-800 shadow-sm'
                                                                : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
                                                        )}
                                                    >
                                                        <div
                                                            className="w-7 h-7 rounded-xl shadow-xs border border-black/10 flex-shrink-0 flex items-center justify-center"
                                                            style={{ backgroundColor: p.fg }}
                                                        >
                                                            {isSelected && <Check className="w-4 h-4 text-white stroke-[3]" />}
                                                        </div>
                                                        <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate">
                                                            {p.name}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* Custom Hex Color Picker */}
                                        <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-4">
                                            <div>
                                                <label className="text-xs font-extrabold text-neutral-800 dark:text-neutral-200 block">
                                                    Custom Brand Color
                                                </label>
                                                <span className="text-[11px] text-neutral-400 font-medium">Enter hex code or use color picker</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="color"
                                                    value={config.fgColor}
                                                    onChange={e => setConfig(c => ({ ...c, fgColor: e.target.value }))}
                                                    className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent"
                                                />
                                                <input
                                                    type="text"
                                                    value={config.fgColor}
                                                    onChange={e => setConfig(c => ({ ...c, fgColor: e.target.value }))}
                                                    className="w-24 h-10 px-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-mono font-bold uppercase bg-neutral-50 dark:bg-neutral-800"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Tab 3: Text & Center Logo Branding */}
                                {activeTab === 'content' && (
                                    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 space-y-5 animate-fade-in shadow-xs">
                                        <div>
                                            <h3 className="text-base font-extrabold text-neutral-900 dark:text-white">
                                                {t('qr.branding_title', { defaultValue: 'Card Content & Logo' })}
                                            </h3>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                                Personalize your scan prompt, call to action, and center badge.
                                            </p>
                                        </div>

                                        {/* Center Logo Toggle */}
                                        <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700 flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-lg overflow-hidden flex-shrink-0">
                                                    {restaurant?.logoUrl ? (
                                                        <img src={resolveImageUrl(restaurant.logoUrl) || restaurant.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-xs font-black text-neutral-800 dark:text-neutral-200">
                                                            {restaurant?.name?.charAt(0)?.toUpperCase() || '🍴'}
                                                        </span>
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-extrabold text-neutral-900 dark:text-white">
                                                        {t('qr.center_logo', { defaultValue: 'Embed Restaurant Logo' })}
                                                    </h4>
                                                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                                                        {restaurant?.logoUrl
                                                            ? 'Places your logo in the center with 30% error correction'
                                                            : 'Active by default. Uses restaurant logo or custom brand initial'}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setConfig(c => ({ ...c, includeLogo: !c.includeLogo }))}
                                                className={cn(
                                                    'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
                                                    config.includeLogo ? 'bg-[color:var(--color-brand-500)]' : 'bg-neutral-300 dark:bg-neutral-700'
                                                )}
                                            >
                                                <span
                                                    className={cn(
                                                        'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200',
                                                        config.includeLogo ? 'translate-x-5' : 'translate-x-0'
                                                    )}
                                                />
                                            </button>
                                        </div>

                                        {/* Quick Prompt Presets */}
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-xs font-extrabold text-neutral-700 dark:text-neutral-300">
                                                    {t('qr.prompt_presets', { defaultValue: 'Language Presets' })}
                                                </label>
                                                {!LANGUAGE_PRESETS.some(p => p.cta === config.ctaText) && (
                                                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-500/20">
                                                        Custom Text
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {LANGUAGE_PRESETS.map((preset) => {
                                                    const isSelected = config.ctaText === preset.cta;
                                                    return (
                                                        <button
                                                            key={preset.id}
                                                            type="button"
                                                            onClick={() => setConfig(c => ({
                                                                ...c,
                                                                ctaText: preset.cta,
                                                                subText: preset.sub,
                                                            }))}
                                                            className={cn(
                                                                'px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5',
                                                                isSelected
                                                                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 border-neutral-900 dark:border-white shadow-xs'
                                                                    : 'bg-neutral-100 hover:bg-neutral-200/80 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700'
                                                            )}
                                                        >
                                                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3] text-emerald-400 dark:text-emerald-600 flex-shrink-0" />}
                                                            <span>{preset.label}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Call to Action Text */}
                                        <div>
                                            <label className="text-xs font-extrabold text-neutral-700 dark:text-neutral-300 block mb-1.5">
                                                {t('qr.cta_label', { defaultValue: 'Call to Action Prompt' })}
                                            </label>
                                            <input
                                                type="text"
                                                value={config.ctaText}
                                                onChange={e => setConfig(c => ({ ...c, ctaText: e.target.value }))}
                                                placeholder="e.g. Scan to View Menu • የምግብ ዝርዝር ለማየት በስልክዎ ስካን ያድርጉ"
                                                className="w-full h-11 px-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand-500)]/30"
                                            />
                                        </div>

                                        {/* Optional Subtitle / Tagline */}
                                        <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-xs font-extrabold text-neutral-800 dark:text-neutral-200">
                                                    <Type className="w-4 h-4 text-neutral-500" />
                                                    <span>Include Subtitle / Tagline on Stand</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setConfig(c => ({ ...c, showSubtitle: !c.showSubtitle }))}
                                                    className={cn(
                                                        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
                                                        config.showSubtitle ? 'bg-emerald-500' : 'bg-neutral-300 dark:bg-neutral-700'
                                                    )}
                                                >
                                                    <span
                                                        className={cn(
                                                            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200',
                                                            config.showSubtitle ? 'translate-x-5' : 'translate-x-0'
                                                        )}
                                                    />
                                                </button>
                                            </div>
                                            {config.showSubtitle && (
                                                <input
                                                    type="text"
                                                    value={config.subText || ''}
                                                    onChange={e => setConfig(c => ({ ...c, subText: e.target.value }))}
                                                    placeholder="e.g. Contactless Digital Menu • ዲጂታል የምግብ ዝርዝር"
                                                    className="w-full h-10 px-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand-500)]/30"
                                                />
                                            )}
                                        </div>

                                        {/* Optional Guest Wi-Fi */}
                                        <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-xs font-extrabold text-neutral-800 dark:text-neutral-200">
                                                    <Wifi className="w-4 h-4 text-neutral-500" />
                                                    <span>Display Guest Wi-Fi Info on Stand</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setConfig(c => ({ ...c, showWifi: !c.showWifi }))}
                                                    className={cn(
                                                        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
                                                        config.showWifi ? 'bg-emerald-500' : 'bg-neutral-300 dark:bg-neutral-700'
                                                    )}
                                                >
                                                    <span
                                                        className={cn(
                                                            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200',
                                                            config.showWifi ? 'translate-x-5' : 'translate-x-0'
                                                        )}
                                                    />
                                                </button>
                                            </div>
                                            {config.showWifi && (
                                                <input
                                                    type="text"
                                                    value={config.wifiName || ''}
                                                    onChange={e => setConfig(c => ({ ...c, wifiName: e.target.value }))}
                                                    placeholder="e.g. BlueNile_Guest (Pass: 12345678)"
                                                    className="w-full h-10 px-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800 text-xs font-medium"
                                                />
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* ── Export & Print Center ── */}
                                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 space-y-4 shadow-xs">
                                    <h3 className="text-base font-extrabold text-neutral-900 dark:text-white">
                                        {t('qr.export_center', { defaultValue: 'Export & Print Studio' })}
                                    </h3>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {/* High Res Card PNG */}
                                        <Button
                                            variant="primary"
                                            onClick={handleDownloadPNG}
                                            isLoading={isDownloading}
                                            className="h-12 rounded-2xl bg-[color:var(--color-brand-500)] hover:bg-[color:var(--color-brand-600)] text-white font-extrabold text-xs shadow-md cursor-pointer"
                                            icon={<Download className="w-4 h-4" />}
                                        >
                                            {t('qr.download_png', { defaultValue: 'Download Card PNG' })}
                                        </Button>

                                        {/* Vector SVG */}
                                        <Button
                                            variant="outline"
                                            onClick={handleDownloadSVG}
                                            className="h-12 rounded-2xl border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 font-extrabold text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer"
                                            icon={<QrCode className="w-4 h-4" />}
                                        >
                                            {t('qr.download_svg', { defaultValue: 'Vector QR (SVG)' })}
                                        </Button>

                                        {/* Printable A4 PDF Studio */}
                                        <Button
                                            variant="outline"
                                            onClick={handlePrint}
                                            className="h-12 rounded-2xl border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 font-extrabold text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer"
                                            icon={<Printer className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                                        >
                                            {t('qr.print_sheets', { defaultValue: 'Printable A4 PDF' })}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
