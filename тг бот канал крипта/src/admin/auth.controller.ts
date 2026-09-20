import { Body, Controller, Get, HttpCode, Post, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { AuthGuard } from './auth.guard';
import { AuthService, SESSION_COOKIE } from './auth.service';

interface LoginBody {
  username?: string;
  password?: string;
}

@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('login')
  @HttpCode(200)
  login(@Body() body: LoginBody, @Res({ passthrough: true }) res: Response) {
    const { username, password } = body ?? {};

    if (!username || !password || !this.authService.validateCredentials(username, password)) {
      throw new UnauthorizedException('Невірний логін або пароль');
    }

    const panelUrl = this.config.get<string>('panelUrl') ?? '';
    res.cookie(SESSION_COOKIE, this.authService.issueToken(), {
      httpOnly: true,
      sameSite: 'lax',
      secure: panelUrl.startsWith('https://'),
      maxAge: this.authService.cookieMaxAgeMs,
    });

    return { ok: true };
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(SESSION_COOKIE);
    return { ok: true };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me() {
    return { authenticated: true };
  }
}
