import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Token } from '../auth/contracts';
import { TOKEN_TYPES } from '../auth/contracts/enums';
import { TokenUser } from './types';
import { isAccessToken, isPreSignToken } from '../auth/auth.logic';

export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext): TokenUser => {
  const ctx = GqlExecutionContext.create(context);
  const { req, connection } = ctx.getContext();
  const token: Token = req?.token || connection?.context?.token;
  if (!isAccessToken(token) && !isPreSignToken(token)) return null;
  return {
    _id: token.payload.sub,
    username: token.payload.username,
  };
});

export const CurrentToken = createParamDecorator((_data: unknown, context: ExecutionContext): Token => {
  const ctx = GqlExecutionContext.create(context);
  const { req, connection } = ctx.getContext();
  return req?.token || connection?.context?.token;
});

export const TOKEN_TYPES_KEY = 'TOKEN_TYPES_KEY';
export const TokenTypes = (...types: TOKEN_TYPES[]) => SetMetadata(TOKEN_TYPES_KEY, types);
