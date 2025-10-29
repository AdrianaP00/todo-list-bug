import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class CorsInterceptor implements NestInterceptor {
    private readonly allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        // Add production domains here
        process.env['FRONTEND_URL'],
    ].filter(Boolean);

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const response = context.switchToHttp().getResponse();
        const request = context.switchToHttp().getRequest();

        const origin = request.headers.origin;

        // Set CORS headers
        if (origin && this.allowedOrigins.includes(origin)) {
            response.header('Access-Control-Allow-Origin', origin);
        } else if (process.env['NODE_ENV'] === 'development') {
            // Allow all origins in development
            response.header('Access-Control-Allow-Origin', '*');
        }

        response.header(
            'Access-Control-Allow-Methods',
            'GET, POST, PUT, DELETE, OPTIONS',
        );
        response.header(
            'Access-Control-Allow-Headers',
            'Content-Type, Authorization, X-Requested-With',
        );
        response.header('Access-Control-Allow-Credentials', 'true');
        response.header('Access-Control-Max-Age', '86400'); // 24 hours

        // Security headers
        response.header('X-Content-Type-Options', 'nosniff');
        response.header('X-Frame-Options', 'DENY');
        response.header('X-XSS-Protection', '1; mode=block');
        response.header(
            'Strict-Transport-Security',
            'max-age=31536000; includeSubDomains',
        );
        response.header('Referrer-Policy', 'strict-origin-when-cross-origin');
        response.header(
            'Content-Security-Policy',
            "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';",
        );

        return next.handle().pipe(
            tap(() => {
                // Additional security headers can be added here if needed
            }),
        );
    }
}

