import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { QRStyleConfig, getFallbackLogo, resolveImageUrl } from '../components/dashboard/qr/QRDesignerPreview';

export type QRCountOption = 1 | 2 | 4 | 6;

export interface SheetConfig {
    qrCount: QRCountOption;
    showCutLines: boolean;
}

// Fixed standard A4 dimensions in millimeters
const A4_DIMENSIONS = { width: 210, height: 297, name: 'A4 Standard (210 × 297 mm)' };

// Grid arrangements (cols, rows) for each count on A4
export const GRID_CONFIGS: Record<QRCountOption, { cols: number; rows: number; label: string; desc: string }> = {
    1: { cols: 1, rows: 1, label: '1 QR (Poster / Flyer)', desc: 'Full page display for entrance or counter' },
    2: { cols: 1, rows: 2, label: '2 QRs (Large Table Stands)', desc: 'Large 5×7" table tents or acrylic stands' },
    4: { cols: 2, rows: 2, label: '4 QRs (Standard Table Cards)', desc: 'Standard 4×6" foldable table cards' },
    6: { cols: 2, rows: 3, label: '6 QRs (Compact Cards)', desc: 'Compact cards, table stickers, or coasters' },
};

export const generateQRPdf = async (
    config: QRStyleConfig,
    menuUrl: string,
    logoUrl?: string | null,
    sheet: SheetConfig = { qrCount: 4, showCutLines: true }
): Promise<void> => {
    const paper = A4_DIMENSIONS;
    const grid = GRID_CONFIGS[sheet.qrCount] || GRID_CONFIGS[4];

    // High-Resolution 300 DPI Canvas for A4 (2480 × 3508 pixels)
    const canvas = document.createElement('canvas');
    canvas.width = 2480;
    canvas.height = 3508;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D canvas context');

    // Fill clean white paper background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const marginPx = 118; // 10mm margins in 300 DPI
    const usableWidth = canvas.width - marginPx * 2;
    const usableHeight = canvas.height - marginPx * 2;

    const colWidth = usableWidth / grid.cols;
    const rowHeight = usableHeight / grid.rows;

    // Resolve Logo
    const rawLogo = config.customLogoUrl || logoUrl;
    const resolvedLogo = resolveImageUrl(rawLogo) || (config.includeLogo ? getFallbackLogo(config.restaurantName, config.fgColor) : undefined);

    // Helper: load image element
    const loadImage = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = src;
        });
    };

    // Pre-generate high-res QR code image
    const qrDataUrl = await QRCode.toDataURL(menuUrl, {
        errorCorrectionLevel: resolvedLogo ? 'H' : 'Q',
        width: 1024,
        margin: 1,
        color: {
            dark: config.fgColor || '#000000',
            light: '#FFFFFF',
        },
    });
    const qrImg = await loadImage(qrDataUrl);

    let logoImg: HTMLImageElement | null = null;
    if (config.includeLogo && resolvedLogo) {
        try {
            logoImg = await loadImage(resolvedLogo);
        } catch {
            // If failed to load custom logo, continue without throwing
        }
    }

    const isDensity6 = sheet.qrCount === 6;
    const isDensity4 = sheet.qrCount === 4;
    const isDensity2 = sheet.qrCount === 2;
    const isDensity1 = sheet.qrCount === 1;

    // Iterate through grid slots and draw each card onto the high-res canvas
    for (let r = 0; r < grid.rows; r++) {
        for (let c = 0; c < grid.cols; c++) {
            const x = marginPx + c * colWidth;
            const y = marginPx + r * rowHeight;
            const cardPad = 42; // Card padding
            const cardX = x + cardPad;
            const cardY = y + cardPad;
            const cardW = colWidth - cardPad * 2;
            const cardH = rowHeight - cardPad * 2;
            const centerX = cardX + cardW / 2;

            // Draw dashed cutting border
            if (sheet.showCutLines) {
                ctx.strokeStyle = '#d4d4d8';
                ctx.lineWidth = 3;
                ctx.setLineDash([16, 16]);
                ctx.strokeRect(cardX, cardY, cardW, cardH);
                ctx.setLineDash([]);

                // Small scissor marker
                ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
                ctx.fillStyle = '#a1a1aa';
                ctx.textAlign = 'left';
                ctx.fillText('✂ Cut', cardX + 18, cardY + 34);
            }

            let cursorY = cardY + (isDensity6 ? 60 : isDensity4 ? 80 : isDensity2 ? 110 : 150);

            // 1. Restaurant Title
            const titleFontSize = isDensity6 ? 42 : isDensity4 ? 54 : isDensity2 ? 76 : 108;
            ctx.font = `900 ${titleFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Ethiopic", sans-serif`;
            ctx.fillStyle = '#18181b';
            ctx.textAlign = 'center';
            const title = config.restaurantName || 'Restaurant Menu';
            ctx.fillText(title, centerX, cursorY);
            cursorY += titleFontSize * 0.45 + (isDensity6 ? 18 : 28);

            // 2. Subtitle (only when enabled)
            if (config.showSubtitle && config.subText) {
                const subFontSize = isDensity6 ? 26 : isDensity4 ? 32 : isDensity2 ? 44 : 58;
                ctx.font = `600 ${subFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Ethiopic", sans-serif`;
                ctx.fillStyle = '#71717a';
                ctx.fillText(config.subText, centerX, cursorY);
                cursorY += subFontSize * 0.5 + (isDensity6 ? 20 : 30);
            } else {
                cursorY += isDensity6 ? 10 : 20;
            }

            // 3. QR Code Proportional Sizing
            const bottomReserved = isDensity6 ? 210 : isDensity4 ? 260 : isDensity2 ? 360 : 480;
            const availableHeight = cardH - (cursorY - cardY) - bottomReserved;
            const maxQrSize = Math.min(cardW - (isDensity6 ? 80 : 140), availableHeight);
            const qrSize = Math.max(Math.min(maxQrSize, isDensity6 ? 480 : isDensity4 ? 700 : isDensity2 ? 1050 : 1500), 280);
            const qrX = centerX - qrSize / 2;
            const qrY = cursorY;

            // Draw high-resolution QR code
            ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

            // Draw center excavated logo badge (20% of QR size)
            if (config.includeLogo && logoImg) {
                const logoSize = Math.round(qrSize * 0.20);
                const logoX = centerX - logoSize / 2;
                const logoY = qrY + qrSize / 2 - logoSize / 2;
                const radius = Math.round(logoSize * 0.22);

                // Rounded white background tile
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                if (ctx.roundRect) {
                    ctx.roundRect(logoX - 8, logoY - 8, logoSize + 16, logoSize + 16, radius);
                } else {
                    ctx.rect(logoX - 8, logoY - 8, logoSize + 16, logoSize + 16);
                }
                ctx.fill();

                // Draw logo
                ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
            }

            cursorY = qrY + qrSize + (isDensity6 ? 36 : 52);

            // 4. CTA Prompt Badge (Multiline with full Unicode/Amharic support)
            const ctaFontSize = isDensity6 ? 30 : isDensity4 ? 38 : isDensity2 ? 52 : 72;
            ctx.font = `800 ${ctaFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Ethiopic", sans-serif`;
            ctx.fillStyle = '#18181b';
            ctx.textAlign = 'center';

            const cta = config.ctaText || 'Scan to View Menu • የምግብ ዝርዝር ለማየት በስልክዎ ስካን ያድርጉ';
            // Cleanly split on bullet • for beautiful 2-line layout or render as lines
            const lines = cta.includes('•')
                ? cta.split('•').map(l => l.trim()).filter(Boolean)
                : [cta];

            lines.forEach((lineText, idx) => {
                ctx.fillText(lineText, centerX, cursorY + idx * (ctaFontSize + 14));
            });

            cursorY += lines.length * (ctaFontSize + 14) + (isDensity6 ? 12 : 20);

            // 5. Optional Guest Wi-Fi
            if (config.showWifi && config.wifiName && !isDensity6) {
                const wifiFontSize = isDensity4 ? 26 : isDensity2 ? 34 : 46;
                ctx.font = `600 ${wifiFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
                ctx.fillStyle = '#52525b';
                ctx.fillText(`Wi-Fi: ${config.wifiName}`, centerX, cursorY);
            }
        }
    }

    // Convert high-res canvas to PDF (300 DPI, full A4 page)
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [paper.width, paper.height],
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    doc.addImage(imgData, 'JPEG', 0, 0, paper.width, paper.height);

    // Save and download PDF
    const filename = `${config.restaurantName.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'menu'}-qr-a4-${sheet.qrCount}up.pdf`;
    doc.save(filename);
};
