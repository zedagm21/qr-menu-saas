import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { QrCode, Download, Copy, ExternalLink, RefreshCw, Info, Share2, Camera } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { useQRCodes, useEnsureQRCode } from '../../hooks/useQR';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

const QRPage: React.FC = () => {
    const { t } = useTranslation();
    const { restaurant } = useAuth();
    const { data: qrCodes, isLoading } = useQRCodes();
    const { mutate: ensure, isPending } = useEnsureQRCode();

    const qr = Array.isArray(qrCodes) ? qrCodes[0] : null;
    // The targetUrl is the stable /r/:slug URL that never changes even if menu content does
    const menuUrl = qr?.targetUrl ?? (restaurant ? `${window.location.origin}/r/${restaurant.slug}` : '');

    const handleCopy = async () => {
        await navigator.clipboard.writeText(menuUrl);
        toast.success(t('qr.copied') || t('qr.copied_to_clipboard'));
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${restaurant?.name ?? t('qr.restaurant')} Menu`,
                    text: t('qr.share_text') || t('qr.share_text'),
                    url: menuUrl
                });
            } catch (error) {
                // Ignore AbortError caused by user cancellation
                if ((error as Error).name !== 'AbortError') {
                    console.error('Error sharing', error);
                }
            }
        } else {
            handleCopy();
        }
    };

    const handleDownload = () => {
        // Find the canvas rendered by QRCodeCanvas and export it as PNG
        const canvas = document.querySelector<HTMLCanvasElement>('#qr-canvas canvas') ?? document.querySelector<HTMLCanvasElement>('#qr-canvas');
        if (!canvas) {
            toast.error('QR canvas not found');
            return;
        }
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `${restaurant?.slug ?? 'menu'}-qr.png`;
        link.click();
    };

    return (
        <>
            <Helmet><title>{t('qr.title')} — QR Menu</title></Helmet>
            <div className="min-h-full bg-gradient-to-br from-neutral-50 via-white to-neutral-100/80 dark:from-neutral-950 dark:via-neutral-900/90 dark:to-neutral-900 p-4 sm:p-6 lg:p-10 pb-28 lg:pb-12 transition-colors duration-200">
                <div className="max-w-2xl mx-auto space-y-6">
                    <div className="animate-fade-in-up delay-0 text-center sm:text-left mb-6 lg:mb-8">
                        <div className="flex justify-center sm:justify-start items-center gap-2 mb-1.5">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[color:var(--color-brand-50)] dark:bg-[color:var(--color-brand-500)]/10 text-[color:var(--color-brand-700)] dark:text-[color:var(--color-brand-400)] border border-[color:var(--color-brand-200)] dark:border-[color:var(--color-brand-500)]/20">
                                {t('qr.connect_and_share', { defaultValue: 'Connect & Share' })}
                            </span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-neutral-50 tracking-tight">{t('qr.title')}</h1>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{t('qr.subtitle')}</p>
                    </div>

                    {isLoading ? (
                        <div className="animate-fade-in-up delay-75">
                            <SkeletonCard className="h-96 rounded-[24px]" />
                        </div>
                    ) : !qr ? (
                        <div className="animate-fade-in-up delay-75 backdrop-blur-md bg-white/95 dark:bg-neutral-900/95 border border-neutral-200/90 dark:border-neutral-800/90 rounded-[24px] p-8 sm:p-12 text-center shadow-sm">
                            <div className="text-5xl animate-bounce mb-6 flex items-center justify-center">📷</div>
                            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-50 mb-2">{t("qr.generate_title")}</h2>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-8 max-w-sm mx-auto leading-relaxed">
                                Create a dynamic QR code that always points to your live menu.
                            </p>
                            <Button variant="primary" className="h-12 w-full sm:w-auto px-8 rounded-xl bg-[color:var(--color-brand-500)] text-white" onClick={() => ensure()} isLoading={isPending} icon={<QrCode className="w-5 h-5" />} size="lg">
                                Generate QR Code
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* QR display - Polaroid Glass Card */}
                            <div className="animate-fade-in-up delay-75 backdrop-blur-md bg-white/95 dark:bg-neutral-900/95 border border-neutral-200/90 dark:border-neutral-800/90 rounded-[24px] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_40px_rgba(var(--color-brand-500-rgb),0.15)] dark:hover:shadow-[0_12px_40px_rgba(var(--color-brand-500-rgb),0.25)] flex flex-col items-center gap-6 group transition-all duration-300">
                                <div id="qr-canvas" className="relative transition-transform duration-300 group-hover:scale-105 cursor-pointer" onClick={handleDownload}>
                                    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm relative">
                                        <QRCodeCanvas
                                            value={menuUrl}
                                            size={220}
                                            level="Q"
                                            includeMargin={false}
                                        />
                                        <div className="absolute inset-0 bg-white/90 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px] rounded-2xl flex flex-col items-center justify-center border border-[color:var(--color-brand-200)] dark:bg-white/80 dark:border-[color:var(--color-brand-300)]">
                                            <div className="w-12 h-12 bg-[color:var(--color-brand-50)] rounded-full flex items-center justify-center mb-2 shadow-sm border border-[color:var(--color-brand-100)]">
                                                <Download className="w-6 h-6 text-[color:var(--color-brand-600)]" />
                                            </div>
                                            <span className="text-sm font-bold text-neutral-900">{t("qr.download_png")}</span>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 text-center">
                                    {t('qr.scan_to_view')} <span className="font-bold text-neutral-900 dark:text-neutral-50">{restaurant?.name}</span>
                                </p>
                            </div>

                            {/* Actions Section */}
                            <div className="animate-fade-in-up delay-150 flex flex-col sm:flex-row gap-3 w-full">
                                <Button className="h-12 sm:flex-1 w-full rounded-xl text-[15px] hover:-translate-y-0.5 transition-all bg-[color:var(--color-brand-500)] text-white" onClick={handleDownload} variant="primary" icon={<Download className="w-5 h-5" />}>{t("qr.download_png")}</Button>
                                <Button className="h-12 sm:flex-1 w-full rounded-xl text-[15px] hover:-translate-y-0.5 transition-all bg-white dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800" onClick={handleShare} variant="outline" icon={<Share2 className="w-5 h-5" />}>{t("qr.share")}</Button>
                                <div className="flex flex-col sm:flex-row w-full sm:flex-1 gap-3">
                                    <a href={menuUrl} target="_blank" rel="noopener noreferrer" className="block w-full sm:flex-1">
                                        <Button className="w-full h-12 rounded-xl text-sm hover:-translate-y-0.5 transition-all bg-white dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800" variant="outline" icon={<ExternalLink className="w-4 h-4" />}>
                                            {t('qr.open_menu', { defaultValue: 'Open Menu' })}
                                        </Button>
                                    </a>
                                    <Button className="h-12 sm:flex-1 w-full rounded-xl text-sm hover:-translate-y-0.5 transition-all dark:text-neutral-300 dark:hover:bg-neutral-800" variant="ghost" onClick={() => ensure()} isLoading={isPending} icon={<RefreshCw className="w-4 h-4" />}>
                                        {t('qr.regenerate', { defaultValue: 'Regenerate' })}
                                    </Button>
                                </div>
                            </div>

                            {/* URL Display */}
                            <div className="animate-fade-in-up delay-225">
                                <label className="text-[12px] font-bold text-neutral-700 dark:text-neutral-400 block mb-1.5 ml-1">{t('qr.url_label')}</label>
                                <div className="backdrop-blur-md bg-white/95 dark:bg-neutral-900/95 border border-neutral-200/90 dark:border-neutral-800/90 rounded-2xl p-1.5 flex items-center gap-2 shadow-sm">
                                    <span className="text-[14px] text-neutral-600 dark:text-neutral-300 flex-1 truncate font-mono px-3 select-all">{menuUrl}</span>
                                    <button onClick={handleCopy} className="h-10 w-10 flex items-center justify-center bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-500 dark:text-neutral-400 hover:text-[color:var(--color-brand-500)] dark:hover:text-[color:var(--color-brand-400)] hover:bg-[color:var(--color-brand-50)] dark:hover:bg-[color:var(--color-brand-500)]/10 hover:border-[color:var(--color-brand-200)] dark:hover:border-[color:var(--color-brand-500)]/20 transition-colors flex-shrink-0 shadow-xs" aria-label={t('qr.copy_link')}>
                                        <Copy className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Info Box */}
                            <div className="animate-fade-in-up delay-300 backdrop-blur-sm bg-blue-50/50 dark:bg-blue-500/10 border border-blue-200/50 dark:border-blue-500/20 rounded-2xl p-5 flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                                    <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="pt-0.5">
                                    <h3 className="text-[13px] font-extrabold text-blue-900 dark:text-blue-300 mb-1 uppercase tracking-wider">{t('qr.print_tips_title')}</h3>
                                    <p className="text-[14px] text-blue-700/90 dark:text-blue-400/90 leading-relaxed font-medium">{t('qr.print_tips_desc')}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div >
        </>
    );
};

export default QRPage;
