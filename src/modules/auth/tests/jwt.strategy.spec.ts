import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy, JwtPayload } from '../strategies/jwt.strategy';
import { User, UserRole } from '../../user/entity/User.entity';
import {
  createMockRepository,
  MockRepository,
} from '../../../../test/mock-repository';
import { buildUser } from './auth.factory';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let mockUserRepository: MockRepository<User>;

  const mockTenantId = '7103268b-9791-46d1-9029-c9481d4a402a';

  const validPayload: JwtPayload = {
    id: '7a69aa1c-d816-4a26-b51a-c0b795432b5b',
    name: 'Test User',
    email: 'test@gmail.com',
    tenantId: mockTenantId,
    role: UserRole.STAFF,
  };

  beforeEach(async () => {
    mockUserRepository = createMockRepository<User>();

    // JwtStrategy's constructor reads process.env.JWT_SECRET when calling super().
    // It's not mocked here since it only affects Passport's own internal setup,
    // never our validate() method under test.
    process.env.JWT_SECRET = 'test-secret';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should return a trimmed user payload when the user exists and is active', async () => {
      const user = buildUser({
        id: validPayload.id,
        email: 'real@user.com',
        tenantId: mockTenantId,
        isActive: true,
      });
      mockUserRepository.findOne?.mockResolvedValue(user);

      const result = await strategy.validate(validPayload);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: validPayload.id, tenantId: mockTenantId },
        }),
      );
      expect(result).toEqual({
        id: user.id,
        name: validPayload.name,
        email: user.email,
        tenantId: user.tenantId,
        role: user.role,
      });
    });

    it('should throw UnauthorizedException if the payload is missing an id', async () => {
      const badPayload = { ...validPayload, id: '' };

      await expect(strategy.validate(badPayload)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockUserRepository.findOne).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if the payload is missing a tenantId', async () => {
      const badPayload = { ...validPayload, tenantId: '' };

      await expect(strategy.validate(badPayload)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockUserRepository.findOne).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if no matching user is found', async () => {
      mockUserRepository.findOne?.mockResolvedValue(null);

      await expect(strategy.validate(validPayload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if the user is inactive', async () => {
      mockUserRepository.findOne?.mockResolvedValue(
        buildUser({ isActive: false }),
      );

      await expect(strategy.validate(validPayload)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
