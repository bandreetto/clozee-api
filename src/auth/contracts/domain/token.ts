import jwt from 'jsonwebtoken';

export interface Token {
  header: { alg: jwt.Algorithm; typ: 'access' | 'refresh' };
  payload: any;
  signature: string;
}

export interface RefreshToken extends Token {
  header: { alg: jwt.Algorithm; typ: 'refresh' };
  payload: { sub: string; iat: number };
}

export interface AccessToken extends Token {
  header: { alg: jwt.Algorithm; typ: 'access' };
  payload: { sub: string; username: string; iat: number };
}
