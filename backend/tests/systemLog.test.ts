import { describe, it } from 'node:test';
import assert from 'node:assert';
import { sanitizeMetadata, systemLogService } from '../src/services/SystemLogService';
import { errorHandler } from '../src/middleware/errorHandler';
import { LogLevel, LogSource } from '@prisma/client';

describe('SystemLog: Metadata Sanitization & Privacy Protection', () => {
    it('should mask sensitive credentials and secrets in metadata', () => {
        const input = {
            username: 'admin@ourmenu.et',
            password: 'SuperSecretPassword123!',
            token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            otp: '849201',
            nested: {
                creditCard: '4111222233334444',
                authorization: 'Bearer secret_token',
                safeData: 'visible_value',
            },
        };

        const sanitized = sanitizeMetadata(input);

        assert.strictEqual(sanitized.username, 'admin@ourmenu.et');
        assert.strictEqual(sanitized.password, '***MASKED***');
        assert.strictEqual(sanitized.token, '***MASKED***');
        assert.strictEqual(sanitized.otp, '***MASKED***');
        assert.strictEqual(sanitized.nested.creditCard, '***MASKED***');
        assert.strictEqual(sanitized.nested.authorization, '***MASKED***');
        assert.strictEqual(sanitized.nested.safeData, 'visible_value');
    });

    it('should safely handle arrays, nulls, and primitives in metadata', () => {
        assert.strictEqual(sanitizeMetadata(null), null);
        assert.strictEqual(sanitizeMetadata(undefined), undefined);
        assert.strictEqual(sanitizeMetadata(123), 123);
        assert.strictEqual(sanitizeMetadata('hello'), 'hello');

        const arrayInput = [
            { password: '123', name: 'Alice' },
            { token: 'xyz', name: 'Bob' },
        ];
        const sanitizedArray = sanitizeMetadata(arrayInput);
        assert.strictEqual(sanitizedArray[0].password, '***MASKED***');
        assert.strictEqual(sanitizedArray[0].name, 'Alice');
        assert.strictEqual(sanitizedArray[1].token, '***MASKED***');
        assert.strictEqual(sanitizedArray[1].name, 'Bob');
    });
});

describe('SystemLog: ErrorHandler Log Recording Interception', () => {
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

    it('should intercept unexpected 500 errors and trigger recordLog', () => {
        let loggedParams: any = null;
        const originalRecord = systemLogService.recordLog;
        systemLogService.recordLog = async (params: any) => {
            loggedParams = params;
        };

        try {
            const res = createMockRes();
            const mockReq: any = {
                method: 'POST',
                originalUrl: '/api/menu/items',
                ip: '127.0.0.1',
                get: (header: string) => (header === 'user-agent' ? 'Mozilla/5.0 TestBrowser' : null),
                user: { id: 'usr_test_1', restaurantId: 'rest_test_1' },
                query: { filter: 'active' },
                body: { name: 'Burger', password: 'plainPassword' },
            };

            const unexpectedErr = new Error('Database connection pool exhausted');

            errorHandler(unexpectedErr, mockReq, res, () => {});

            assert.strictEqual(res.statusCode, 500);
            assert.notStrictEqual(loggedParams, null);
            assert.strictEqual(loggedParams.level, LogLevel.FATAL);
            assert.strictEqual(loggedParams.source, LogSource.BACKEND);
            assert.strictEqual(loggedParams.message, 'Database connection pool exhausted');
            assert.strictEqual(loggedParams.path, '/api/menu/items');
            assert.strictEqual(loggedParams.method, 'POST');
            assert.strictEqual(loggedParams.ipAddress, '127.0.0.1');
            assert.strictEqual(loggedParams.userId, 'usr_test_1');
            assert.strictEqual(loggedParams.restaurantId, 'rest_test_1');
        } finally {
            systemLogService.recordLog = originalRecord;
        }
    });

    it('should not throw if request object is empty or malformed', () => {
        let loggedParams: any = null;
        const originalRecord = systemLogService.recordLog;
        systemLogService.recordLog = async (params: any) => {
            loggedParams = params;
        };

        try {
            const res = createMockRes();
            const malformedReq: any = {};
            const unexpectedErr = new Error('Unexpected crash with empty request');

            errorHandler(unexpectedErr, malformedReq, res, () => {});

            assert.strictEqual(res.statusCode, 500);
            assert.notStrictEqual(loggedParams, null);
            assert.strictEqual(loggedParams.level, LogLevel.FATAL);
            assert.strictEqual(loggedParams.source, LogSource.BACKEND);
            assert.strictEqual(loggedParams.path, null);
        } finally {
            systemLogService.recordLog = originalRecord;
        }
    });

    it('should safely handle and not block when recordLog fails', () => {
        const originalRecord = systemLogService.recordLog;
        systemLogService.recordLog = async () => {
            throw new Error('Database disk full');
        };

        try {
            const res = createMockRes();
            const err = new Error('Simulated failure');

            // Should complete cleanly without uncaught rejection
            errorHandler(err, {} as any, res, () => {});
            assert.strictEqual(res.statusCode, 500);
        } finally {
            systemLogService.recordLog = originalRecord;
        }
    });
});
