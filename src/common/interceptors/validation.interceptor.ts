import {
    BadRequestException,
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { Observable, catchError, throwError } from 'rxjs';
import { isUuid } from '../utils/uuid.util';

@Injectable()
export class ValidationInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        
        // Validate UUID parameters
        this.validateUuidParams(request.params);
        
        // Validate request body size and structure
        this.validateRequestBody(request.body);
        
        return next.handle().pipe(
            catchError((error) => {
                // Add additional context to errors
                if (
                    error.message?.includes(
                        'invalid input syntax for type uuid',
                    )
                ) {
                    return throwError(
                        () => new BadRequestException('Invalid task ID format'),
                    );
                }
                
                return throwError(() => error);
            }),
        );
    }

    private validateUuidParams(params: any): void {
        if (params?.id && !isUuid(params.id)) {
            throw new BadRequestException(
                `Invalid ID format: ${params.id}. Expected UUID format.`,
            );
        }
    }

    private validateRequestBody(body: any): void {
        if (!body) return;

        // Check for excessively large strings
        const MAX_STRING_LENGTH = 10000;
        const MAX_TITLE_LENGTH = 255;

        if (body.title && body.title.length > MAX_TITLE_LENGTH) {
            throw new BadRequestException(
                `Title too long. Maximum length is ${MAX_TITLE_LENGTH} characters.`,
            );
        }

        if (body.description && body.description.length > MAX_STRING_LENGTH) {
            throw new BadRequestException(
                `Description too long. Maximum length is ${MAX_STRING_LENGTH} characters.`,
            );
        }

        // Validate date format if provided
        if (body.dueDate && body.dueDate.trim() !== '') {
            const date = new Date(body.dueDate);
            if (isNaN(date.getTime())) {
                throw new BadRequestException(
                    'Invalid date format for dueDate. Use ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)',
                );
            }
        }

        // Check for malicious content patterns
        this.validateForMaliciousContent(body);
    }

    private validateForMaliciousContent(body: any): void {
        const maliciousPatterns = [
            /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi,
            /eval\s*\(/gi,
            /expression\s*\(/gi,
        ];

        const jsonStr = JSON.stringify(body);
        
        for (const pattern of maliciousPatterns) {
            if (pattern.test(jsonStr)) {
                throw new BadRequestException(
                    'Request contains potentially malicious content',
                );
            }
        }
    }
}
