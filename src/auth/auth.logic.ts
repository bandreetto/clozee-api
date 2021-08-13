import { JwtService } from '@nestjs/jwt';
import { User } from 'src/users/contracts';
import { AccessToken, RefreshToken, Token } from './contracts';
import { TOKEN_TYPES } from './contracts/enums';

export function isRefreshToken(token: Token): token is RefreshToken {
  return token?.header?.typ === TOKEN_TYPES.REFRESH;
}

export function isAccessToken(token: Token): token is AccessToken {
  return token?.header?.typ === TOKEN_TYPES.ACCESS;
}

export function isPreSignToken(token: Token): token is AccessToken {
  return token?.header?.typ === TOKEN_TYPES.PRE_SIGN;
}

export function createAccessToken(user: User, accessTokenExpiration: string, jwtService: JwtService): string {
  return jwtService.sign(
    { username: user.username },
    {
      header: {
        typ: TOKEN_TYPES.ACCESS,
      },
      expiresIn: accessTokenExpiration,
      subject: user._id,
    },
  );
}

export function createRefreshToken(userId: string, refreshTokenExpiration: string, jwtService: JwtService): string {
  return jwtService.sign(
    {},
    {
      header: { typ: TOKEN_TYPES.REFRESH },
      expiresIn: refreshTokenExpiration,
      subject: userId,
    },
  );
}

export function createPreSignToken(userId: string, jwtService: JwtService): string {
  return jwtService.sign({}, { header: { typ: TOKEN_TYPES.PRE_SIGN }, subject: userId });
}
