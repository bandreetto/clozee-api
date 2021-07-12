import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { TOKEN_TYPES_KEY } from '../decorators';
import { TOKEN_TYPES } from '../../auth/contracts/enums';
import { Token } from '../../auth/contracts';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const ctx = GqlExecutionContext.create(context);
    /**
     * The connection here is to authenticate WebSocket connections
     */
    const { req, connection } = ctx.getContext();

    const token: Token = req?.token || connection?.context?.token;
    if (!token) throw new UnauthorizedException();

    const tokenTypes: TOKEN_TYPES[] = this.reflector.get(TOKEN_TYPES_KEY, context.getHandler());
    if (!tokenTypes) return token.header.typ === TOKEN_TYPES.ACCESS;
    return tokenTypes.includes(token.header.typ);
  }
}
