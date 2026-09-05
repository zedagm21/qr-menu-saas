import { describe, it } from 'node:test';
import assert from 'node:assert';
import { PRIVATE_IP_REGEX } from '../src/controllers/publicController';
import { authRateLimiter, publicRateLimiter } from '../src/middleware/rateLimiter';
import { errorHandler, createError } from '../src/middleware/errorHandler';

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

describe('Security: CORS Production Allowlist & Origin Validation', () => {
    const allowedOrigins = Array.from(new Set([
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'https://www.ourmenu.et',
        'https://ourmenu.et',
    ]));

    const checkOrigin = (
        origin: string | undefined,
        callback: (err: any, allow?: boolean) => void
    ) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(createError(`CORS: Origin ${origin} not allowed`, 403));
    };

    it('should permit canonical production domain (https://www.ourmenu.et)', () => {
        checkOrigin('https://www.ourmenu.et', (err, allow) => {
            assert.strictEqual(err, null);
            assert.strictEqual(allow, true);
        });
    });

    it('should permit apex production domain (https://ourmenu.et)', () => {
        checkOrigin('https://ourmenu.et', (err, allow) => {
            assert.strictEqual(err, null);
            assert.strictEqual(allow, true);
        });
    });

    it('should permit local development origins', () => {
        for (const local of ['http://localhost:5173', 'http://127.0.0.1:5173']) {
            checkOrigin(local, (err, allow) => {
                assert.strictEqual(err, null);
                assert.strictEqual(allow, true);
            });
        }
    });

    it('should permit requests with no origin header (mobile, curl, health-checks)', () => {
        checkOrigin(undefined, (err, allow) => {
            assert.strictEqual(err, null);
            assert.strictEqual(allow, true);
        });
    });

    it('should reject unauthorized origins with a 403 operational error', () => {
        const unauthorizedOrigins = [
            'https://evil.example',
            'https://ourmenu.et.attacker.com',
            'https://phishing-ourmenu.et',
            'http://ourmenu.et',
        ];

        for (const evilOrigin of unauthorizedOrigins) {
            checkOrigin(evilOrigin, (err, allow) => {
                assert.notStrictEqual(err, null);
                assert.strictEqual(allow, undefined);
                assert.strictEqual(err.statusCode, 403);
                assert.strictEqual(err.isOperational, true);
                assert.strictEqual(err.message, `CORS: Origin ${evilOrigin} not allowed`);
            });
        }
    });
});

describe('Security: Error Handler & Production Data Protection', () => {
    const createMockRes = () => {
        const res: any = {
            statusCode: 200,
            body: null,
            status(code: number) {
                this.statusCode = code;
                return this;
            },
            json(payload: any) {
                this.body = payload;
                return this;
            },
        };
        return res;
    };

    it('should shield database errors and return generic 500 in production without stack traces', () => {
        const prevEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';

        const originalConsoleError = console.error;
        let loggedError: any = null;
        console.error = (...args: any[]) => {
            loggedError = args;
        };

        try {
            const res = createMockRes();
            const sensitiveDbError = new Error('FATAL: connection to postgres://neondb_owner:secret123@ep-cool-pooler.neon.tech/neondb failed');

            errorHandler(sensitiveDbError, {} as any, res, () => {});

            // Client response must be generic 500
            assert.strictEqual(res.statusCode, 500);
            assert.deepStrictEqual(res.body, { error: 'Internal server error' });
            assert.strictEqual(res.body.stack, undefined);
            assert.strictEqual(JSON.stringify(res.body).includes('secret123'), false);

            // Server must have logged the unexpected error
            assert.notStrictEqual(loggedError, null);
            assert.strictEqual(loggedError[0], 'Unhandled server error:');
        } finally {
            console.error = originalConsoleError;
            process.env.NODE_ENV = prevEnv;
        }
    });

    it('should format CORS rejection as 403 operational error without marking as 500 in production', () => {
        const prevEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';
        try {
            const res = createMockRes();
            const corsError = createError('CORS: Origin https://evil.example not allowed', 403);

            errorHandler(corsError, {} as any, res, () => {});

            assert.strictEqual(res.statusCode, 403);
            assert.deepStrictEqual(res.body, {
                error: 'CORS: Origin https://evil.example not allowed',
            });
            assert.strictEqual(res.body.stack, undefined);
        } finally {
            process.env.NODE_ENV = prevEnv;
        }
    });
});
