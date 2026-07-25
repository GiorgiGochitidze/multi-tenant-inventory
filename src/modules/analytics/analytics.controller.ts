import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { Roles } from '../auth/decorator/roles.decorator';
import { UserRole } from '../user/entity/User.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentTenant } from '../auth/decorator/current-tenant.decorator';
import { ProductResponseDto } from '../product/dto/product-response.dto';
import {
  RevenueMetricsDto,
  TopSellingProductDto,
} from './dto/analytics-response.dto';

@ApiTags('Analytics')
@ApiCookieAuth('access_token')
@Controller('analytics')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('revenue')
  @ApiOperation({ summary: 'Get total revenue and order count metrics' })
  async getRevenueMetrics(
    @CurrentTenant() tenantId: string,
  ): Promise<RevenueMetricsDto> {
    return await this.analyticsService.revenueMetrics(tenantId);
  }

  @Get('top-products')
  @ApiOperation({ summary: 'Get top selling products by order volume' })
  async getTopSellingProducts(
    @CurrentTenant() tenantId: string,
    @Query('limit') limit: string,
  ): Promise<TopSellingProductDto[]> {
    return await this.analyticsService.topSellingProducts(tenantId, limit);
  }

  @Get('low-stock')
  @ApiOperation({
    summary: 'Get list of products falling below stock threshold',
  })
  async getLowStockProducts(
    @CurrentTenant() tenantId: string,
    @Query('threshold') threshold: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ): Promise<ProductResponseDto[]> {
    const thresholdNum = Number(threshold) || 10;
    return await this.analyticsService.getLowStockProduct(
      tenantId,
      thresholdNum,
      page,
      limit,
    );
  }
}
