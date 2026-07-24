import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entity/Product.entity';
import { Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { validateUUIDs } from '../../utils/idsValidation.util';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product) private productRepository: Repository<Product>,
  ) {}

  // Helper: Fetches tenant-scoped product or returns null
  private async findProduct(productId: string, tenantId: string) {
    validateUUIDs(tenantId);
    return await this.productRepository.findOne({
      where: { id: productId, tenantId },
    });
  }

  async createProduct(tenantId: string, dto: CreateProductDto) {
    validateUUIDs(tenantId);

    // Check SKU uniqueness (including soft-deleted rows to prevent DB constraint errors)
    const sameProduct = await this.productRepository.findOne({
      where: { tenantId, sku: dto.sku },
      withDeleted: true,
    });

    if (sameProduct) {
      throw new BadRequestException(
        'Product with this SKU already exists for this tenant',
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { tenantId: _, ...productData } = dto;

    const newProduct = this.productRepository.create({
      ...productData,
      tenantId,
    });

    return await this.productRepository.save(newProduct);
  }

  async getProducts(page: string, pageSize: string, tenantId: string) {
    validateUUIDs(tenantId);

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Number(pageSize) || 10);

    const products = await this.productRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      relations: {
        tenant: true,
      },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    });

    if (products.length === 0) {
      throw new NotFoundException('Products Not Found For Given TenantID');
    }

    return products;
  }

  async getProductById(productId: string, tenantId: string) {
    const product = await this.findProduct(productId, tenantId);

    if (!product) {
      throw new NotFoundException('Product with this ID or TenantID Not Found');
    }

    return product;
  }

  async updateProduct(
    productId: string,
    tenantId: string,
    dto: UpdateProductDto,
  ) {
    const product = await this.findProduct(productId, tenantId);

    if (!product) {
      throw new NotFoundException('Product with this ID or TenantID Not Found');
    }

    // Check SKU uniqueness if changing SKU
    if (dto.sku && dto.sku !== product.sku) {
      const skuExists = await this.productRepository.findOne({
        where: { tenantId, sku: dto.sku },
        withDeleted: true,
      });

      if (skuExists) {
        throw new BadRequestException(
          'Product with this SKU already exists for this tenant',
        );
      }
    }

    this.productRepository.merge(product, dto);

    return await this.productRepository.save(product);
  }

  async deleteProduct(productId: string, tenantId: string) {
    const product = await this.findProduct(productId, tenantId);

    if (!product) {
      throw new NotFoundException('Product with this ID or TenantID Not Found');
    }

    await this.productRepository.softRemove(product);

    return {
      message: 'Product deleted successfully',
    };
  }
}
