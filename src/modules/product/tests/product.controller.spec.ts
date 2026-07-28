import { Test, TestingModule } from '@nestjs/testing';
import { ProductController } from '../product.controller';
import { ProductService } from '../product.service';
import { ProductResponseDto } from '../dto/product-response.dto';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';

describe('ProductController', () => {
  let controller: ProductController;
  let mockProductService: Partial<Record<keyof ProductService, jest.Mock>>;

  const mockTenantId = '7103268b-9791-46d1-9029-c9481d4a402a';
  const mockProductId = '7a69aa1c-d816-4a26-b51a-c0b795432b5b';

  const mockProductResponse = {
    id: mockProductId,
    name: 'Barcode Scanner',
    sku: 'SCAN-001',
    price: 99.99,
    stockQuantity: 10,
    tenantId: mockTenantId,
  } as unknown as ProductResponseDto;

  beforeEach(async () => {
    mockProductService = {
      getProducts: jest.fn(),
      getProductById: jest.fn(),
      createProduct: jest.fn(),
      updateProduct: jest.fn(),
      deleteProduct: jest.fn(),
      restoreProduct: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [{ provide: ProductService, useValue: mockProductService }],
    }).compile();

    controller = module.get<ProductController>(ProductController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchProducts', () => {
    it('should call productService.getProducts with page, pageSize, and tenantId', async () => {
      const products = [mockProductResponse];
      mockProductService.getProducts?.mockResolvedValue(products);

      const result = await controller.fetchProducts(mockTenantId, '1', '10');

      expect(mockProductService.getProducts).toHaveBeenCalledWith(
        '1',
        '10',
        mockTenantId,
      );
      expect(result).toEqual(products);
    });
  });

  describe('getProuctById', () => {
    it('should call productService.getProductById with tenantId and productId', async () => {
      mockProductService.getProductById?.mockResolvedValue(mockProductResponse);

      const result = await controller.getProuctById(
        mockTenantId,
        mockProductId,
      );

      expect(mockProductService.getProductById).toHaveBeenCalledWith(
        mockProductId,
        mockTenantId,
      );
      expect(result).toEqual(mockProductResponse);
    });
  });

  describe('createProduct', () => {
    it('should call productService.createProduct with tenantId and the dto', async () => {
      const dto: CreateProductDto = {
        tenantId: mockTenantId,
        name: 'Barcode Scanner',
        sku: 'SCAN-001',
        price: 99.99,
        stockQuantity: 10,
      };
      mockProductService.createProduct?.mockResolvedValue(mockProductResponse);

      const result = await controller.createProduct(mockTenantId, dto);

      expect(mockProductService.createProduct).toHaveBeenCalledWith(
        mockTenantId,
        dto,
      );
      expect(result).toEqual(mockProductResponse);
    });
  });

  describe('updateProduct', () => {
    it('should call productService.updateProduct with productId, tenantId, and the dto', async () => {
      const dto: UpdateProductDto = { name: 'Updated Name', price: 35 };
      const updated = {
        ...mockProductResponse,
        name: 'Updated Name',
        price: 35,
      };
      mockProductService.updateProduct?.mockResolvedValue(updated);

      const result = await controller.updateProduct(
        mockProductId,
        mockTenantId,
        dto,
      );

      expect(mockProductService.updateProduct).toHaveBeenCalledWith(
        mockProductId,
        mockTenantId,
        dto,
      );
      expect(result).toEqual(updated);
    });
  });

  describe('deleteProduct', () => {
    it('should soft-delete by default when soft query param is omitted', async () => {
      const response = { message: 'Product soft-deleted successfully' };
      mockProductService.deleteProduct?.mockResolvedValue(response);

      const result = await controller.deleteProduct(
        mockProductId,
        mockTenantId,
        undefined,
      );

      expect(mockProductService.deleteProduct).toHaveBeenCalledWith(
        mockProductId,
        mockTenantId,
        true,
      );
      expect(result).toEqual(response);
    });

    it('should hard-delete when soft query param is exactly "false"', async () => {
      const response = { message: 'Product permanently removed from database' };
      mockProductService.deleteProduct?.mockResolvedValue(response);

      const result = await controller.deleteProduct(
        mockProductId,
        mockTenantId,
        'false',
      );

      expect(mockProductService.deleteProduct).toHaveBeenCalledWith(
        mockProductId,
        mockTenantId,
        false,
      );
      expect(result).toEqual(response);
    });

    it('should soft-delete when soft query param is any value other than "false"', async () => {
      const response = { message: 'Product soft-deleted successfully' };
      mockProductService.deleteProduct?.mockResolvedValue(response);

      await controller.deleteProduct(mockProductId, mockTenantId, 'true');

      expect(mockProductService.deleteProduct).toHaveBeenCalledWith(
        mockProductId,
        mockTenantId,
        true,
      );
    });
  });

  describe('restoreProduct', () => {
    it('should call productService.restoreProduct with productId and tenantId', async () => {
      mockProductService.restoreProduct?.mockResolvedValue(mockProductResponse);

      const result = await controller.restoreProduct(
        mockProductId,
        mockTenantId,
      );

      expect(mockProductService.restoreProduct).toHaveBeenCalledWith(
        mockProductId,
        mockTenantId,
      );
      expect(result).toEqual(mockProductResponse);
    });
  });
});
