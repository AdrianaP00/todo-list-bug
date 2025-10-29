import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { SecurityLoggingService } from '../services/security-logging.service';

@Injectable()
export class SecurityLoggingInterceptor implements NestInterceptor {
    constructor(
        private readonly securityLoggingService: SecurityLoggingService,
    ) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const startTime = Date.now();

        return next.handle().pipe(
            tap((_response) => {
                const endTime = Date.now();
                const responseTime = endTime - startTime;

                // Log performance metrics
                this.securityLoggingService.logPerformanceMetric({
                    endpoint: request.route?.path || request.url,
                    method: request.method,
                    responseTime,
                    statusCode: context.switchToHttp().getResponse().statusCode,
                    userId: request.user?.id,
                });

                // Log successful operations for audit trail
                if (request.user?.id) {
                    const endpoint = request.route?.path;

                    // Log important security-relevant operations
                    if (endpoint?.includes('/auth/login')) {
                        this.securityLoggingService.logSecurityEvent({
                            type: 'login_attempt',
                            userId: request.user.id,
                            email: request.user.email,
                            ip: request.ip,
                            userAgent: request.headers['user-agent'],
                            endpoint,
                            severity: 'low',
                        });
                    }

                    if (endpoint?.includes('/users/create')) {
                        this.securityLoggingService.logSecurityEvent({
                            type: 'account_creation',
                            email: request.body?.email,
                            ip: request.ip,
                            userAgent: request.headers['user-agent'],
                            endpoint,
                            severity: 'medium',
                        });
                    }
                }
            }),
            catchError((error) => {
                const endTime = Date.now();
                const responseTime = endTime - startTime;

                // Log failed requests with security implications
                this.securityLoggingService.logPerformanceMetric({
                    endpoint: request.route?.path || request.url,
                    method: request.method,
                    responseTime,
                    statusCode: error.status || 500,
                    userId: request.user?.id,
                });

                // Log security events for various error types
                if (error.status === 401) {
                    this.securityLoggingService.logSecurityEvent({
                        type: 'failed_login',
                        email: request.body?.email,
                        ip: request.ip,
                        userAgent: request.headers['user-agent'],
                        endpoint: request.route?.path,
                        severity: 'medium',
                        details: { errorMessage: error.message },
                    });
                }

                if (error.status === 403) {
                    this.securityLoggingService.logSecurityEvent({
                        type: 'unauthorized_access',
                        userId: request.user?.id,
                        email: request.user?.email,
                        ip: request.ip,
                        userAgent: request.headers['user-agent'],
                        endpoint: request.route?.path,
                        resource: request.params?.id,
                        severity: 'high',
                        details: { errorMessage: error.message },
                    });
                }

                if (error.status === 429) {
                    this.securityLoggingService.logSecurityEvent({
                        type: 'rate_limit_exceeded',
                        userId: request.user?.id,
                        ip: request.ip,
                        userAgent: request.headers['user-agent'],
                        endpoint: request.route?.path,
                        severity: 'medium',
                    });
                }

                throw error;
            }),
        );
    }
}
