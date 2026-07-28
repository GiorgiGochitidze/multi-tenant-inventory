import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtRefreshStrategy } from '../strategies/jwt-refresh.strategy';
import { JwtPayload } from '../strategies/jwt.strategy';
import { UserRole } from '../../user/entity/User.entity';

describe('JwtRefreshStrategy', () => {
  let strategy: JwtRefreshStrategy;

  beforeEach(async () => {
    // Constructor reads process.env.JWT_REFRESH_SECRET via super(), same as
    // JwtStrategy — only affects Passport's own setup, not validate() itself.
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtRefreshStrategy],
    }).compile();

    strategy = module.get<JwtRefreshStrategy>(JwtRefreshStrategy);
  });

  describe('validate', () => {
    it('should return the payload unchanged when it has an id', () => {
      const payload: JwtPayload = {
        id: '7a69aa1c-d816-4a26-b51a-c0b795432b5b',
        name: 'Test User',
        email: 'test@gmail.com',
        tenantId: '7103268b-9791-46d1-9029-c9481d4a402a',
        role: UserRole.STAFF,
      };

      const result = strategy.validate(payload);

      expect(result).toEqual(payload);
    });

    it('should throw UnauthorizedException if the payload has no id', () => {
      const badPayload = { id: '' } as JwtPayload;

      expect(() => strategy.validate(badPayload)).toThrow(
        UnauthorizedException,
      );
    });
  });
});
