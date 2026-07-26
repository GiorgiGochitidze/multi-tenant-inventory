import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProductService } from '../product.service';
import { Product } from '../entity/Product.entity';
import { CreateProductDto } from '../dto/create-product.dto';
import { buildProduct } from './factories/product.factory';
import {
  createMockRepository,
  MockRepository,
} from '../../../../test/mock-repository';

describe('ProductService', () => {
  let service: ProductService;
  let mockRepository: MockRepository<Product>;
  const mockTenantId = '7103268b-9791-46d1-9029-c9481d4a402a';

  beforeEach(async () => {
    mockRepository = createMockRepository<Product>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createProduct', () => {
    const createDto: CreateProductDto = {
      tenantId: mockTenantId,
      name: 'Barcode Scanner',
      sku: 'SCAN-001',
      price: 99.99,
      stockQuantity: 10,
    };

    it('should successfully create and save a new product', async () => {
      const savedProduct = buildProduct();

      mockRepository.findOne?.mockResolvedValue(null);
      mockRepository.create?.mockReturnValue(createDto);
      mockRepository.save?.mockResolvedValue(savedProduct);

      const result = await service.createProduct(mockTenantId, createDto);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { tenantId: mockTenantId, sku: createDto.sku },
        withDeleted: true,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(savedProduct);
    });

    it('should throw BadRequestException if SKU already exists', async () => {
      mockRepository.findOne?.mockResolvedValue(buildProduct());

      await expect(
        service.createProduct(mockTenantId, createDto),
      ).rejects.toThrow(BadRequestException);

      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('getProducts', () => {
    it('should successfully retrieve all products', async () => {
      const products = [buildProduct(), buildProduct({ id: 'second-id' })];
      mockRepository.find?.mockResolvedValue(products);

      const result = await service.getProducts('1', '5', mockTenantId);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { tenantId: mockTenantId },
        order: { createdAt: 'DESC' },
        relations: { tenant: true },
        skip: 0,
        take: 5,
      });
      expect(result).toEqual(products);
    });

    it('should throw NotFoundException if no products are found', async () => {
      mockRepository.find?.mockResolvedValue([]);

      await expect(service.getProducts('1', '5', mockTenantId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should calculate correct skip/take for a later page', async () => {
      const products = [buildProduct()];
      mockRepository.find?.mockResolvedValue(products);

      await service.getProducts('3', '5', mockTenantId);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { tenantId: mockTenantId },
        order: { createdAt: 'DESC' },
        relations: { tenant: true },
        skip: 10,
        take: 5,
      });
    });

    it('should fall back to page 1 and pageSize 10 when given invalid/non-numeric values', async () => {
      const products = [buildProduct()];
      mockRepository.find?.mockResolvedValue(products);

      await service.getProducts('abc', 'xyz', mockTenantId);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { tenantId: mockTenantId },
        order: { createdAt: 'DESC' },
        relations: { tenant: true },
        skip: 0,
        take: 10,
      });
    });
  });

  describe('getProductById', () => {
    it('should retrieve single product object by provided ID', async () => {
      const product = buildProduct();
      mockRepository.findOne?.mockResolvedValue(product);

      const result = await service.getProductById(product.id, mockTenantId);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: product.id, tenantId: mockTenantId },
      });
      expect(result).toEqual(product);
    });

    it('should throw NotFoundException if no product was found', async () => {
      mockRepository.findOne?.mockResolvedValue(null);

      await expect(
        service.getProductById('invalid-id', mockTenantId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProduct', () => {
    const updateDto = { name: 'Updated Name', price: 35 };

    it('should successfully update and save the product', async () => {
      const existing = buildProduct({ name: 'Old Name', price: 25 });
      const updated = buildProduct({ name: 'Updated Name', price: 35 });

      mockRepository.findOne?.mockResolvedValue(existing);
      mockRepository.merge?.mockReturnValue(updated);
      mockRepository.save?.mockResolvedValue(updated);

      const result = await service.updateProduct(
        existing.id,
        mockTenantId,
        updateDto,
      );

      expect(mockRepository.merge).toHaveBeenCalledWith(existing, updateDto);
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toEqual(updated);
    });

    it('should update successfully without touching SKU uniqueness check when SKU is unchanged', async () => {
      const existing = buildProduct({ name: 'Old Name', sku: 'SAME-SKU' });
      const updated = buildProduct({ name: 'New Name', sku: 'SAME-SKU' });
      const dtoWithoutSkuChange = { name: 'New Name' };

      mockRepository.findOne?.mockResolvedValue(existing);
      mockRepository.merge?.mockReturnValue(updated);
      mockRepository.save?.mockResolvedValue(updated);

      const result = await service.updateProduct(
        existing.id,
        mockTenantId,
        dtoWithoutSkuChange,
      );

      // findOne should only be called ONCE (the initial fetch) since dto.sku is falsy,
      // so the SKU-conflict lookup branch should never run
      expect(mockRepository.findOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual(updated);
    });

    it('should throw NotFoundException if product does not exist', async () => {
      mockRepository.findOne?.mockResolvedValue(null);

      await expect(
        service.updateProduct('invalid-id', mockTenantId, updateDto),
      ).rejects.toThrow(NotFoundException);

      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if new SKU already exists', async () => {
      const existing = buildProduct();
      const skuDto = { sku: 'EXISTING-SKU' };

      mockRepository.findOne
        ?.mockResolvedValueOnce(existing)
        ?.mockResolvedValueOnce(
          buildProduct({ id: 'other-id', sku: 'EXISTING-SKU' }),
        );

      await expect(
        service.updateProduct(existing.id, mockTenantId, skuDto),
      ).rejects.toThrow(BadRequestException);

      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('deleteProduct', () => {
    it('should soft-delete the product successfully', async () => {
      const product = buildProduct();

      mockRepository.findOne?.mockResolvedValue(product);
      mockRepository.softRemove?.mockResolvedValue(undefined);

      const result = await service.deleteProduct(
        product.id,
        mockTenantId,
        true,
      );

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: product.id, tenantId: mockTenantId },
        withDeleted: true,
      });
      expect(mockRepository.softRemove).toHaveBeenCalledWith(product);
      expect(mockRepository.remove).not.toHaveBeenCalled();
      expect(result).toEqual({ message: 'Product soft-deleted successfully' });
    });

    it('should throw BadRequestException if the product is already soft-deleted', async () => {
      const alreadyDeleted = buildProduct({ deletedAt: new Date() });

      mockRepository.findOne?.mockResolvedValue(alreadyDeleted);

      await expect(
        service.deleteProduct(alreadyDeleted.id, mockTenantId, true),
      ).rejects.toThrow(BadRequestException);

      expect(mockRepository.softRemove).not.toHaveBeenCalled();
    });

    it('should permanently (hard) delete the product when isSoft is false', async () => {
      const product = buildProduct();

      mockRepository.findOne?.mockResolvedValue(product);
      mockRepository.remove?.mockResolvedValue(undefined);

      const result = await service.deleteProduct(
        product.id,
        mockTenantId,
        false,
      );

      expect(mockRepository.remove).toHaveBeenCalledWith(product);
      expect(mockRepository.softRemove).not.toHaveBeenCalled();
      expect(result).toEqual({
        message: 'Product permanently removed from database',
      });
    });

    it('should throw NotFoundException if no product is found', async () => {
      mockRepository.findOne?.mockResolvedValue(null);

      await expect(
        service.deleteProduct('invalid-id', mockTenantId, true),
      ).rejects.toThrow(NotFoundException);

      expect(mockRepository.softRemove).not.toHaveBeenCalled();
      expect(mockRepository.remove).not.toHaveBeenCalled();
    });
  });

  describe('restoreProduct', () => {
    it('should restore a soft-deleted product', async () => {
      const exampleProduct = buildProduct({ deletedAt: new Date() });

      mockRepository.findOne
        ?.mockResolvedValueOnce(exampleProduct)
        ?.mockResolvedValueOnce(null);

      mockRepository.recover?.mockResolvedValue(exampleProduct);

      const result = await service.restoreProduct(
        exampleProduct.id,
        mockTenantId,
      );

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: exampleProduct.id, tenantId: mockTenantId },
        withDeleted: true,
      });
      expect(mockRepository.recover).toHaveBeenCalledWith(exampleProduct);
      expect(result).toEqual(exampleProduct);
    });

    it('should throw NotFoundException if no product is found at all', async () => {
      mockRepository.findOne?.mockResolvedValue(null);

      await expect(
        service.restoreProduct('invalid-id', mockTenantId),
      ).rejects.toThrow(NotFoundException);

      expect(mockRepository.recover).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if the product exists but is not soft-deleted', async () => {
      const activeProduct = buildProduct({
        deletedAt: null as unknown as Date,
      });

      mockRepository.findOne?.mockResolvedValue(activeProduct);

      await expect(
        service.restoreProduct(activeProduct.id, mockTenantId),
      ).rejects.toThrow(NotFoundException);

      expect(mockRepository.recover).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if an active product already holds the SKU', async () => {
      const existing = buildProduct({ deletedAt: new Date() });

      mockRepository.findOne
        ?.mockResolvedValueOnce(existing)
        ?.mockResolvedValueOnce(
          buildProduct({ id: 'other-id', sku: existing.sku }),
        );

      await expect(
        service.restoreProduct(existing.id, mockTenantId),
      ).rejects.toThrow(BadRequestException);

      expect(mockRepository.recover).not.toHaveBeenCalled();
    });
  });
});
