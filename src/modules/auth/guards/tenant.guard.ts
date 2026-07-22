import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtPayload } from '../strategies/jwt.strategy';

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
  tenantId?: string;
}

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!req.user) {
      throw new UnauthorizedException('Authentication Required');
    }

    const tenantId = req.user.tenantId;

    if (!tenantId) {
      throw new BadRequestException('Tenant context missing from session');
    }

    req.tenantId = tenantId;

    return true;
  }
}
