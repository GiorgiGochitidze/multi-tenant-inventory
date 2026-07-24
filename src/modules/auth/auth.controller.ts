import {
  Controller,
  Post,
  Body,
  Res,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/sign-up.dto';
import type { Response as ExpressResponse } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtPayload } from './strategies/jwt.strategy';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import type { Request as ExpressRequest } from 'express';
import { SignInDto } from './dto/sign-in.dto';
import { UserRole } from '../user/entity/User.entity';
import { ApiTags } from '@nestjs/swagger';

interface RequestWithCookies extends ExpressRequest {
  cookies: Record<string, string | undefined>;
}

export interface UserAuthResponse {
  message: string;
  id: string;
  name: string;
  email: string;
  tenantId: string;
  role: UserRole;
}

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signUp')
  async signUp(
    @Body() createAuthDto: CreateAuthDto,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    return this.authService.signUp(createAuthDto, res);
  }

  @Post('signIn')
  @HttpCode(HttpStatus.OK)
  async signIn(
    @Body() signInDto: SignInDto,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    return this.authService.signIn(signInDto, res);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Req() req: { user: JwtPayload }) {
    return req.user;
  }

  @Get('refresh')
  @UseGuards(JwtRefreshGuard)
  async refresh(
    @Req() req: RequestWithCookies,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    const userPayload = req.user as unknown as { id: string; email: string };
    const rawRefreshToken = req.cookies?.['refresh_token'] as string;

    return await this.authService.refreshTokens(
      userPayload.id,
      rawRefreshToken,
      res,
    );
  }

  @Post('signout')
  signOut(@Res({ passthrough: true }) res: ExpressResponse) {
    res.cookie('access_token', '', {
      httpOnly: true,
      expires: new Date(0),
      path: '/',
    });
    res.cookie('refresh_token', '', {
      httpOnly: true,
      expires: new Date(0),
      path: '/',
    });
    return { success: true };
  }
}
