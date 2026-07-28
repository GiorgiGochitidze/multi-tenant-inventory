import { UnauthorizedException } from '@nestjs/common';
import { CurrentUser } from '../decorator/current-user.decorator';
import { getParamDecoratorFactory } from '../../../../test/get-param-decorator-factory';

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return */

describe('CurrentUser decorator', () => {
  const factory = getParamDecoratorFactory(CurrentUser);

  const createMockContext = (req: Record<string, unknown>) =>
    ({
      switchToHttp: () => ({
        getRequest: () => req,
      }),
    }) as any;

  it('should return req.user when present', () => {
    const fakeUser = { id: 'user-id-1', email: 'test@gmail.com' };
    const ctx = createMockContext({ user: fakeUser });

    const result = factory(null, ctx);

    expect(result).toEqual(fakeUser);
  });

  it('should throw UnauthorizedException when req.user is absent', () => {
    const ctx = createMockContext({});

    expect(() => factory(null, ctx)).toThrow(UnauthorizedException);
  });
});
