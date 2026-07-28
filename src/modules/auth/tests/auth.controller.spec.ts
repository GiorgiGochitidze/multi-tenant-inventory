import { Test, TestingModule } from '@nestjs/testing';
import { AuthController, UserAuthResponse } from '../auth.controller';
import { AuthService } from '../auth.service';
import { UserRole } from '../../user/entity/User.entity';
import { Response as ExpressResponse } from 'express';
import { JwtPayload } from '../strategies/jwt.strategy';

/* eslint-disable @typescript-eslint/unbound-method */

describe('AuthController', () => {
  let controller: AuthController;
  let mockAuthService: Partial<Record<keyof AuthService, jest.Mock>>;
  let mockResponse: ExpressResponse;

  const mockAuthResponse: UserAuthResponse = {
    message: 'Successfully Signed Up',
    id: 'user-id-1',
    name: 'Test User',
    email: 'test@gmail.com',
    tenantId: 'tenant-id-1',
    role: UserRole.ADMIN,
  };

  beforeEach(async () => {
    mockAuthService = {
      signUp: jest.fn(),
      signIn: jest.fn(),
      refreshTokens: jest.fn(),
    };

    mockResponse = {
      cookie: jest.fn(),
    } as unknown as ExpressResponse;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signUp', () => {
    it('should call authService.signUp with the dto and response, and return its result', async () => {
      const dto = {
        email: 'new@user.com',
        password: 'plainPassword123',
        name: 'New User',
        tenantName: 'My Shop',
      };
      mockAuthService.signUp?.mockResolvedValue(mockAuthResponse);

      const result = await controller.signUp(dto, mockResponse);

      expect(mockAuthService.signUp).toHaveBeenCalledWith(dto, mockResponse);
      expect(result).toEqual(mockAuthResponse);
    });
  });

  describe('signIn', () => {
    it('should call authService.signIn with the dto and response, and return its result', async () => {
      const dto = { email: 'test@gmail.com', password: 'plainPassword123' };
      mockAuthService.signIn?.mockResolvedValue(mockAuthResponse);

      const result = await controller.signIn(dto, mockResponse);

      expect(mockAuthService.signIn).toHaveBeenCalledWith(dto, mockResponse);
      expect(result).toEqual(mockAuthResponse);
    });
  });

  describe('getMe', () => {
    it('should return req.user as-is, without calling the service', () => {
      const fakeUser: JwtPayload = {
        id: 'user-id-1',
        email: 'test@gmail.com',
      } as JwtPayload;

      const result = controller.getMe({ user: fakeUser });

      expect(result).toEqual(fakeUser);
      expect(mockAuthService.signUp).not.toHaveBeenCalled();
      expect(mockAuthService.signIn).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('should extract user id and refresh_token cookie, then call authService.refreshTokens', async () => {
      const fakeReq = {
        user: { id: 'user-id-1', email: 'test@gmail.com' },
        cookies: { refresh_token: 'raw-refresh-token-value' },
      } as unknown as Parameters<AuthController['refresh']>[0];
      const refreshResult = { message: 'Tokens rotated successfully' };
      mockAuthService.refreshTokens?.mockResolvedValue(refreshResult);

      const result = await controller.refresh(fakeReq, mockResponse);

      expect(mockAuthService.refreshTokens).toHaveBeenCalledWith(
        'user-id-1',
        'raw-refresh-token-value',
        mockResponse,
      );
      expect(result).toEqual(refreshResult);
    });

    it('should pass undefined as the refresh token if the cookie is missing', async () => {
      const fakeReq = {
        user: { id: 'user-id-1', email: 'test@gmail.com' },
        cookies: {},
      } as unknown as Parameters<AuthController['refresh']>[0];
      mockAuthService.refreshTokens?.mockResolvedValue({
        message: 'Tokens rotated successfully',
      });

      await controller.refresh(fakeReq, mockResponse);

      expect(mockAuthService.refreshTokens).toHaveBeenCalledWith(
        'user-id-1',
        undefined,
        mockResponse,
      );
    });
  });

  describe('signOut', () => {
    it('should clear both auth cookies and return a success response', () => {
      const result = controller.signOut(mockResponse);

      expect(mockResponse.cookie).toHaveBeenCalledTimes(2);
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'access_token',
        '',
        expect.objectContaining({ httpOnly: true, expires: new Date(0) }),
      );
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refresh_token',
        '',
        expect.objectContaining({ httpOnly: true, expires: new Date(0) }),
      );
      expect(result).toEqual({ success: true });
    });
  });
});
