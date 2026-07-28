import { UnauthorizedException } from '@nestjs/common';
import { CurrentTenant } from '../decorator/current-tenant.decorator';
import { getParamDecoratorFactory } from '../../../../test/get-param-decorator-factory';

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return */

describe('CurrentTenant decorator', () => {
  const factory = getParamDecoratorFactory<string>(CurrentTenant);

  const createMockContext = (req: Record<string, unknown>) =>
    ({
      switchToHttp: () => ({
        getRequest: () => req,
      }),
    }) as any;

  it('should return req.tenantId when present', () => {
    const ctx = createMockContext({ tenantId: 'tenant-from-req' });

    const result = factory(null, ctx);

    expect(result).toBe('tenant-from-req');
  });

  it('should fall back to req.user.tenantId when req.tenantId is absent', () => {
    const ctx = createMockContext({
      user: { tenantId: 'tenant-from-user' },
    });

    const result = factory(null, ctx);

    expect(result).toBe('tenant-from-user');
  });

  it('should prefer req.tenantId over req.user.tenantId when both are present', () => {
    const ctx = createMockContext({
      tenantId: 'tenant-from-req',
      user: { tenantId: 'tenant-from-user' },
    });

    const result = factory(null, ctx);

    expect(result).toBe('tenant-from-req');
  });

  it('should throw UnauthorizedException when neither is present', () => {
    const ctx = createMockContext({});

    expect(() => factory(null, ctx)).toThrow(UnauthorizedException);
  });
});
