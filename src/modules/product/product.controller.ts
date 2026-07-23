import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorator/roles.decorator';
import { CurrentTenant } from '../auth/decorator/current-tenant.decorator';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UserRole } from '../user/entity/User.entity';

@Controller('product')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async fetchProducts(
    @CurrentTenant() tenantId: string,
    @Query('page') page: string,
    @Query('pageSize') pageSize: string,
  ) {
    return await this.productService.getProducts(page, pageSize, tenantId);
  }

  @Get(':productId')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async getProuctById(
    @CurrentTenant() tenantId: string,
    @Param('productId') productId: string,
  ) {
    return await this.productService.getProductById(productId, tenantId);
  }

  @Post('create')
  @Roles(UserRole.ADMIN)
  async createProduct(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateProductDto,
  ) {
    return await this.productService.createProduct(tenantId, dto);
  }

  @Patch(':productId')
  @Roles(UserRole.ADMIN)
  async updateProduct(
    @Param('productId') productId: string,
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateProductDto,
  ) {
    return await this.productService.updateProduct(productId, tenantId, dto);
  }

  @Delete(':productId')
  @Roles(UserRole.ADMIN)
  async deleteProduct(
    @Param('productId') productId: string,
    @CurrentTenant() tenantId: string,
  ) {
    return await this.productService.deleteProduct(productId, tenantId);
  }
}
