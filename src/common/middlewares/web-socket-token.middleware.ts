import { JwtService } from '@nestjs/jwt';
import { Token } from 'src/auth/contracts';

export const WebSocketTokenMiddleware = (jwtService: JwtService) =>
  function(connectionParams: { authorization?: string }) {
    const authBearer = connectionParams.authorization;
    if (!authBearer) return {};
    const [bearer, token] = authBearer.split(' ');
    if (bearer !== 'Bearer' || !token) return {};
    return jwtService
      .verifyAsync<Token>(token, {
        complete: true,
      })
      .then(decoded => {
        return {
          token: decoded,
        };
      })
      .catch(() => ({}));
  };
