export interface AuthUser {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export interface AuthTokenPayload {
  sub: string;
  email: string;
}
