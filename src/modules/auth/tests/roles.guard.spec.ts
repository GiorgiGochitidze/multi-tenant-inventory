import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../guards/roles.guard';
import { UserRole } from '../../user/entity/User.entity';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let mockReflector: { getAllAndOverride: jest.Mock };

  const createMockContext = (user?: { role?: UserRole }): ExecutionContext =>
    ({
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    mockReflector = { getAllAndOverride: jest.fn() };
    guard = new RolesGuard(mockReflector as unknown as Reflector);
  });

  it('should allow access when no @Roles() decorator is present', () => {
    mockReflector.getAllAndOverride.mockReturnValue(undefined);
    const context = createMockContext({ role: UserRole.STAFF });

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should allow access when the required roles array is empty', () => {
    mockReflector.getAllAndOverride.mockReturnValue([]);
    const context = createMockContext({ role: UserRole.STAFF });

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should allow access when the user has one of the required roles', () => {
    mockReflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
    const context = createMockContext({ role: UserRole.ADMIN });

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should throw ForbiddenException when the user role is not in the required roles', () => {
    mockReflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
    const context = createMockContext({ role: UserRole.STAFF });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException when there is no user on the request', () => {
    mockReflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
    const context = createMockContext(undefined);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
