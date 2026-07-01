// src/auth/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface JwtPayload {
    userId: string;
    email: string;
    role: string;
}

export const CurrentUser = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): JwtPayload => {
        const request = ctx.switchToHttp().getRequest();
        return request.user; // được gán bởi JwtStrategy.validate()
    },
);