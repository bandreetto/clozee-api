import { AccessToken, RefreshToken, Token } from './contracts/domain/token';

export function isRefreshToken(token: Token): token is RefreshToken {
  return token.header.typ === 'refresh';
}

export function isAccessToken(token: Token): token is AccessToken {
  return token.header.typ === 'access';
}
