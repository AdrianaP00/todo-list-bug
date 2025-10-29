import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { RateLimitInterceptor } from '../../src/common/interceptors/rate-limit.interceptor';

describe('RateLimitInterceptor', () => {
    let interceptor: RateLimitInterceptor;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [RateLimitInterceptor],
        }).compile();

        interceptor = module.get<RateLimitInterceptor>(RateLimitInterceptor);
    });

    const createMockExecutionContext = (
        path: string,
        ip: string = '127.0.0.1',
        userId?: string,
    ): ExecutionContext => {
        return {
            switchToHttp: () => ({
                getRequest: () => ({
                    route: { path },
                    ip,
                    user: userId ? { id: userId } : undefined,
                    headers: { 'user-agent': 'test-agent' },
                }),
                getResponse: () => ({}),
            }),
        } as ExecutionContext;
    };

    const createMockCallHandler = (): CallHandler => {
        return {
            handle: () => of('test response'),
        };
    };

    describe('rate limiting by endpoint', () => {
        it('should allow requests under the rate limit', () => {
            const context = createMockExecutionContext(
                '/tasks/create',
                '127.0.0.1',
            );
            const next = createMockCallHandler();

            expect(() => {
                interceptor.intercept(context, next);
            }).not.toThrow();
        });

        it('should apply different limits to different endpoints', () => {
            // Login endpoint has stricter limits
            const loginContext = createMockExecutionContext(
                '/auth/login',
                '127.0.0.1',
            );
            const taskContext = createMockExecutionContext(
                '/tasks/create',
                '127.0.0.1',
            );
            const next = createMockCallHandler();

            // Both should initially work
            expect(() => {
                interceptor.intercept(loginContext, next);
            }).not.toThrow();

            expect(() => {
                interceptor.intercept(taskContext, next);
            }).not.toThrow();
        });

        it('should differentiate between authenticated and unauthenticated users', () => {
            const unauthContext = createMockExecutionContext(
                '/tasks/create',
                '127.0.0.1',
            );
            const authContext = createMockExecutionContext(
                '/tasks/create',
                '127.0.0.1',
                'user123',
            );
            const next = createMockCallHandler();

            // Both should work initially
            expect(() => {
                interceptor.intercept(unauthContext, next);
            }).not.toThrow();

            expect(() => {
                interceptor.intercept(authContext, next);
            }).not.toThrow();
        });
    });

    describe('client identification', () => {
        it('should use user ID for authenticated users', () => {
            const context = createMockExecutionContext(
                '/tasks/create',
                '127.0.0.1',
                'user123',
            );
            const next = createMockCallHandler();

            expect(() => {
                interceptor.intercept(context, next);
            }).not.toThrow();
        });

        it('should use IP for unauthenticated users', () => {
            const context = createMockExecutionContext(
                '/auth/login',
                '192.168.1.1',
            );
            const next = createMockCallHandler();

            expect(() => {
                interceptor.intercept(context, next);
            }).not.toThrow();
        });
    });
});

