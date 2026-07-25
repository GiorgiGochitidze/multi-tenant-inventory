import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorator/roles.decorator';
import { CurrentTenant } from '../auth/decorator/current-tenant.decorator';
import { UserRole } from '../user/entity/User.entity';
import { OrderResponseDto } from './dto/order-response.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@ApiTags('Orders Management')
@ApiCookieAuth('access_token')
@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Create a new order for the active tenant' })
  async createOrder(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateOrderDto,
  ): Promise<OrderResponseDto> {
    return await this.orderService.createOrder(tenantId, dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Paginated list of orders for the active tenant' })
  async getOrders(
    @Query('page') page: string,
    @Query('pageSize') pageSize: string,
    @CurrentTenant() tenantId: string,
  ): Promise<OrderResponseDto[]> {
    return await this.orderService.getOrders(page, pageSize, tenantId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get order details by order ID' })
  @ApiNotFoundResponse({ description: 'Order not found under this tenant' })
  async getOrderById(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
  ): Promise<OrderResponseDto> {
    return await this.orderService.getOrderById(id, tenantId);
  }

  @Patch(':id/cancel')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Cancel an existing order' })
  @ApiNotFoundResponse({ description: 'Order not found under this tenant' })
  async cancelOrder(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
  ): Promise<OrderResponseDto> {
    return await this.orderService.cancelOrder(id, tenantId);
  }

  @Patch(':orderId/confirm')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Manually confirm a pending order' })
  @ApiNotFoundResponse({ description: 'Order not found under this tenant' })
  @ApiBadRequestResponse({ description: 'Order is already cancelled' })
  async confirmOrder(
    @Param('orderId') orderId: string,
    @CurrentTenant() tenantId: string,
  ): Promise<OrderResponseDto> {
    return await this.orderService.confirmOrder(orderId, tenantId);
  }

  @Patch(':orderId/status')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({
    summary: 'Update order status (CONFIRMED, COMPLETED, CANCELLED)',
  })
  @ApiNotFoundResponse({ description: 'Order not found under this tenant' })
  @ApiBadRequestResponse({
    description: 'Cannot update status of a cancelled order',
  })
  async updateOrderStatus(
    @Param('orderId') orderId: string,
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateOrderStatusDto,
  ): Promise<OrderResponseDto> {
    return await this.orderService.updateOrderStatus(orderId, tenantId, dto);
  }
}
