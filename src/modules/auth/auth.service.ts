import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RolesService } from '../roles/roles.service';
import { RefreshTokensService } from '../refresh_tokens/refresh_tokens.service';
import { LoginDto } from './dto/login.dto';

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

    const refreshTokenService = this.refreshTokensService as {
      generate: (userId: string) => Promise<string>;
    };
    const refreshToken = await refreshTokenService.generate(String(user.id));

    return { access_token: accessToken, refresh_token: refreshToken };
  }
}
