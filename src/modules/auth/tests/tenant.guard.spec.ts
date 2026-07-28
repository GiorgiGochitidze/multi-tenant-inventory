import {
  ExecutionContext,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { TenantGuard, AuthenticatedRequest } from '../guards/tenant.guard';
import { UserRole } from '../../user/entity/User.entity';

describe('TenantGuard', () => {
  let guard: TenantGuard;

  const createMockContext = (
    req: Partial<AuthenticatedRequest>,
  ): ExecutionContext =>
    ({
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(req),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    guard = new TenantGuard();
  });

  it('should allow access and attach tenantId when user has a tenantId', () => {
    const req: Partial<AuthenticatedRequest> = {
      user: {
        id: 'user-id-1',
        name: 'Test User',
        email: 'test@gmail.com',
        tenantId: '7103268b-9791-46d1-9029-c9481d4a402a',
        role: UserRole.STAFF,
      },
    };
    const context = createMockContext(req);

    const result = guard.canActivate(context);

    expect(result).toBe(true);
    expect(req.tenantId).toBe('7103268b-9791-46d1-9029-c9481d4a402a');
  });

  it('should throw UnauthorizedException if there is no user on the request', () => {
    const context = createMockContext({});

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should throw BadRequestException if the user has no tenantId', () => {
    const req: Partial<AuthenticatedRequest> = {
      user: {
        id: 'user-id-1',
        name: 'Test User',
        email: 'test@gmail.com',
        tenantId: '',
        role: UserRole.STAFF,
      },
    };
    const context = createMockContext(req);

    expect(() => guard.canActivate(context)).toThrow(BadRequestException);
  });
});
