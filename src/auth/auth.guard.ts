import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
    ForbiddenException,
    Logger,
} from '@nestjs/common';
import { jwtConstants } from './constants';
import { IS_PUBLIC_KEY } from './is-public.decorator';
import { JwtService, TokenExpiredError, JsonWebTokenError } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { UsersService } from '../users/users.service';
import { JwtPayload } from './jwt-payload.interface';

@Injectable()
export class AuthGuard implements CanActivate {
    private readonly logger = new Logger(AuthGuard.name);

    constructor(
        private jwtService: JwtService,
        private reflector: Reflector,
        private usersService: UsersService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(
            IS_PUBLIC_KEY,
            [context.getHandler(), context.getClass()],
        );
        if (isPublic) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const token = this.extractTokenFromHeader(request);
        if (!token) {
            this.logger.warn('No JWT token provided');
            throw new UnauthorizedException('Authentication token required');
        }

        try {
            const payload: JwtPayload = await this.jwtService.verifyAsync(
                token,
                {
                    secret: jwtConstants.secret,
                    issuer: 'todo-app',
                    audience: 'todo-app-users',
                },
            );

            // Validate payload structure
            if (!this.isValidPayload(payload)) {
                this.logger.warn('Invalid JWT payload structure', payload);
                throw new UnauthorizedException('Invalid token payload');
            }

            // Verify user still exists and is active
            const user = await this.usersService.findOne(payload.email);
            if (!user) {
                this.logger.warn(`User not found for token: ${payload.email}`);
                throw new ForbiddenException(
                    'User account no longer exists or has been deactivated',
                );
            }

            // Additional security check: verify user ID matches
            if (user.id !== String(payload.id)) {
                this.logger.warn(
                    `User ID mismatch - Token: ${payload.id}, DB: ${user.id}`,
                );
                throw new ForbiddenException('Invalid user credentials');
            }

            // Assign user data to request
            request['user'] = {
                id: payload.id,
                email: payload.email,
                iat: payload.iat,
                exp: payload.exp,
            };
        } catch (error) {
            if (error instanceof TokenExpiredError) {
                this.logger.warn('JWT token has expired');
                throw new UnauthorizedException('Token has expired');
            } else if (error instanceof JsonWebTokenError) {
                this.logger.warn('Invalid JWT token', error.message);
                throw new UnauthorizedException('Invalid token');
            } else if (
                error instanceof UnauthorizedException ||
                error instanceof ForbiddenException
            ) {
                // Re-throw our custom exceptions
                throw error;
            } else {
                this.logger.error(
                    'Unexpected error during JWT validation',
                    error,
                );
                throw new UnauthorizedException('Authentication failed');
            }
        }
        return true;
    }

    private extractTokenFromHeader(request: any): string | undefined {
        const authHeader = request.headers?.authorization;
        if (!authHeader || typeof authHeader !== 'string') {
            return undefined;
        }

        const headerParts = authHeader.split(' ');
        // Should be exactly "Bearer <token>"
        if (headerParts.length !== 2 || headerParts[0] !== 'Bearer') {
            return undefined;
        }

        const token = headerParts[1];
        // Basic token format validation
        if (!token || token.length < 10) {
            return undefined;
        }

        return token;
    }

    private isValidPayload(payload: any): boolean {
        return (
            payload &&
            typeof payload === 'object' &&
            typeof payload.id === 'number' &&
            typeof payload.email === 'string' &&
            payload.email.includes('@') &&
            typeof payload.iat === 'number' &&
            typeof payload.exp === 'number'
        );
    }
}
