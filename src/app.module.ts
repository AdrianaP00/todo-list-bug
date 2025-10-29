import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksModule } from './tasks/tasks.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AuthGuard } from './auth/auth.guard';
import { APP_GUARD } from '@nestjs/core';
import path from 'node:path';

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
    ],
})
export class AppModule {}
