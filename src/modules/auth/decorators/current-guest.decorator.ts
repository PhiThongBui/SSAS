import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export interface GuestSessionPayload {
  id: string;
  tableId: string;
}

export const CurrentGuest = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): GuestSessionPayload => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { guestSession?: GuestSessionPayload }>();
    return request.guestSession as GuestSessionPayload;
  },
);
