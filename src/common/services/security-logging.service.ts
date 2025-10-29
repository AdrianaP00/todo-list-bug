import { Injectable, Logger } from '@nestjs/common';

export interface SecurityEvent {
    type:
        | 'login_attempt'
        | 'failed_login'
        | 'unauthorized_access'
        | 'rate_limit_exceeded'
        | 'malicious_content'
        | 'data_breach_attempt'
        | 'password_change'
        | 'account_creation';
    userId?: string;
    email?: string;
    ip?: string;
    userAgent?: string;
    endpoint?: string;
    resource?: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    details?: any;
}

export interface PerformanceMetrics {
    endpoint: string;
    method: string;
    responseTime: number;
    statusCode: number;
    userId?: string;
}

@Injectable()
export class SecurityLoggingService {
    private readonly logger = new Logger(SecurityLoggingService.name);

    // In-memory store for security events (in production, use a proper database or external logging service)
    private securityEvents: Array<
        SecurityEvent & { timestamp: Date; id: string }
    > = [];
    private performanceMetrics: Array<
        PerformanceMetrics & { timestamp: Date }
    > = [];

    logSecurityEvent(event: SecurityEvent): void {
        const eventWithMetadata = {
            ...event,
            id: this.generateEventId(),
            timestamp: new Date(),
        };

        this.securityEvents.push(eventWithMetadata);

        // Also log to console based on severity
        const logMessage = `Security Event: ${event.type}`;
        const context = {
            userId: event.userId,
            email: event.email,
            ip: event.ip,
            endpoint: event.endpoint,
            details: event.details,
        };

        switch (event.severity) {
            case 'critical':
                this.logger.error(logMessage, context);
                break;
            case 'high':
                this.logger.error(logMessage, context);
                break;
            case 'medium':
                this.logger.warn(logMessage, context);
                break;
            case 'low':
                this.logger.log(logMessage, context);
                break;
        }

        // Cleanup old events periodically
        this.cleanupOldEvents();
    }

    logPerformanceMetric(metric: PerformanceMetrics): void {
        this.performanceMetrics.push({
            ...metric,
            timestamp: new Date(),
        });

        // Log slow requests
        if (metric.responseTime > 1000) {
            this.logger.warn(
                `Slow request detected: ${metric.method} ${metric.endpoint}`,
                {
                    responseTime: metric.responseTime,
                    statusCode: metric.statusCode,
                    userId: metric.userId,
                },
            );
        }

        // Cleanup old metrics
        this.cleanupOldMetrics();
    }

    getSecurityEventsSummary(): any {
        const now = new Date();
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const recentEvents = this.securityEvents.filter(
            (event) => event.timestamp > last24Hours,
        );

        const summary = {
            totalEvents: recentEvents.length,
            criticalEvents: recentEvents.filter(
                (e) => e.severity === 'critical',
            ).length,
            highSeverityEvents: recentEvents.filter(
                (e) => e.severity === 'high',
            ).length,
            failedLogins: recentEvents.filter((e) => e.type === 'failed_login')
                .length,
            rateLimitViolations: recentEvents.filter(
                (e) => e.type === 'rate_limit_exceeded',
            ).length,
            unauthorizedAccess: recentEvents.filter(
                (e) => e.type === 'unauthorized_access',
            ).length,
        };

        return summary;
    }

    getSuspiciousActivities(): Array<
        SecurityEvent & { timestamp: Date; id: string }
    > {
        const now = new Date();
        const lastHour = new Date(now.getTime() - 60 * 60 * 1000);

        return this.securityEvents.filter(
            (event) =>
                event.timestamp > lastHour &&
                (event.severity === 'high' || event.severity === 'critical'),
        );
    }

    detectAnomalies(): { hasAnomalies: boolean; details: string[] } {
        const now = new Date();
        const lastHour = new Date(now.getTime() - 60 * 60 * 1000);
        const recentEvents = this.securityEvents.filter(
            (event) => event.timestamp > lastHour,
        );

        const anomalies: string[] = [];

        // Check for multiple failed login attempts
        const failedLogins = recentEvents.filter(
            (e) => e.type === 'failed_login',
        );
        const failedLoginsByIp = this.groupBy(failedLogins, 'ip');

        Object.entries(failedLoginsByIp).forEach(([ip, events]) => {
            if (events.length >= 10) {
                anomalies.push(
                    `Potential brute force attack from IP: ${ip} (${events.length} failed attempts)`,
                );
            }
        });

        // Check for rate limit violations
        const rateLimitViolations = recentEvents.filter(
            (e) => e.type === 'rate_limit_exceeded',
        );
        if (rateLimitViolations.length > 20) {
            anomalies.push(
                `High number of rate limit violations: ${rateLimitViolations.length}`,
            );
        }

        // Check for malicious content attempts
        const maliciousAttempts = recentEvents.filter(
            (e) => e.type === 'malicious_content',
        );
        if (maliciousAttempts.length > 0) {
            anomalies.push(
                `Malicious content detected: ${maliciousAttempts.length} attempts`,
            );
        }

        return {
            hasAnomalies: anomalies.length > 0,
            details: anomalies,
        };
    }

    private generateEventId(): string {
        return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
        return array.reduce(
            (result, item) => {
                const group = String(item[key] || 'unknown');
                if (!result[group]) {
                    result[group] = [];
                }
                result[group].push(item);
                return result;
            },
            {} as Record<string, T[]>,
        );
    }

    private cleanupOldEvents(): void {
        // Keep only last 7 days of events
        const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        this.securityEvents = this.securityEvents.filter(
            (event) => event.timestamp > cutoff,
        );
    }

    private cleanupOldMetrics(): void {
        // Keep only last 24 hours of metrics
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
        this.performanceMetrics = this.performanceMetrics.filter(
            (metric) => metric.timestamp > cutoff,
        );
    }
}
