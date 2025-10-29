import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { UsersModule } from '../users/users.module';
import { AuthGuard } from './auth.guard';

@Module({
    imports: [
        JwtModule.register({
            global: true,
            secret: jwtConstants.secret,
            signOptions: {
                expiresIn: process.env.JWT_EXPIRES_IN || '1h',
                issuer: 'todo-app',
                audience: 'todo-app-users',
            },
            verifyOptions: {
                issuer: 'todo-app',
                audience: 'todo-app-users',
            },
        }),
        UsersModule,
    ],
    controllers: [AuthController],
    providers: [AuthService, AuthGuard],
    exports: [AuthGuard],
})
export class AuthModule {}
