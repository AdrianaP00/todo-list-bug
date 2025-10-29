import { Injectable, Logger } from '@nestjs/common';
import { securityConstants } from '../../auth/constants';

interface LoginAttempt {
    attempts: number;
    blockedUntil?: Date;
    lastAttempt: Date;
}

@Injectable()
export class LoginAttemptService {
    private readonly logger = new Logger(LoginAttemptService.name);
    private loginAttempts = new Map<string, LoginAttempt>();

    private getKey(ip: string, email?: string): string {
        return email ? `${ip}:${email}` : ip;
    }

    async recordFailedAttempt(ip: string, email?: string): Promise<void> {
        const key = this.getKey(ip, email);
        const now = new Date();
        const existing = this.loginAttempts.get(key);

        if (existing) {
            // Reset counter if the time window has passed
            const timeSinceLastAttempt =
                now.getTime() - existing.lastAttempt.getTime();
            if (timeSinceLastAttempt > securityConstants.loginWindowMs) {
                this.loginAttempts.set(key, {
                    attempts: 1,
                    lastAttempt: now,
                });
            } else {
                const newAttempts = existing.attempts + 1;
                const loginAttempt: LoginAttempt = {
                    attempts: newAttempts,
                    lastAttempt: now,
                };

                // Block if max attempts exceeded
                if (newAttempts >= securityConstants.maxLoginAttempts) {
                    loginAttempt.blockedUntil = new Date(
                        now.getTime() + securityConstants.loginWindowMs,
                    );
                    this.logger.warn(
                        `IP/Email blocked due to excessive failed login attempts: ${key}`,
                    );
                }

                this.loginAttempts.set(key, loginAttempt);
            }
        } else {
            this.loginAttempts.set(key, {
                attempts: 1,
                lastAttempt: now,
            });
        }
    }

    async isBlocked(ip: string, email?: string): Promise<boolean> {
        const key = this.getKey(ip, email);
        const attempt = this.loginAttempts.get(key);

        if (!attempt || !attempt.blockedUntil) {
            return false;
        }

        const now = new Date();
        if (now > attempt.blockedUntil) {
            // Block period has expired, clean up
            this.loginAttempts.delete(key);
            return false;
        }

        return true;
    }

    async resetAttempts(ip: string, email?: string): Promise<void> {
        const key = this.getKey(ip, email);
        this.loginAttempts.delete(key);
    }

    async getBlockTimeRemaining(ip: string, email?: string): Promise<number> {
        const key = this.getKey(ip, email);
        const attempt = this.loginAttempts.get(key);

        if (!attempt || !attempt.blockedUntil) {
            return 0;
        }

        const remaining = attempt.blockedUntil.getTime() - Date.now();
        return Math.max(0, Math.ceil(remaining / 1000)); // Return seconds
    }

    // Clean up old entries periodically
    cleanup(): void {
        const now = new Date();
        const expiredKeys: string[] = [];

        for (const [key, attempt] of this.loginAttempts.entries()) {
            const timeSinceLastAttempt =
                now.getTime() - attempt.lastAttempt.getTime();
            if (timeSinceLastAttempt > securityConstants.loginWindowMs * 2) {
                expiredKeys.push(key);
            }
        }

        expiredKeys.forEach((key) => this.loginAttempts.delete(key));

        if (expiredKeys.length > 0) {
            this.logger.debug(
                `Cleaned up ${expiredKeys.length} expired login attempt records`,
            );
        }
    }
}

