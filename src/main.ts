import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

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

    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
