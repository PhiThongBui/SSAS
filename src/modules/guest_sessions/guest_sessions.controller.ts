import { Controller } from '@nestjs/common';
import { GuestSessionsService } from './guest_sessions.service';

@Controller('guest-sessions')
export class GuestSessionsController {
  constructor(private readonly guestSessionsService: GuestSessionsService) {}
}
