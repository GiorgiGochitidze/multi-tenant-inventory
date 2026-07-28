import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import {
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { Response as ExpressResponse } from 'express';
import { AuthService } from '../auth.service';
import { User, UserRole } from '../../user/entity/User.entity';
import { Tenant } from '../../tenant/entity/Tenant.entity';
import {
  createMockRepository,
  MockRepository,
} from '../../../../test/mock-repository';
import { buildUser } from './auth.factory';

/* eslint-disable @typescript-eslint/unbound-method */
jest.mock('bcrypt');
import * as bcrypt from 'bcrypt';
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let mockUserRepository: MockRepository<User>;
  let mockTenantRepository: MockRepository<Tenant>;
  let mockManager: { create: jest.Mock; save: jest.Mock };
  let mockDataSource: { transaction: jest.Mock };
  let mockJwtService: { signAsync: jest.Mock };
  let mockResponse: ExpressResponse;

  const mockTenantId = '7103268b-9791-46d1-9029-c9481d4a402a';

  beforeEach(async () => {
    mockUserRepository = createMockRepository<User>();
    mockTenantRepository = createMockRepository<Tenant>();

    mockManager = {
      create: jest.fn(),
      save: jest.fn(),
    };

    mockDataSource = {
      transaction: jest
        .fn()
        .mockImplementation(
          async (callback: (manager: typeof mockManager) => Promise<unknown>) =>
            callback(mockManager),
        ),
    };

    mockJwtService = {
      signAsync: jest.fn(),
    };

    mockResponse = {
      cookie: jest.fn(),
    } as unknown as ExpressResponse;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: getRepositoryToken(Tenant), useValue: mockTenantRepository },
        { provide: JwtService, useValue: mockJwtService },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    mockJwtService.signAsync.mockResolvedValue('signed.jwt.token');
    mockedBcrypt.hash.mockResolvedValue('hashed-value' as never);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signUp', () => {
    const signUpDto = {
      email: 'new@user.com',
      password: 'plainPassword123',
      name: 'New User',
      tenantName: 'My Shop',
    };

    it('should create a tenant and user, set cookies, and return the new user', async () => {
      const createdUser = buildUser({
        email: signUpDto.email,
        name: signUpDto.name,
        tenantId: mockTenantId,
        role: UserRole.ADMIN,
      });
      const createdTenant = {
        id: mockTenantId,
        name: 'My Shop',
        slug: 'my-shop-shop',
      };

      mockUserRepository.findOne?.mockResolvedValue(null);
      mockTenantRepository.findOne?.mockResolvedValue(null);
      mockManager.create
        .mockReturnValueOnce(createdTenant)
        .mockReturnValueOnce(createdUser);
      mockManager.save
        .mockResolvedValueOnce(createdTenant)
        .mockResolvedValueOnce(createdUser);

      const result = await service.signUp(signUpDto, mockResponse);

      expect(mockTenantRepository.findOne).toHaveBeenCalledWith({
        where: { slug: 'my-shop-shop' },
      });
      expect(mockDataSource.transaction).toHaveBeenCalled();
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'access_token',
        expect.any(String),
        expect.any(Object),
      );
      expect(result).toEqual({
        message: 'Successfully Signed Up',
        id: createdUser.id,
        name: createdUser.name,
        email: createdUser.email,
        tenantId: createdUser.tenantId,
        role: createdUser.role,
      });
    });

    it('should throw ConflictException if the email is already taken', async () => {
      mockUserRepository.findOne?.mockResolvedValue(buildUser());

      await expect(service.signUp(signUpDto, mockResponse)).rejects.toThrow(
        ConflictException,
      );
      expect(mockDataSource.transaction).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if the tenant slug is already taken', async () => {
      mockUserRepository.findOne?.mockResolvedValue(null);
      mockTenantRepository.findOne?.mockResolvedValue({
        id: 'existing-tenant',
        slug: 'my-shop-shop',
      });

      await expect(service.signUp(signUpDto, mockResponse)).rejects.toThrow(
        ConflictException,
      );
      expect(mockDataSource.transaction).not.toHaveBeenCalled();
    });

    it('should wrap unexpected transaction errors in InternalServerErrorException', async () => {
      mockUserRepository.findOne?.mockResolvedValue(null);
      mockTenantRepository.findOne?.mockResolvedValue(null);
      mockDataSource.transaction.mockRejectedValue(new Error('DB is on fire'));

      await expect(service.signUp(signUpDto, mockResponse)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('signIn', () => {
    const signInDto = { email: 'test@gmail.com', password: 'plainPassword123' };

    it('should sign in successfully and set cookies', async () => {
      const user = buildUser();
      mockUserRepository.findOneBy?.mockResolvedValue(user);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      const result = await service.signIn(signInDto, mockResponse);

      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        signInDto.password,
        user.password,
      );
      expect(mockResponse.cookie).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        message: 'Successfully Signed In',
        id: user.id,
        name: user.name,
        email: user.email,
        tenantId: user.tenantId,
        role: user.role,
      });
    });

    it('should throw UnauthorizedException if the user does not exist', async () => {
      mockUserRepository.findOneBy?.mockResolvedValue(null);

      await expect(service.signIn(signInDto, mockResponse)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockedBcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if the account is inactive', async () => {
      mockUserRepository.findOneBy?.mockResolvedValue(
        buildUser({ isActive: false }),
      );

      await expect(service.signIn(signInDto, mockResponse)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockedBcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if the password is wrong', async () => {
      mockUserRepository.findOneBy?.mockResolvedValue(buildUser());
      mockedBcrypt.compare.mockResolvedValue(false as never);

      await expect(service.signIn(signInDto, mockResponse)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refreshTokens', () => {
    const userId = 'some-user-id';
    const rawRefreshToken = 'raw-refresh-token';

    it('should rotate tokens successfully when the refresh token is valid', async () => {
      const user = buildUser({ refreshToken: 'hashed-old-token' });
      mockUserRepository.findOneBy?.mockResolvedValue(user);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      const result = await service.refreshTokens(
        userId,
        rawRefreshToken,
        mockResponse,
      );

      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        rawRefreshToken,
        user.refreshToken,
      );
      expect(mockResponse.cookie).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ message: 'Tokens rotated successfully' });
    });

    it('should throw UnauthorizedException if user has no stored refresh token', async () => {
      mockUserRepository.findOneBy?.mockResolvedValue(
        buildUser({ refreshToken: null }),
      );

      await expect(
        service.refreshTokens(userId, rawRefreshToken, mockResponse),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should wipe the refresh token and throw ForbiddenException if the token is invalid', async () => {
      const user = buildUser({ refreshToken: 'hashed-old-token' });
      mockUserRepository.findOneBy?.mockResolvedValue(user);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      await expect(
        service.refreshTokens(userId, rawRefreshToken, mockResponse),
      ).rejects.toThrow(ForbiddenException);

      expect(mockUserRepository.update).toHaveBeenCalledWith(userId, {
        refreshToken: null,
      });
    });
  });
});
