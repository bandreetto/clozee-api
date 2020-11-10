import { Injectable, NestMiddleware } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { isAccessToken } from '../../auth/auth.logic';
import { Token } from '../../auth/contracts';

@Injectable()
export class TokenMiddleware implements NestMiddleware {
  constructor(private jwtService: JwtService) {}

  use(req: any, _res: any, next: () => void) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return next();
    const [bearer, token] = authHeader.split(' ');
    if (bearer !== 'Bearer' || !token) return next();
    return this.jwtService
      .verifyAsync<Token>(token, {
        complete: true,
      })
      .then(decoded => {
        if (!isAccessToken(decoded)) return next();
        req.user = {
          _id: decoded.payload.sub,
          username: decoded.payload.username,
        };
        return next();
      })
      .catch(() => next());
  }
}
