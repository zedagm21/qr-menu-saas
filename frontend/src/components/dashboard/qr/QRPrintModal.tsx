import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { QRStyleConfig, QRCardItem, QRCardScale } from './QRDesignerPreview';
import { SheetConfig, QRCountOption, GRID_CONFIGS } from '../../../lib/qrPdfGenerator';
import { Download, Check, Scissors, X } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { cn } from '../../../lib/utils';
import toast from 'react-hot-toast';

interface QRPrintModalProps {
    isOpen: boolean;
    onClose: () => void;
    config: QRStyleConfig;
    menuUrl: string;
    logoUrl?: string | null;
}

export const QRPrintModal: React.FC<QRPrintModalProps> = ({
    isOpen,
    onClose,
    config,
    menuUrl,
    logoUrl,
}) => {
    const { t } = useTranslation();
    const [sheet, setSheet] = useState<SheetConfig>({
        qrCount: 4,
        showCutLines: true,
    });
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const hiddenPdfContainerRef = useRef<HTMLDivElement>(null);

    const grid = GRID_CONFIGS[sheet.qrCount];
    const cardSlots = Array.from({ length: sheet.qrCount });

    const sheetScale: QRCardScale =
        sheet.qrCount === 1 ? 'sheet_1' :
        sheet.qrCount === 2 ? 'sheet_2' :
        sheet.qrCount === 4 ? 'sheet_4' : 'sheet_6';

    const handleDownloadPdf = async () => {
        setIsGeneratingPdf(true);
        try {
            if (!hiddenPdfContainerRef.current) {
                toast.error('Print container not ready');
                return;
            }

            // Capture high-res A4 render target with html2canvas (2.5x scale for 300 DPI clarity)
            const canvas = await html2canvas(hiddenPdfContainerRef.current, {
                scale: 2.5,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                logging: false,
            });

            // Create A4 PDF (210 × 297 mm)
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: [210, 297],
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.96);
            doc.addImage(imgData, 'JPEG', 0, 0, 210, 297);

            const filename = `${config.restaurantName.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'menu'}-qr-a4-${sheet.qrCount}up.pdf`;
            doc.save(filename);
            toast.success(t('qr.pdf_downloaded', { defaultValue: 'Printable A4 PDF downloaded successfully!' }));
        } catch (err) {
            console.error('PDF generation error:', err);
            toast.error('Failed to generate PDF');
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
            <div className="p-6 sm:p-8 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between border-b pb-4 border-neutral-200 dark:border-neutral-800">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[color:var(--color-brand-600)] dark:text-[color:var(--color-brand-400)]">
                                A4 Print & PDF Studio
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                                210 × 297 mm
                            </span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-white tracking-tight mt-0.5">
                            Printable Table Cards Sheet
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 flex items-center justify-center text-neutral-500 cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* ── Left Column: A4 Paper Sheet Live Preview ── */}
                    <div className="lg:col-span-6 flex flex-col items-center justify-center p-4 sm:p-6 bg-neutral-100 dark:bg-neutral-950 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-inner">
                        <div className="flex items-center justify-between w-full mb-3 px-2 text-xs font-bold text-neutral-500">
                            <span>A4 Sheet Preview</span>
                            <span>{grid.label}</span>
                        </div>

                        {/* A4 Paper Aspect Ratio Frame */}
                        <div
                            className="w-full max-w-[320px] bg-white text-neutral-900 rounded-xl shadow-2xl p-3 sm:p-4 border border-neutral-300 transition-all duration-300 relative overflow-hidden flex flex-col justify-between aspect-[210/297]"
                        >
                            {/* Responsive Card Grid with exact chosen template style */}
                            <div
                                className="grid gap-2 flex-1 items-stretch"
                                style={{
                                    gridTemplateColumns: `repeat(${grid.cols}, minmax(0, 1fr))`,
                                    gridTemplateRows: `repeat(${grid.rows}, minmax(0, 1fr))`,
                                }}
                            >
                                {cardSlots.map((_, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            'p-1 flex items-center justify-center relative overflow-hidden rounded-xl',
                                            sheet.showCutLines
                                                ? 'border-2 border-dashed border-neutral-300'
                                                : 'border border-transparent'
                                        )}
                                    >
                                        <QRCardItem
                                            config={config}
                                            menuUrl={menuUrl}
                                            logoUrl={logoUrl}
                                            scale={sheetScale}
                                            className="w-full h-full justify-center"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <p className="text-[11px] text-neutral-400 mt-3 flex items-center gap-1">
                            <span>Matches chosen template style on A4 paper</span>
                        </p>
                    </div>

                    {/* ── Right Column: Density Selection & Actions ── */}
                    <div className="lg:col-span-6 space-y-6">
                        {/* 1. QR Count Selection */}
                        <div className="space-y-2.5">
                            <label className="text-xs font-black uppercase tracking-wider text-neutral-700 dark:text-neutral-300 block">
                                1. Choose Layout (QRs Per A4 Sheet)
                            </label>
                            <div className="grid grid-cols-2 gap-2.5">
                                {([1, 2, 4, 6] as QRCountOption[]).map((count) => {
                                    const isSelected = sheet.qrCount === count;
                                    const g = GRID_CONFIGS[count];
                                    return (
                                        <button
                                            key={count}
                                            type="button"
                                            onClick={() => setSheet(s => ({ ...s, qrCount: count }))}
                                            className={cn(
                                                'p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-start gap-3',
                                                isSelected
                                                    ? 'border-[color:var(--color-brand-500)] bg-[color:var(--color-brand-50)]/40 dark:bg-[color:var(--color-brand-500)]/10 shadow-xs'
                                                    : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
                                            )}
                                        >
                                            <div className={cn(
                                                'w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0',
                                                isSelected
                                                    ? 'bg-[color:var(--color-brand-500)] text-white'
                                                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                                            )}>
                                                {count}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-extrabold text-xs text-neutral-900 dark:text-white truncate">
                                                    {g.label}
                                                </h4>
                                                <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5 leading-tight">
                                                    {g.desc}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 2. Cut Guidelines Switch */}
                        <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <Scissors className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                                <div>
                                    <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                                        Include Dashed Cutting Lines
                                    </h4>
                                    <p className="text-[10px] text-neutral-500">
                                        Prints clean dashed border guidelines between cards
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSheet(s => ({ ...s, showCutLines: !s.showCutLines }))}
                                className={cn(
                                    'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
                                    sheet.showCutLines ? 'bg-emerald-500' : 'bg-neutral-300 dark:bg-neutral-700'
                                )}
                            >
                                <span
                                    className={cn(
                                        'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200',
                                        sheet.showCutLines ? 'translate-x-5' : 'translate-x-0'
                                    )}
                                />
                            </button>
                        </div>

                        {/* 3. Action Buttons */}
                        <div className="pt-2">
                            <Button
                                variant="primary"
                                onClick={handleDownloadPdf}
                                isLoading={isGeneratingPdf}
                                className="h-12 w-full rounded-2xl bg-[color:var(--color-brand-500)] hover:bg-[color:var(--color-brand-600)] text-white font-extrabold text-sm shadow-md cursor-pointer flex items-center justify-center gap-2"
                                icon={<Download className="w-4 h-4" />}
                            >
                                📥 Download A4 PDF
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Hidden Off-Screen A4 High-Resolution Render Target for 300 DPI PDF Capture ── */}
            <div
                style={{
                    position: 'absolute',
                    top: '-9999px',
                    left: '-9999px',
                    width: '1240px',
                    height: '1754px', // Proportional to A4 (210 × 297 mm)
                    backgroundColor: '#ffffff',
                    padding: '36px',
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                }}
                ref={hiddenPdfContainerRef}
            >
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${grid.cols}, minmax(0, 1fr))`,
                        gridTemplateRows: `repeat(${grid.rows}, minmax(0, 1fr))`,
                        gap: '24px',
                        width: '100%',
                        height: '100%',
                    }}
                >
                    {cardSlots.map((_, i) => (
                        <div
                            key={i}
                            style={{
                                border: sheet.showCutLines ? '2px dashed #cbd5e1' : '2px solid transparent',
                                padding: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '16px',
                                boxSizing: 'border-box',
                                overflow: 'hidden',
                            }}
                        >
                            <QRCardItem
                                config={config}
                                menuUrl={menuUrl}
                                logoUrl={logoUrl}
                                scale={sheet.qrCount === 1 ? 'full' : sheet.qrCount === 2 ? 'sheet_1' : sheet.qrCount === 4 ? 'sheet_2' : 'sheet_4'}
                                className="w-full h-full justify-center"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </Modal>
    );
};
