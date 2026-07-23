import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorator/roles.decorator';
import { CurrentTenant } from '../auth/decorator/current-tenant.decorator';
import { UserRole } from '../user/entity/User.entity';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async createOrder(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateOrderDto,
  ) {
    return await this.orderService.createOrder(tenantId, dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async getOrders(
    @Query('page') page: string,
    @Query('pageSize') pageSize: string,
    @CurrentTenant() tenantId: string,
  ) {
    return await this.orderService.getOrders(page, pageSize, tenantId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async getOrderById(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
  ) {
    return await this.orderService.getOrderById(id, tenantId);
  }
}
