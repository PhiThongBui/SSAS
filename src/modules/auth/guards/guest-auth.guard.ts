import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { GuestSessionsService } from '../../guest_sessions/guest_sessions.service';

@Injectable()
export class GuestAuthGuard implements CanActivate {
  constructor(private readonly guestSessionsService: GuestSessionsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Không tìm thấy guest token');
    }

    const session = await this.guestSessionsService.findByRawToken(token);

    if (!session) {
      throw new UnauthorizedException('Guest token không hợp lệ');
    }
    if (session.closedAt !== null) {
      throw new UnauthorizedException('Phiên khách đã kết thúc');
    }
    if (session.expiresAt < new Date()) {
      throw new UnauthorizedException('Guest token đã hết hạn');
    }

    request['guestSession'] = { id: session.id, tableId: session.tableId };
    return true;
  }

  private extractToken(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
