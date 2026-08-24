import QRCode from 'qrcode';

/**
 * Generates a QR code as a PNG data URL (base64).
 * Used to return QR code images in API responses.
 */
export const generateQRDataUrl = async (url: string): Promise<string> => {
    return QRCode.toDataURL(url, {
        errorCorrectionLevel: 'M',
        width: 400,
        margin: 2,
        color: {
            dark: '#000000',
            light: '#FFFFFF',
        },
    });
};

/**
 * Generates a QR code as an SVG string.
 * Useful for embedding directly in HTML or PDF.
 */
export const generateQRSvg = async (url: string): Promise<string> => {
    return QRCode.toString(url, {
        type: 'svg',
        errorCorrectionLevel: 'M',
        width: 400,
        margin: 2,
    });
};

/**
 * Generates a QR code as a raw PNG buffer.
 * Useful for downloading as a file.
 */
export const generateQRBuffer = async (url: string): Promise<Buffer> => {
    return QRCode.toBuffer(url, {
        errorCorrectionLevel: 'M',
        width: 512,
        margin: 2,
        color: {
            dark: '#000000',
            light: '#FFFFFF',
        },
    });
};
