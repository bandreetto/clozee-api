import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const ctx = GqlExecutionContext.create(context);
    /**
     * The connection here is to authorize WebSocket connections
     */
    const { req, connection } = ctx.getContext();
    if (!req?.user && !connection?.context?.user)
      throw new UnauthorizedException();
    return true;
  }
}
