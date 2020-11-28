import { JwtService } from '@nestjs/jwt';
import { isAccessToken } from 'src/auth/auth.logic';
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
        if (!isAccessToken(decoded)) return {};
        return {
          user: {
            _id: decoded.payload.sub,
            username: decoded.payload.username,
          },
        };
      });
  };
