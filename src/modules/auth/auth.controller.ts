import { Controller, Post, Body, Get, Request } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { Public, CurrentUser } from '../../common/decorators';
import * as currentUserDecorator from '../../common/decorators/current-user.decorator';
import { RequestUtil } from '../../common/utils/request.util';
import { LoginDto, RefreshTokenDto } from './dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'User login' })
  async login(@Body() loginDto: LoginDto, @Request() req: Request) {
    const { ip, userAgent } = RequestUtil.extractClientInfo(req);
    return this.authService.login(loginDto, ip, userAgent);
  }

  // @Public()
  // @Post('register')
  // @Throttle({ default: { limit: 3, ttl: 300000 } })
  // @ApiOperation({ summary: 'User registration' })
  // async register(@Body() registerDto: RegisterDto, @Request() req: Request) {
  //   const { ip, userAgent } = RequestUtil.extractClientInfo(req);
  //   return this.authService.register(registerDto, ip, userAgent);
  // }

  @Post('refresh')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refresh access token' })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  async logout(
    @CurrentUser() user: currentUserDecorator.CurrentUserData,
    @Request() req: Request,
  ) {
    const { ip, userAgent } = RequestUtil.extractClientInfo(req);
    return this.authService.logout(user.id, ip, userAgent);
  }

  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  getProfile(@CurrentUser() user: currentUserDecorator.CurrentUserData) {
    return {
      success: true,
      data: user,
    };
  }
}
