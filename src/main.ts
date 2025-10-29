import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import helmet from 'helmet';
import { RateLimitInterceptor } from './common/interceptors/rate-limit.interceptor';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Security headers with Helmet
    app.use(
        helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", 'data:', 'https:'],
                },
            },
            hsts: {
                maxAge: 31536000,
                includeSubDomains: true,
                preload: true,
            },
        }),
    );

    // Configure CORS with restrictive settings
    const corsOrigin =
        process.env['NODE_ENV'] === 'production'
            ? process.env['FRONTEND_URL']
            : true;

    app.enableCors({
        origin: corsOrigin || false,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
        maxAge: 86400, // 24 hours
    });

    // Rate limiting
    app.useGlobalInterceptors(new RateLimitInterceptor());

    // Configure global validation pipe with enhanced error handling
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true, // Remove properties that are not defined in the DTO
            forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are found
            transform: true, // Automatically transform payloads to match DTO types
            disableErrorMessages: false, // Keep detailed error messages for development
            validateCustomDecorators: true, // Validate custom decorators
            stopAtFirstError: false, // Return all validation errors, not just the first one
        }),
    );

    // Use global exception filter for consistent error handling
    app.useGlobalFilters(new GlobalExceptionFilter());

    await app.listen(process.env['PORT'] ?? 3000);
}
bootstrap();
