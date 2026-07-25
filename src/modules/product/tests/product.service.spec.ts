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

      expect(mockRepository.save).toHaveBeenCalled();
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
});
