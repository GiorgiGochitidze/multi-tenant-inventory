import { Test, TestingModule } from '@nestjs/testing';
import {
  createMockRepository,
  MockRepository,
} from '../../../../test/mock-repository';
import { Tenant } from '../entity/Tenant.entity';
import { TenantService } from '../tenant.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CreateTenantDto } from '../dto/create-tenant.dto';
import { buildTenant } from './tenant.factory';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('TenantService', () => {
  let service: TenantService;
  let mockRepository: MockRepository<Tenant>;
  const mockTenantId = '7103268b-9791-46d1-9029-c9481d4a402a';

  beforeEach(async () => {
    mockRepository = createMockRepository<Tenant>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantService,
        {
          provide: getRepositoryToken(Tenant),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<TenantService>(TenantService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTenant', () => {
    const createDto: CreateTenantDto = {
      name: 'Giorgi-Shop',
      slug: 'giorgi-shop',
    };

    it('Should successfully create new tenant', async () => {
      const savedTenant = buildTenant(createDto);

      mockRepository.findOneBy?.mockResolvedValue(null);
      mockRepository.create?.mockReturnValue(createDto);
      mockRepository.save?.mockResolvedValue(savedTenant);

      const result = await service.createTenant(createDto);

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({
        slug: createDto.slug,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(savedTenant);
    });

    it('Shoul throw ConflictException if the slug already exists', async () => {
      mockRepository.findOneBy?.mockResolvedValue(buildTenant());

      await expect(service.createTenant(createDto)).rejects.toThrow(
        ConflictException,
      );

      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('getTenantById', () => {
    it('should return the tenant when found', async () => {
      const tenant = buildTenant({ id: mockTenantId });
      mockRepository.findOneBy?.mockResolvedValue(tenant);

      const result = await service.getTenantById(mockTenantId);

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({
        id: mockTenantId,
      });
      expect(result).toEqual(tenant);
    });

    it('should throw NotFoundException when no tenant is found', async () => {
      mockRepository.findOneBy?.mockResolvedValue(null);

      await expect(service.getTenantById(mockTenantId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
