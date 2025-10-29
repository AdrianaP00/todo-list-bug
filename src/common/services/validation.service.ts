import { Injectable } from '@nestjs/common';
import { validationConstants } from '../../auth/constants';

@Injectable()
export class ValidationService {
    private readonly emailRegex =
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    private readonly allowedDomains = new Set([
        'gmail.com',
        'yahoo.com',
        'hotmail.com',
        'outlook.com',
        'icloud.com',
        'proton.me',
        'protonmail.com',
        // Add more trusted domains as needed
    ]);

    validateEmail(email: string): { valid: boolean; error?: string } {
        if (!email || typeof email !== 'string') {
            return { valid: false, error: 'Email is required' };
        }

        if (email.length > validationConstants.maxEmailLength) {
            return {
                valid: false,
                error: `Email too long (max ${validationConstants.maxEmailLength} characters)`,
            };
        }

        const normalizedEmail = email.toLowerCase().trim();

        if (!this.emailRegex.test(normalizedEmail)) {
            return { valid: false, error: 'Invalid email format' };
        }

        // Check for common dangerous patterns
        if (this.containsDangerousPatterns(normalizedEmail)) {
            return { valid: false, error: 'Invalid email format' };
        }

        const domain = normalizedEmail.split('@')[1];
        if (
            process.env['NODE_ENV'] === 'production' &&
            !this.allowedDomains.has(domain)
        ) {
            return {
                valid: false,
                error: 'Email domain not allowed. Please use a common email provider.',
            };
        }

        return { valid: true };
    }

    validatePassword(password: string): { valid: boolean; error?: string } {
        if (!password || typeof password !== 'string') {
            return { valid: false, error: 'Password is required' };
        }

        if (password.length < validationConstants.passwordMinLength) {
            return {
                valid: false,
                error: `Password must be at least ${validationConstants.passwordMinLength} characters long`,
            };
        }

        if (password.length > 128) {
            return {
                valid: false,
                error: 'Password too long (max 128 characters)',
            };
        }

        // Check for at least one lowercase, uppercase, number, and special character
        const hasLowerCase = /[a-z]/.test(password);
        const hasUpperCase = /[A-Z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        if (!hasLowerCase || !hasUpperCase || !hasNumbers || !hasSpecialChar) {
            return {
                valid: false,
                error: 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
            };
        }

        // Check for common weak passwords
        const weakPasswords = [
            'password',
            '123456',
            'qwerty',
            'admin',
            'letmein',
            'welcome',
        ];

        if (weakPasswords.includes(password.toLowerCase())) {
            return { valid: false, error: 'Password is too common' };
        }

        return { valid: true };
    }

    validateFullName(fullname: string): { valid: boolean; error?: string } {
        if (!fullname || typeof fullname !== 'string') {
            return { valid: false, error: 'Full name is required' };
        }

        const trimmed = fullname.trim();
        if (trimmed.length === 0) {
            return { valid: false, error: 'Full name cannot be empty' };
        }

        if (trimmed.length > validationConstants.maxFullnameLength) {
            return {
                valid: false,
                error: `Full name too long (max ${validationConstants.maxFullnameLength} characters)`,
            };
        }

        // Allow letters, spaces, apostrophes, and hyphens
        const nameRegex = /^[a-zA-Z\s'-]+$/;
        if (!nameRegex.test(trimmed)) {
            return {
                valid: false,
                error: 'Full name can only contain letters, spaces, apostrophes, and hyphens',
            };
        }

        return { valid: true };
    }

    sanitizeInput(input: string): string {
        if (!input || typeof input !== 'string') {
            return '';
        }

        return input
            .trim()
            .replace(/[<>]/g, '') // Remove potential HTML tags
            .replace(/['"]/g, '') // Remove quotes to prevent injection
            .substring(0, 10000); // Limit length
    }

    private containsDangerousPatterns(email: string): boolean {
        const dangerousPatterns = [
            /\.\./, // Double dots
            /@.*@/, // Multiple @ symbols
            /[<>]/, // HTML brackets
            /javascript:/i, // JavaScript protocol
            /data:/i, // Data protocol
            /vbscript:/i, // VBScript protocol
        ];

        return dangerousPatterns.some((pattern) => pattern.test(email));
    }
}

