import { Test, TestingModule } from '@nestjs/testing';
import { TenantController } from '../tenant.controller';
import { TenantService } from '../tenant.service';
import { TenantResponseDto } from '../dto/tenant-response.dto';
import { CreateTenantDto } from '../dto/create-tenant.dto';

describe('TenantController', () => {
  let controller: TenantController;
  let mockTenantService: Partial<Record<keyof TenantService, jest.Mock>>;

  const mockTenantId = '7103268b-9791-46d1-9029-c9481d4a402a';

  const mockTenantResponse: TenantResponseDto = {
    id: mockTenantId,
    name: 'Giorgi-Shop',
    slug: 'giorgi-shop',
  } as TenantResponseDto;

  beforeEach(async () => {
    mockTenantService = {
      createTenant: jest.fn(),
      getTenantById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TenantController],
      providers: [{ provide: TenantService, useValue: mockTenantService }],
    }).compile();

    controller = module.get<TenantController>(TenantController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTenant', () => {
    it('should call tenantService.createTenant with the dto and return its result', async () => {
      const dto: CreateTenantDto = { name: 'Giorgi-Shop', slug: 'giorgi-shop' };
      mockTenantService.createTenant?.mockResolvedValue(mockTenantResponse);

      const result = await controller.createTenant(dto);

      expect(mockTenantService.createTenant).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockTenantResponse);
    });
  });

  describe('getCurrentTenant', () => {
    it('should call tenantService.getTenantById with the resolved tenantId and return its result', async () => {
      mockTenantService.getTenantById?.mockResolvedValue(mockTenantResponse);

      // @CurrentTenant() is bypassed entirely in a unit test — we just pass
      // the value directly, as if the decorator had already resolved it.
      const result = await controller.getCurrentTenant(mockTenantId);

      expect(mockTenantService.getTenantById).toHaveBeenCalledWith(
        mockTenantId,
      );
      expect(result).toEqual(mockTenantResponse);
    });
  });
});
