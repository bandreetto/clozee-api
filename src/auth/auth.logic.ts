import { AccessToken, RefreshToken, Token } from './contracts';
import { TOKEN_TYPES } from './contracts/enums';

export function isRefreshToken(token: Token): token is RefreshToken {
  return token.header.typ === TOKEN_TYPES.REFRESH;
}

export function isAccessToken(token: Token): token is AccessToken {
  return token.header.typ === TOKEN_TYPES.ACCESS;
}

export function isPreSignToken(token: Token): token is AccessToken {
  return token.header.typ === TOKEN_TYPES.PRE_SIGN;
}
