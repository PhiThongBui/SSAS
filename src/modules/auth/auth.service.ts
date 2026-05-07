import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RolesService } from '../roles/roles.service';
import { RefreshTokensService } from '../refresh_tokens/refresh_tokens.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly rolesService: RolesService,
    private readonly refreshTokensService: RefreshTokensService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersService.findByUsername(dto.username);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Sai tài khoản hoặc mật khẩu');
    }

    const passwordMatch = await this.usersService.verifyPassword(
      dto.password,
      user.passwordHash ?? '',
    );
    if (!passwordMatch) {
      throw new UnauthorizedException('Sai tài khoản hoặc mật khẩu');
    }

    const roles = await this.rolesService.findRolesByUserId(user.id);
    const accessToken = this.jwtService.sign({ sub: user.id, roles });
    const refreshToken = await this.refreshTokensService.generate(user.id);

    return { access_token: accessToken, refresh_token: refreshToken };
  }

  async refresh(dto: RefreshDto) {
    const token = await this.refreshTokensService.findByRawToken(
      dto.refresh_token,
    );

    if (!token) {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }
    if (token.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token đã hết hạn');
    }

    const roles = await this.rolesService.findRolesByUserId(token.userId);
    const accessToken = this.jwtService.sign({ sub: token.userId, roles });

    return { access_token: accessToken, refresh_token: dto.refresh_token };
  }
}
