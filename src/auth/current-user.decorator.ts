import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface UserFromToken {
    id: string;
    email: string;
    iat: number;
    exp: number;
}

export const CurrentUser = createParamDecorator(
    (_data: unknown, ctx: ExecutionContext): UserFromToken => {
        const request = ctx.switchToHttp().getRequest();
        return request.user;
    },
);
