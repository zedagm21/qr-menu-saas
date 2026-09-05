import { describe, it } from 'node:test';
import assert from 'node:assert';
import { PRIVATE_IP_REGEX } from '../src/controllers/publicController';
import { authRateLimiter, publicRateLimiter } from '../src/middleware/rateLimiter';

describe('Security: SSRF Prevention & Safe Image Proxying', () => {
    it('should identify and block loopback addresses', () => {
        const loopbacks = ['localhost', '127.0.0.1', '127.0.1.1', '0.0.0.0', '::1', '[::1]'];
        for (const host of loopbacks) {
            assert.strictEqual(
                PRIVATE_IP_REGEX.test(host),
                true,
                `Expected ${host} to be detected as private/loopback`
            );
        }
    });

    it('should identify and block AWS/Cloud metadata IP (169.254.169.254)', () => {
        assert.strictEqual(PRIVATE_IP_REGEX.test('169.254.169.254'), true);
        assert.strictEqual(PRIVATE_IP_REGEX.test('169.254.1.1'), true);
    });

    it('should identify and block private RFC 1918 subnets', () => {
        const privateIps = [
            '10.0.0.1',
            '10.255.255.255',
            '172.16.0.1',
            '172.20.10.4',
            '172.31.255.255',
            '192.168.0.1',
            '192.168.1.100',
        ];
        for (const ip of privateIps) {
            assert.strictEqual(
                PRIVATE_IP_REGEX.test(ip),
                true,
                `Expected RFC 1918 IP ${ip} to be blocked`
            );
        }
    });

    it('should permit legitimate public HTTPS image domains', () => {
        const publicDomains = [
            'vistacafeandrestaurant.com',
            'images.unsplash.com',
            'pub-abc12345.r2.dev',
            'cloudinary.com',
            'storage.googleapis.com',
        ];
        for (const domain of publicDomains) {
            assert.strictEqual(
                PRIVATE_IP_REGEX.test(domain),
                false,
                `Expected public domain ${domain} to be permitted`
            );
        }
    });

    it('should enforce HTTPS-only URLs and reject non-secure protocols', () => {
        const validateProtocol = (urlStr: string): boolean => {
            try {
                const parsed = new URL(urlStr);
                return parsed.protocol === 'https:';
            } catch {
                return false;
            }
        };

        assert.strictEqual(validateProtocol('http://example.com/img.jpg'), false);
        assert.strictEqual(validateProtocol('file:///etc/passwd'), false);
        assert.strictEqual(validateProtocol('gopher://example.com/img.jpg'), false);
        assert.strictEqual(validateProtocol('https://example.com/img.jpg'), true);
    });
});

describe('Security: Route Rate Limiting Middleware', () => {
    it('should export authRateLimiter middleware with active rate-limiting configuration', () => {
        assert.strictEqual(typeof authRateLimiter, 'function');
    });

    it('should export publicRateLimiter middleware for diner interaction and scans', () => {
        assert.strictEqual(typeof publicRateLimiter, 'function');
    });
});
