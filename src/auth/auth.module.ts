import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { UsersModule } from '../users/users.module';
import { AuthGuard } from './auth.guard';
import { LoginAttemptService } from '../common/services/login-attempt.service';
import { ValidationService } from '../common/services/validation.service';

@Module({
    imports: [
        JwtModule.register({
            global: true,
            secret: jwtConstants.secret,
            signOptions: {
                expiresIn: jwtConstants.expiresIn,
                issuer: jwtConstants.issuer,
                audience: jwtConstants.audience,
            },
            verifyOptions: {
                issuer: jwtConstants.issuer,
                audience: jwtConstants.audience,
            },
        }),
        UsersModule,
    ],
    controllers: [AuthController],
    providers: [AuthService, AuthGuard, LoginAttemptService, ValidationService],
    exports: [AuthGuard, LoginAttemptService, ValidationService],
})
export class AuthModule {}
