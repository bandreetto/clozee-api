import { RefreshToken, Token } from './contracts/domain/token';

export function isRefreshToken(token: Token): token is RefreshToken {
  return token.header.typ === 'refresh';
}
