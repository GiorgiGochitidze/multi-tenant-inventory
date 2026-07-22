import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { CurrentTenant } from '../auth/decorator/current-tenant.decorator';
import { CreateProductDto } from './dto/create-product.dto';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @UseGuards(JwtAuthGuard, TenantGuard)
  async fetchProducts(
    @CurrentTenant() tenantId: string,
    @Query('page') page: string,
    @Query('pageSize') pageSize: string,
  ) {
    return await this.productService.getProducts(page, pageSize, tenantId);
  }

  @Get(':productId')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async getProuctById(
    @CurrentTenant() tenantId: string,
    @Param('productId') productId: string,
  ) {
    return await this.productService.getProductById(productId, tenantId);
  }

  @Post('create')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async createProduct(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateProductDto,
  ) {
    return await this.productService.createProduct(tenantId, dto);
  }
}
