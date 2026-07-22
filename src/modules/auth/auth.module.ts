import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entity/User.entity';
import { Tenant } from '../tenant/entity/Tenant.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Tenant]),
    PassportModule,
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy],
  exports: [JwtModule],
})
export class AuthModule {}
