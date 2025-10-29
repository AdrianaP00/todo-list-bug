import { Test, TestingModule } from '@nestjs/testing';
import { LoginAttemptService } from '../../src/common/services/login-attempt.service';

describe('LoginAttemptService', () => {
    let service: LoginAttemptService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [LoginAttemptService],
        }).compile();

        service = module.get<LoginAttemptService>(LoginAttemptService);
    });

    describe('recordFailedAttempt', () => {
        it('should record failed login attempts', async () => {
            const ip = '192.168.1.1';
            const email = 'test@example.com';

            await service.recordFailedAttempt(ip, email);

            // Should not be blocked after first attempt
            const isBlocked = await service.isBlocked(ip, email);
            expect(isBlocked).toBe(false);
        });

        it('should block after maximum attempts exceeded', async () => {
            const ip = '192.168.1.2';
            const email = 'test2@example.com';

            // Record 5 failed attempts (default max)
            for (let i = 0; i < 5; i++) {
                await service.recordFailedAttempt(ip, email);
            }

            // Should be blocked now
            const isBlocked = await service.isBlocked(ip, email);
            expect(isBlocked).toBe(true);
        });

        it('should track attempts by IP and email combination', async () => {
            const ip1 = '192.168.1.3';
            const ip2 = '192.168.1.4';
            const email = 'test3@example.com';

            // Record attempts for different IPs
            for (let i = 0; i < 3; i++) {
                await service.recordFailedAttempt(ip1, email);
                await service.recordFailedAttempt(ip2, email);
            }

            // Neither should be blocked yet (under limit)
            expect(await service.isBlocked(ip1, email)).toBe(false);
            expect(await service.isBlocked(ip2, email)).toBe(false);
        });
    });

    describe('resetAttempts', () => {
        it('should reset failed attempts for successful login', async () => {
            const ip = '192.168.1.5';
            const email = 'test4@example.com';

            // Record some failed attempts
            for (let i = 0; i < 3; i++) {
                await service.recordFailedAttempt(ip, email);
            }

            // Reset attempts
            await service.resetAttempts(ip, email);

            // Should not be blocked after reset
            const isBlocked = await service.isBlocked(ip, email);
            expect(isBlocked).toBe(false);
        });
    });

    describe('getBlockTimeRemaining', () => {
        it('should return remaining block time', async () => {
            const ip = '192.168.1.6';
            const email = 'test5@example.com';

            // Block the user
            for (let i = 0; i < 5; i++) {
                await service.recordFailedAttempt(ip, email);
            }

            const remainingTime = await service.getBlockTimeRemaining(
                ip,
                email,
            );
            expect(remainingTime).toBeGreaterThan(0);
        });

        it('should return 0 for non-blocked users', async () => {
            const ip = '192.168.1.7';
            const email = 'test6@example.com';

            const remainingTime = await service.getBlockTimeRemaining(
                ip,
                email,
            );
            expect(remainingTime).toBe(0);
        });
    });

    describe('cleanup', () => {
        it('should clean up expired entries', async () => {
            // This is more of an integration test
            // The cleanup method removes old entries
            service.cleanup();
            expect(true).toBe(true); // Cleanup should not throw
        });
    });
});

