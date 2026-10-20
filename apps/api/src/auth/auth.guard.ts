import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import { IS_PUBLIC_KEY } from "../common/decorators/public.decorator";
import { AppConfig } from "../config/configuration";
import { UsersService } from "../users/users.service";
import { AuthTokenPayload, AuthUser } from "./auth.types";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const token = this.readToken(request);
    if (!token) {
      throw new UnauthorizedException("Authentication is required");
    }

    try {
      const payload = await this.jwtService.verifyAsync<AuthTokenPayload>(token);
      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException("Authentication is required");
      }
      request.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      };
      return true;
    } catch {
      throw new UnauthorizedException("Authentication is required");
    }
  }

  private readToken(request: Request): string | null {
    const cookieName = this.config.get("authCookieName", { infer: true });
    const cookieToken = request.cookies?.[cookieName];
    if (typeof cookieToken === "string" && cookieToken.length > 0) {
      return cookieToken;
    }

    const header = request.headers.authorization;
    if (header?.startsWith("Bearer ")) {
      return header.slice("Bearer ".length);
    }

    return null;
  }
}
