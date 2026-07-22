import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateAuthDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Response as ExpressResponse } from 'express';
import { UserAuthResponse } from './auth.controller';
import { User, UserRole } from '../user/entity/User.entity';
import { Tenant } from '../tenant/entity/Tenant.entity';

interface TokenPayload {
  id: string;
  name: string;
  email: string;
  tenantId: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
  ) {}

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    return String(error);
  }

  async signUp(
    createAuthDto: CreateAuthDto,
    res: ExpressResponse,
  ): Promise<UserAuthResponse> {
    const { email, password, name, tenantName } = createAuthDto;

    const formattedSlug =
      tenantName.trim().toLowerCase().replace(/\s+/g, '-') + '-shop';

    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    const existingTenant = await this.tenantRepository.findOne({
      where: { slug: formattedSlug },
    });
    if (existingTenant) {
      throw new ConflictException('A tenant with this name already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const newUser = await this.dataSource.transaction(async (manager) => {
        const tenant = manager.create(Tenant, {
          name: tenantName,
          slug: formattedSlug,
        });
        const savedTenant = await manager.save(tenant);

        const user = manager.create(User, {
          name,
          email,
          password: hashedPassword,
          role: UserRole.ADMIN,
          tenantId: savedTenant.id,
        });
        return await manager.save(user);
      });

      await this.setTokenCookies(res, {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        tenantId: newUser.tenantId,
      });

      return {
        message: 'Successfully Signed Up',
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        tenantId: newUser.tenantId,
      };
    } catch (error: unknown) {
      if (error instanceof Error && 'status' in error) throw error;
      throw new InternalServerErrorException(
        this.getErrorMessage(error) || 'Unexpected error during registration',
      );
    }
  }

  async signIn(
    signInDto: SignInDto,
    res: ExpressResponse,
  ): Promise<UserAuthResponse> {
    const { email, password } = signInDto;

    try {
      const user = await this.userRepository.findOneBy({ email });
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      await this.setTokenCookies(res, {
        id: user.id,
        name: user.name,
        email: user.email,
        tenantId: user.tenantId,
      });

      return {
        message: 'Successfully Signed In',
        id: user.id,
        name: user.name,
        email: user.email,
        tenantId: user.tenantId,
      };
    } catch (error: unknown) {
      if (error instanceof Error && 'status' in error) throw error;
      throw new InternalServerErrorException(
        this.getErrorMessage(error) || 'Unexpected error during login',
      );
    }
  }

  async refreshTokens(
    userId: string,
    rawRefreshToken: string,
    res: ExpressResponse,
  ): Promise<{ message: string }> {
    try {
      const user = await this.userRepository.findOneBy({ id: userId });
      if (!user || !user.refreshToken) {
        throw new UnauthorizedException('Access Denied: Session closed');
      }

      const isTokenValid = await bcrypt.compare(
        rawRefreshToken,
        user.refreshToken,
      );
      if (!isTokenValid) {
        await this.userRepository.update(userId, { refreshToken: null });
        throw new ForbiddenException('Compromised session detected');
      }

      await this.setTokenCookies(res, {
        id: user.id,
        name: user.name,
        email: user.email,
        tenantId: user.tenantId,
      });

      return { message: 'Tokens rotated successfully' };
    } catch (error: unknown) {
      if (error instanceof Error && 'status' in error) throw error;
      throw new UnauthorizedException('Session rotation failed');
    }
  }

  private async setTokenCookies(
    res: ExpressResponse,
    user: TokenPayload,
  ): Promise<void> {
    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      tenantId: user.tenantId,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: '7d',
      }),
    ]);

    const hashedToken = await bcrypt.hash(refreshToken, 10);

    await this.userRepository.update(user.id, { refreshToken: hashedToken });

    const isProd = process.env.NODE_ENV === 'production';

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
  }
}
