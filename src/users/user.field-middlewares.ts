import { FieldMiddleware, MiddlewareContext, NextFn } from '@nestjs/graphql';
import { Token } from 'src/auth/contracts';
import { isAccessToken } from 'src/auth/auth.logic';
import { ForbiddenException } from '@nestjs/common';

export const sentitiveData: FieldMiddleware = async (
  ctx: MiddlewareContext,
  next: NextFn,
) => {
  const context: any = ctx.context;
  const token: Token = context.req.token;
  if (!isAccessToken(token)) throw new ForbiddenException();
  if (ctx.source._id !== token.payload.sub) throw new ForbiddenException();
  return next();
};
