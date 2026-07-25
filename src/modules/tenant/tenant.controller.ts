import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCookieAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { TenantService } from './tenant.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { TenantResponseDto } from './dto/tenant-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { CurrentTenant } from '../auth/decorator/current-tenant.decorator';

@ApiTags('Tenant Management')
@Controller('tenant')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new tenant company' })
  @ApiConflictResponse({ description: 'Tenant slug already in use' })
  async createTenant(@Body() dto: CreateTenantDto): Promise<TenantResponseDto> {
    return await this.tenantService.createTenant(dto);
  }

  @Get('current')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Get current active tenant details' })
  @ApiNotFoundResponse({ description: 'Tenant not found' })
  async getCurrentTenant(
    @CurrentTenant() tenantId: string,
  ): Promise<TenantResponseDto> {
    return await this.tenantService.getTenantById(tenantId);
  }
}
