import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { Roles } from '../auth/decorator/roles.decorator';
import { UserRole } from '../user/entity/User.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentTenant } from '../auth/decorator/current-tenant.decorator';

@Controller('analytics')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('revenue')
  async getRevenueMetrics(@CurrentTenant() tenantId: string) {
    return await this.analyticsService.revenueMetrics(tenantId);
  }

  @Get('top-products')
  async getTopSellingProducts(
    @CurrentTenant() tenantId: string,
    @Query('limit') limit: string,
  ) {
    return await this.analyticsService.topSellingProducts(tenantId, limit);
  }

  @Get('low-stock')
  async getLowStockProducts(
    @CurrentTenant() tenantId: string,
    @Query('threshold') threshold: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    const thresholdNum = Number(threshold) || 10;
    return await this.analyticsService.getLowStockProduct(
      tenantId,
      thresholdNum,
      page,
      limit,
    );
  }
}
