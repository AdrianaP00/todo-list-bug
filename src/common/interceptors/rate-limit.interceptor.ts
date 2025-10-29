import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';

interface RateLimitStore {
    [key: string]: {
        count: number;
        resetTime: number;
    };
}

@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
    private readonly logger = new Logger(RateLimitInterceptor.name);
    private readonly store: RateLimitStore = {};

    // Rate limits by endpoint type
    private readonly limits = {
        '/auth/login': { requests: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
        '/users/create': { requests: 3, windowMs: 60 * 60 * 1000 }, // 3 registrations per hour
        '/tasks/create': { requests: 20, windowMs: 60 * 1000 }, // 20 tasks per minute
        '/tasks/edit': { requests: 30, windowMs: 60 * 1000 }, // 30 edits per minute
        default: { requests: 100, windowMs: 15 * 60 * 1000 }, // 100 requests per 15 minutes
    };

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const clientId = this.getClientIdentifier(request);
        const endpoint = request.route?.path || 'default';

        // Get appropriate rate limit for this endpoint
        const limit =
            this.limits[endpoint as keyof typeof this.limits] ||
            this.limits.default;
        // Check rate limit
        if (this.isRateLimited(clientId, endpoint, limit)) {
            this.logger.warn(
                `Rate limit exceeded for ${clientId} on ${endpoint}`,
                {
                    clientId,
                    endpoint,
                    userAgent: request.headers['user-agent'],
                    ip: request.ip,
                },
            );

            throw new HttpException(
                'Too many requests. Try again later.',
                HttpStatus.TOO_MANY_REQUESTS,
            );
        }

        return next.handle();
    }

    private getClientIdentifier(request: any): string {
        // Use user ID if authenticated, otherwise fall back to IP
        const userId = request.user?.id;
        const ip = request.ip || request.connection?.remoteAddress || 'unknown';
        return userId ? `user:${userId}` : `ip:${ip}`;
    }

    private isRateLimited(
        clientId: string,
        endpoint: string,
        limit: { requests: number; windowMs: number },
    ): boolean {
        const key = `${clientId}:${endpoint}`;
        const now = Date.now();
        // Clean up expired entries periodically
        this.cleanupExpiredEntries(now);
        if (!this.store[key]) {
            this.store[key] = { count: 1, resetTime: now + limit.windowMs };
            return false;
        }
        const entry = this.store[key];
        // Reset counter if window has passed
        if (now > entry.resetTime) {
            entry.count = 1;
            entry.resetTime = now + limit.windowMs;
            return false;
        }
        // Increment and check limit
        entry.count++;
        return entry.count > limit.requests;
    }
    private cleanupExpiredEntries(now: number): void {
        // Only cleanup occasionally to avoid performance impact
        if (Math.random() > 0.01) return; // 1% chance

        Object.keys(this.store).forEach((key) => {
            if (now > this.store[key].resetTime) {
                delete this.store[key];
            }
        });
    }
}
