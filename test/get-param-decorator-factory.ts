import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */

export function getParamDecoratorFactory<T = unknown>(
  decorator: (...args: any[]) => ParameterDecorator,
): (data: unknown, ctx: any) => T {
  class TestDecorator {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public test(@decorator() _value: T) {
      // intentionally empty — only exists so the decorator metadata is registered
    }
  }

  const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, TestDecorator, 'test');
  // args is keyed by something like "CUSTOM_ROUTE_ARGS_METADATA:0" — grab the first (only) entry
  const key = Object.keys(args)[0];
  return args[key].factory;
}
