import { Body, Controller, Get, Put } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CartService } from './cart.service';
import { SyncCartDto } from './dto/sync-cart.dto';

@Controller('cart')
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Get()
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.cart.findForUser(user.id);
  }

  @Put()
  sync(@CurrentUser() user: AuthenticatedUser, @Body() dto: SyncCartDto) {
    return this.cart.sync(user.id, dto);
  }
}
