import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto, LoginDto } from './dto';
import { JwtGuard } from './guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('invite')
  @UseGuards(JwtGuard)
  invite(@Body() dto: { email: string }) {
    return this.authService.sendInvite(dto.email);
  }

  @Get('verify/:token')
  verifyToken(@Param('token') token: string) {
    return this.authService.verifyInvite(token);
  }
}
