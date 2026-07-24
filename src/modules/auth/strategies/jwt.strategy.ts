import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { User, UserRole } from '../../user/entity/User.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export interface JwtPayload {
  id: string;
  name: string;
  email: string;
  tenantId: string;
  role: UserRole;
}

// Interface extending Express Request to include cookies safely
interface RequestWithCookies extends Request {
  cookies: Record<string, string | undefined>;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          const cookieReq = req as RequestWithCookies;
          return cookieReq.cookies?.access_token ?? null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET!,
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    if (!payload?.id || !payload?.tenantId)
      throw new UnauthorizedException('Invalid session payload');

    const user = await this.userRepository.findOne({
      where: { id: payload.id, tenantId: payload.tenantId },
      select: {
        id: true,
        email: true,
        tenantId: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Account disabled or no longer exists');
    }
    return {
      id: user.id,
      name: payload.name,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
    };
  }
}
