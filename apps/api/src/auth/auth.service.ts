import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { compare, hash } from "bcryptjs";
import { Response } from "express";
import { AuthUserDto } from "@ripple/shared-types";
import { AppConfig } from "../config/configuration";
import { User } from "../users/user.entity";
import { UsersService } from "../users/users.service";
import { AuthTokenPayload } from "./auth.types";

const PASSWORD_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  async register(email: string, password: string, name: string, response: Response): Promise<AuthUserDto> {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await this.usersService.findByEmail(normalizedEmail);
    if (existing) {
      throw new ConflictException("An account with this email already exists");
    }

    const passwordHash = await hash(password, PASSWORD_ROUNDS);
    const user = await this.usersService.create(normalizedEmail, passwordHash, name.trim());
    this.setAuthCookie(response, user);
    return this.toDto(user);
  }

  async login(email: string, password: string, response: Response): Promise<AuthUserDto> {
    const user = await this.usersService.findByEmail(email.trim().toLowerCase());
    if (!user) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const matches = await compare(password, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedException("Invalid email or password");
    }

    this.setAuthCookie(response, user);
    return this.toDto(user);
  }

  logout(response: Response) {
    response.clearCookie(this.config.get("authCookieName", { infer: true }), {
      httpOnly: true,
      sameSite: "lax",
      secure: this.config.get("nodeEnv", { infer: true }) === "production",
      path: "/",
    });
  }

  toDto(user: Pick<User, "id" | "email" | "name" | "createdAt">): AuthUserDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt.toISOString(),
    };
  }

  private setAuthCookie(response: Response, user: User) {
    const payload: AuthTokenPayload = { sub: user.id, email: user.email };
    const token = this.jwtService.sign(payload);

    response.cookie(this.config.get("authCookieName", { infer: true }), token, {
      httpOnly: true,
      sameSite: "lax",
      secure: this.config.get("nodeEnv", { infer: true }) === "production",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
}
