import jwt from "jsonwebtoken";
import { config } from "../config";
import { UserRole } from "@maasuraksha/shared";

export interface TokenPayload {
  userId: string;
  role: UserRole;
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as string,
  } as jwt.SignOptions);
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwtSecret) as TokenPayload;
}