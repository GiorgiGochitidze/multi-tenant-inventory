import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthenticatedRequest } from '../guards/tenant.guard';

export const CurrentTenant = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();

    const tenantId = request.tenantId ?? request.user?.tenantId;

    if (!tenantId) {
      throw new UnauthorizedException('Tenant context not found');
    }

    return tenantId;
  },
);
