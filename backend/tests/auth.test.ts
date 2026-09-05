import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Auth: OTP Code Generation & Expiration', () => {
    const generateOTP = (): string => {
        return Math.floor(100000 + Math.random() * 900000).toString();
    };

    it('should generate a 6-digit numeric OTP code', () => {
        for (let i = 0; i < 50; i++) {
            const otp = generateOTP();
            assert.strictEqual(otp.length, 6, 'OTP must be exactly 6 characters');
            assert.strictEqual(/^\d{6}$/.test(otp), true, 'OTP must consist solely of digits');
            const num = parseInt(otp, 10);
            assert.strictEqual(num >= 100000 && num <= 999999, true, 'OTP must be within 100000..999999');
        }
    });

    it('should calculate valid expiration timestamp 10 minutes into future', () => {
        const now = Date.now();
        const expiresInMinutes = 10;
        const expiresAt = new Date(now + expiresInMinutes * 60 * 1000);

        const diffSeconds = Math.round((expiresAt.getTime() - now) / 1000);
        assert.strictEqual(diffSeconds, 600, 'Expiration must equal exactly 600 seconds');
    });

    it('should normalize and clean email addresses', () => {
        const normalizeEmail = (email: string) => email.trim().toLowerCase();

        assert.strictEqual(normalizeEmail('  User@Example.COM '), 'user@example.com');
        assert.strictEqual(normalizeEmail('HELLO@Restaurant.et'), 'hello@restaurant.et');
    });
});
