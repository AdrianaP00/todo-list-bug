import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status: number;
        let message: string | object;
        let error: string;

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const errorResponse = exception.getResponse();
            
            if (typeof errorResponse === 'string') {
                message = errorResponse;
                error = exception.name;
            } else if (
                typeof errorResponse === 'object' &&
                errorResponse !== null
            ) {
                const errorObj = errorResponse as any;
                message = errorObj.message || errorObj;
                error = errorObj.error || exception.name;
            } else {
                message = 'Internal server error';
                error = exception.name;
            }
        } else if (exception instanceof QueryFailedError) {
            // Handle database-related errors
            status = HttpStatus.BAD_REQUEST;
            
            // Check for specific database errors
            const dbError = exception as any;
            if (dbError.code === '23505') {
                // Unique constraint violation
                message = 'Resource already exists';
                error = 'Duplicate Entry';
            } else if (dbError.code === '23503') {
                // Foreign key constraint violation
                message = 'Referenced resource does not exist';
                error = 'Invalid Reference';
            } else if (dbError.code === '22001') {
                // String data right truncation
                message = 'Data too long for field';
                error = 'Data Too Long';
            } else {
                message = 'Database operation failed';
                error = 'Database Error';
            }
            
            this.logger.error('Database error:', {
                code: dbError.code,
                message: dbError.message,
                detail: dbError.detail,
                constraint: dbError.constraint,
            });
        } else {
            // Handle unexpected errors
            status = HttpStatus.INTERNAL_SERVER_ERROR;
            message = 'Internal server error';
            error = 'Internal Server Error';
            
            this.logger.error('Unexpected error:', {
                error: exception,
                stack: exception instanceof Error ? exception.stack : undefined,
                request: {
                    method: request.method,
                    url: request.url,
                    user: (request as any).user?.email,
                },
            });
        }

        // Log the error for debugging (except for expected client errors)
        if (status >= 500) {
            this.logger.error(`HTTP ${status} Error`, {
                method: request.method,
                url: request.url,
                user: (request as any).user?.email,
                message,
                error: exception,
            });
        } else if (status === 403 || status === 401) {
            this.logger.warn(`Access denied - ${status}`, {
                method: request.method,
                url: request.url,
                user: (request as any).user?.email,
                message,
            });
        }

        const errorResponse = {
            statusCode: status,
            error,
            message,
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
        };

        response.status(status).json(errorResponse);
    }
}
