import { Body, Controller, Get, HttpCode, Post, Res } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { AuthUserDto } from "@ripple/shared-types";
import { Response } from "express";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Public } from "../common/decorators/public.decorator";
import { AuthService } from "./auth.service";
import { AuthUser } from "./auth.types";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("register")
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: "Register a new user" })
  @ApiOkResponse({ description: "The created user" })
  register(@Body() body: RegisterDto, @Res({ passthrough: true }) response: Response): Promise<AuthUserDto> {
    return this.authService.register(body.email, body.password, body.name, response);
  }

  @Public()
  @Post("login")
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: "Log in" })
  login(@Body() body: LoginDto, @Res({ passthrough: true }) response: Response): Promise<AuthUserDto> {
    return this.authService.login(body.email, body.password, response);
  }

  @Public()
  @Post("logout")
  @HttpCode(204)
  @ApiOperation({ summary: "Log out" })
  logout(@Res({ passthrough: true }) response: Response) {
    this.authService.logout(response);
  }

  @Get("me")
  @ApiOperation({ summary: "Current user" })
  me(@CurrentUser() user: AuthUser): AuthUserDto {
    return this.authService.toDto(user);
  }
}
