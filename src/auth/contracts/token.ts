import jwt from 'jsonwebtoken';
import { TOKEN_TYPES } from 'src/auth/contracts/enums';

export interface Token {
  header: { alg: jwt.Algorithm; typ: TOKEN_TYPES };
  payload: any;
  signature: string;
}

export interface RefreshToken extends Token {
  header: { alg: jwt.Algorithm; typ: TOKEN_TYPES.REFRESH };
  payload: { sub: string; iat: number };
}

export interface AccessToken extends Token {
  header: { alg: jwt.Algorithm; typ: TOKEN_TYPES.ACCESS };
  payload: { sub: string; username: string; iat: number };
}
