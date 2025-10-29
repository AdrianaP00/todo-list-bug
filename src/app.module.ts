import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksModule } from './tasks/tasks.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AuthGuard } from './auth/auth.guard';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import path from 'node:path';
import { SecurityLoggingService } from './common/services/security-logging.service';
import { DataIntegrityService } from './common/services/data-integrity.service';
import { SecurityLoggingInterceptor } from './common/interceptors/security-logging.interceptor';

@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: 'sqlite',
            database: path.resolve(__dirname, '../../db/db.sqlite'),
            autoLoadEntities: true,
        }),
        TasksModule,
        AuthModule,
        UsersModule,
    ],
    controllers: [AppController],
    providers: [
        {
            provide: APP_GUARD,
            useClass: AuthGuard,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: SecurityLoggingInterceptor,
        },
        SecurityLoggingService,
        DataIntegrityService,
    ],
})
export class AppModule {}
