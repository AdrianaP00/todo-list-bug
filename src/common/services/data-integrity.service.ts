import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';

export interface DataIntegrityCheck {
    entityType: 'user' | 'task';
    entityId: string;
    checksum: string;
    timestamp: Date;
}

@Injectable()
export class DataIntegrityService {
    private readonly logger = new Logger(DataIntegrityService.name);
    private readonly checksums: Map<string, DataIntegrityCheck> = new Map();

    /**
     * Generate a checksum for critical data
     */
    generateChecksum(data: any): string {
        const normalizedData = this.normalizeData(data);
        return createHash('sha256')
            .update(JSON.stringify(normalizedData))
            .digest('hex');
    }

    /**
     * Store a checksum for later verification
     */
    storeChecksum(
        entityType: 'user' | 'task',
        entityId: string,
        data: any,
    ): void {
        const checksum = this.generateChecksum(data);
        const key = `${entityType}:${entityId}`;

        this.checksums.set(key, {
            entityType,
            entityId,
            checksum,
            timestamp: new Date(),
        });

        this.logger.log(
            `Checksum stored for ${entityType} ${entityId}: ${checksum.substring(0, 8)}...`,
        );
    }

    /**
     * Verify data integrity against stored checksum
     */
    verifyIntegrity(
        entityType: 'user' | 'task',
        entityId: string,
        currentData: any,
    ): boolean {
        const key = `${entityType}:${entityId}`;
        const storedCheck = this.checksums.get(key);

        if (!storedCheck) {
            this.logger.warn(`No checksum found for ${entityType} ${entityId}`);
            return true; // Allow if no previous checksum exists
        }

        const currentChecksum = this.generateChecksum(currentData);
        const isValid = storedCheck.checksum === currentChecksum;

        if (!isValid) {
            this.logger.error(
                `Data integrity violation detected for ${entityType} ${entityId}`,
                {
                    storedChecksum: storedCheck.checksum.substring(0, 8),
                    currentChecksum: currentChecksum.substring(0, 8),
                    timestamp: storedCheck.timestamp,
                },
            );
        }

        return isValid;
    }

    /**
     * Update checksum after legitimate data modification
     */
    updateChecksum(
        entityType: 'user' | 'task',
        entityId: string,
        newData: any,
    ): void {
        this.storeChecksum(entityType, entityId, newData);
    }

    /**
     * Validate critical fields haven't been tampered with
     */
    validateCriticalFields(entityType: 'user' | 'task', data: any): boolean {
        switch (entityType) {
            case 'user':
                return this.validateUserFields(data);
            case 'task':
                return this.validateTaskFields(data);
            default:
                return true;
        }
    }

    /**
     * Get integrity report for monitoring
     */
    getIntegrityReport(): {
        totalChecksums: number;
        integrityViolations: number;
        lastCheck: Date | null;
    } {
        const violations = Array.from(this.checksums.entries()).filter(
            ([_key, _check]) => {
                // This would normally re-verify against actual database data
                // For demo purposes, we'll just return the stored data
                return false; // No violations detected in this simplified check
            },
        ).length;

        return {
            totalChecksums: this.checksums.size,
            integrityViolations: violations,
            lastCheck: new Date(),
        };
    }

    private normalizeData(data: any): any {
        if (data === null || data === undefined) {
            return null;
        }

        if (Array.isArray(data)) {
            return data.map((item) => this.normalizeData(item)).sort();
        }

        if (typeof data === 'object') {
            const normalized: any = {};
            Object.keys(data)
                .sort()
                .forEach((key) => {
                    // Skip metadata fields that change frequently
                    if (
                        ![
                            'createdAt',
                            'updatedAt',
                            'lastModified',
                            'version',
                        ].includes(key)
                    ) {
                        normalized[key] = this.normalizeData(data[key]);
                    }
                });
            return normalized;
        }

        return data;
    }

    private validateUserFields(user: any): boolean {
        const requiredFields = ['id', 'email', 'fullname'];
        const criticalFields = ['id', 'email', 'pass'];

        // Check required fields exist
        for (const field of requiredFields) {
            if (!(field in user)) {
                this.logger.warn(
                    `Missing required field: ${field} in user data`,
                );
                return false;
            }
        }

        // Check critical fields for suspicious patterns
        for (const field of criticalFields) {
            if (this.containsSuspiciousContent(String(user[field] || ''))) {
                this.logger.error(
                    `Suspicious content detected in user field: ${field}`,
                );
                return false;
            }
        }

        // Validate email format
        if (user.email && !this.isValidEmail(user.email)) {
            this.logger.warn(`Invalid email format: ${user.email}`);
            return false;
        }

        return true;
    }

    private validateTaskFields(task: any): boolean {
        const requiredFields = ['id', 'title'];
        const criticalFields = ['id', 'title', 'description'];

        // Check required fields exist
        for (const field of requiredFields) {
            if (!(field in task)) {
                this.logger.warn(
                    `Missing required field: ${field} in task data`,
                );
                return false;
            }
        }

        // Check for suspicious content in text fields
        for (const field of criticalFields) {
            if (
                task[field] &&
                this.containsSuspiciousContent(String(task[field]))
            ) {
                this.logger.error(
                    `Suspicious content detected in task field: ${field}`,
                );
                return false;
            }
        }

        // Validate boolean fields
        if (task.done !== undefined && typeof task.done !== 'boolean') {
            this.logger.warn(
                `Invalid boolean value for done field: ${task.done}`,
            );
            return false;
        }

        return true;
    }

    private containsSuspiciousContent(content: string): boolean {
        const suspiciousPatterns = [
            /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi,
            /eval\s*\(/gi,
            /expression\s*\(/gi,
            /vbscript:/gi,
            /data:text\/html/gi,
            /data:application\/javascript/gi,
        ];

        return suspiciousPatterns.some((pattern) => pattern.test(content));
    }

    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}
