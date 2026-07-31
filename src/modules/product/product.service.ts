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

  async getProducts(
    page: string,
    pageSize: string,
    tenantId: string,
    withDeleted = false,
  ) {
    validateUUIDs(tenantId);

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Number(pageSize) || 10);

    const products = await this.productRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      relations: {
        tenant: true,
      },
      withDeleted,
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    });

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

  async deleteProduct(productId: string, tenantId: string, isSoft = true) {
    validateUUIDs(tenantId);

    // Use withDeleted: true so we can find soft-deleted items if performing a hard delete
    const product = await this.productRepository.findOne({
      where: { id: productId, tenantId },
      withDeleted: true,
    });

    if (!product) {
      throw new NotFoundException('Product with this ID or TenantID not found');
    }

    if (isSoft) {
      if (product.deletedAt) {
        throw new BadRequestException('Product is already soft-deleted');
      }
      await this.productRepository.softRemove(product);
      return { message: 'Product soft-deleted successfully' };
    } else {
      // Permanent deletion from database table
      await this.productRepository.remove(product);
      return { message: 'Product permanently removed from database' };
    }
  }

  async restoreProduct(productId: string, tenantId: string) {
    const product = await this.productRepository.findOne({
      where: { id: productId, tenantId },
      withDeleted: true,
    });

    if (!product || !product.deletedAt) {
      throw new NotFoundException('Soft-deleted product not found');
    }

    // Check if an active product took over this SKU while it was deleted
    const activeSkuConflict = await this.productRepository.findOne({
      where: { tenantId, sku: product.sku },
    });

    if (activeSkuConflict) {
      throw new BadRequestException(
        `Cannot restore product: active product "${activeSkuConflict.name}" is currently using SKU "${product.sku}". Rename or delete it first.`,
      );
    }

    return await this.productRepository.recover(product);
  }
}
