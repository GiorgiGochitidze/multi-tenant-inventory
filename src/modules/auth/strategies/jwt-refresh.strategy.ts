import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from './jwt.strategy';

// Interface extending Express Request to include cookies safely
interface RequestWithCookies extends Request {
  cookies: Record<string, string | undefined>;
}

@Injectable()
// Registered under the name 'jwt-refresh' — JwtRefreshGuard references this name
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor() {
    super({
      // Extract the token from the refresh_token cookie safely without ESLint any errors
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          const cookieReq = req as RequestWithCookies;
          return cookieReq.cookies?.refresh_token ?? null;
        },
      ]),
      // Passport will reject expired tokens automatically
      ignoreExpiration: false,
      // Uses a separate secret from access tokens — a leaked access secret won't compromise refresh tokens
      secretOrKey: process.env.JWT_REFRESH_SECRET!,
    });
  }

  // Called by Passport after signature and expiry are verified
  // Whatever is returned here gets attached to req.user
  validate(payload: JwtPayload): JwtPayload {
    if (!payload?.id) throw new UnauthorizedException('Invalid refresh token');
    return payload;
  }
}
