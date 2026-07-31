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
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ProductService } from './product.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorator/roles.decorator';
import { CurrentTenant } from '../auth/decorator/current-tenant.decorator';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UserRole } from '../user/entity/User.entity';
import { ProductResponseDto } from './dto/product-response.dto';

@ApiTags('Products Management')
@ApiCookieAuth('access_token')
@Controller('product')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Paginated list of products for active tenant' })
  async fetchProducts(
    @CurrentTenant() tenantId: string,
    @Query('page') page: string,
    @Query('pageSize') pageSize: string,
    @Query('withDeleted') withDeleted?: string,
  ): Promise<ProductResponseDto[]> {
    return await this.productService.getProducts(
      page,
      pageSize,
      tenantId,
      withDeleted === 'true',
    );
  }

  @Get(':productId')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get product details by product ID' })
  @ApiNotFoundResponse({ description: 'Product not found under this tenant' })
  async getProuctById(
    @CurrentTenant() tenantId: string,
    @Param('productId') productId: string,
  ): Promise<ProductResponseDto> {
    return await this.productService.getProductById(productId, tenantId);
  }

  @Post('create')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new product' })
  @ApiConflictResponse({ description: 'Product with this SKU already exists' })
  async createProduct(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateProductDto,
  ): Promise<ProductResponseDto> {
    return await this.productService.createProduct(tenantId, dto);
  }

  @Patch(':productId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update an existing product' })
  @ApiNotFoundResponse({ description: 'Product not found under this tenant' })
  async updateProduct(
    @Param('productId') productId: string,
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    return await this.productService.updateProduct(productId, tenantId, dto);
  }

  @Delete(':productId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary:
      'Delete product (defaults to soft delete, use ?soft=false for hard delete)',
  })
  @ApiNotFoundResponse({ description: 'Product not found under this tenant' })
  async deleteProduct(
    @Param('productId') productId: string,
    @CurrentTenant() tenantId: string,
    @Query('soft') soft?: string,
  ): Promise<{ message: string }> {
    const isSoftDelete = soft !== 'false';
    return await this.productService.deleteProduct(
      productId,
      tenantId,
      isSoftDelete,
    );
  }

  @Patch(':productId/restore')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Restore a soft-deleted product' })
  @ApiNotFoundResponse({
    description: 'Soft-deleted product not found under this tenant',
  })
  @ApiBadRequestResponse({
    description: 'Active product with the same SKU already exists',
  })
  async restoreProduct(
    @Param('productId') productId: string,
    @CurrentTenant() tenantId: string,
  ): Promise<ProductResponseDto> {
    return await this.productService.restoreProduct(productId, tenantId);
  }
}
