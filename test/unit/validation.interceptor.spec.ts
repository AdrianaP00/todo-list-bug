import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { ValidationInterceptor } from '../../src/common/interceptors/validation.interceptor';

describe('ValidationInterceptor', () => {
    let interceptor: ValidationInterceptor;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [ValidationInterceptor],
        }).compile();

        interceptor = module.get<ValidationInterceptor>(ValidationInterceptor);
    });

    const createMockExecutionContext = (
        params: any = {},
        body: any = {},
    ): ExecutionContext => {
        return {
            switchToHttp: () => ({
                getRequest: () => ({
                    params,
                    body,
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

    describe('UUID validation', () => {
        it('should accept valid UUIDs', () => {
            const validUUID = '123e4567-e89b-12d3-a456-426614174000';
            const context = createMockExecutionContext({ id: validUUID });
            const next = createMockCallHandler();

            expect(() => {
                interceptor.intercept(context, next);
            }).not.toThrow();
        });

        it('should reject invalid UUIDs', () => {
            const invalidUUIDs = ['not-a-uuid', '123', 'invalid-format'];

            invalidUUIDs.forEach((invalidUUID) => {
                const context = createMockExecutionContext({ id: invalidUUID });
                const next = createMockCallHandler();

                expect(() => {
                    interceptor.intercept(context, next);
                }).toThrow();
            });
        });
    });

    describe('request body validation', () => {
        it('should validate title length', () => {
            const longTitle = 'a'.repeat(300); // Exceeds 255 char limit
            const context = createMockExecutionContext(
                {},
                { title: longTitle },
            );
            const next = createMockCallHandler();

            expect(() => {
                interceptor.intercept(context, next);
            }).toThrow();
        });

        it('should validate description length', () => {
            const longDescription = 'a'.repeat(15000); // Exceeds 10000 char limit
            const context = createMockExecutionContext(
                {},
                { description: longDescription },
            );
            const next = createMockCallHandler();

            expect(() => {
                interceptor.intercept(context, next);
            }).toThrow();
        });

        it('should validate date format', () => {
            const invalidDate = 'not-a-date';
            const context = createMockExecutionContext(
                {},
                { dueDate: invalidDate },
            );
            const next = createMockCallHandler();

            expect(() => {
                interceptor.intercept(context, next);
            }).toThrow();
        });

        it('should detect malicious content', () => {
            const maliciousContent = {
                title: '<script>alert("xss")</script>',
                description: 'javascript:alert(1)',
            };
            const context = createMockExecutionContext({}, maliciousContent);
            const next = createMockCallHandler();

            expect(() => {
                interceptor.intercept(context, next);
            }).toThrow();
        });

        it('should allow valid content', () => {
            const validContent = {
                title: 'Valid Task Title',
                description: 'This is a valid description',
                dueDate: '2023-12-31T23:59:59.000Z',
            };
            const context = createMockExecutionContext({}, validContent);
            const next = createMockCallHandler();

            expect(() => {
                interceptor.intercept(context, next);
            }).not.toThrow();
        });
    });
});

