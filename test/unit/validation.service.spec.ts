import { Test, TestingModule } from '@nestjs/testing';
import { ValidationService } from '../../src/common/services/validation.service';

describe('ValidationService', () => {
    let service: ValidationService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [ValidationService],
        }).compile();

        service = module.get<ValidationService>(ValidationService);
    });

    describe('validateEmail', () => {
        it('should accept valid email addresses', () => {
            const validEmails = [
                'test@example.com',
                'user.name@domain.com',
                'user+tag@domain.co.uk',
                'test123@subdomain.example.org',
            ];

            validEmails.forEach((email) => {
                const result = service.validateEmail(email);
                expect(result.valid).toBe(true);
            });
        });

        it('should reject invalid email formats', () => {
            const invalidEmails = [
                'notanemail',
                '@domain.com',
                'user@',
                'user..double@domain.com',
                'user@domain',
                'user@.com',
            ];

            invalidEmails.forEach((email) => {
                const result = service.validateEmail(email);
                expect(result.valid).toBe(false);
                expect(result.error).toBeDefined();
            });
        });

        it('should detect dangerous patterns', () => {
            const dangerousEmails = [
                'test<script>@domain.com',
                'javascript:alert@domain.com',
                'test@domain..com',
                'test@@domain.com',
            ];

            dangerousEmails.forEach((email) => {
                const result = service.validateEmail(email);
                expect(result.valid).toBe(false);
            });
        });

        it('should validate email length limits', () => {
            const longEmail = 'a'.repeat(250) + '@domain.com';
            const result = service.validateEmail(longEmail);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('too long');
        });
    });

    describe('validatePassword', () => {
        it('should accept strong passwords', () => {
            const strongPasswords = [
                'StrongPass123!',
                'MySecure@Pass456',
                'Complex#Password789',
            ];

            strongPasswords.forEach((password) => {
                const result = service.validatePassword(password);
                expect(result.valid).toBe(true);
            });
        });

        it('should reject weak passwords', () => {
            const weakPasswords = [
                '123456', // Too short
                'password', // No numbers, uppercase, special chars
                'PASSWORD123', // No lowercase, special chars
                'Password123', // No special characters
                'Password!', // No numbers
            ];

            weakPasswords.forEach((password) => {
                const result = service.validatePassword(password);
                expect(result.valid).toBe(false);
                expect(result.error).toBeDefined();
            });
        });

        it('should reject overly long passwords', () => {
            const longPassword = 'A1!' + 'a'.repeat(200);
            const result = service.validatePassword(longPassword);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('too long');
        });
    });
});

