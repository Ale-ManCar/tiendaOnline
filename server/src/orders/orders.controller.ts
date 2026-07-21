import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../generated/prisma/enums';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  mine(@CurrentUser() user: AuthenticatedUser) {
    return this.orders.findForUser(user.id);
  }

  @Roles(UserRole.ADMIN, UserRole.FULFILLMENT, UserRole.SUPPORT)
  @Get('admin')
  adminList() {
    return this.orders.findAll();
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateOrderDto) {
    return this.orders.create(user, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.FULFILLMENT, UserRole.SUPPORT)
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.orders.updateStatus(id, dto.status);
  }

  @Roles(UserRole.ADMIN, UserRole.FULFILLMENT, UserRole.SUPPORT)
  @Patch(':id/payment-status')
  updatePaymentStatus(@Param('id') id: string, @Body() dto: UpdatePaymentStatusDto) {
    return this.orders.updatePaymentStatus(id, dto.status);
  }
}
