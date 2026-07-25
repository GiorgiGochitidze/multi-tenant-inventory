import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './entity/Tenant.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { TenantResponseDto } from './dto/tenant-response.dto';
import { validateUUIDs } from '../../utils/idsValidation.util';

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
  ) {}

  async createTenant(dto: CreateTenantDto): Promise<TenantResponseDto> {
    const slug =
      dto.slug?.toLowerCase().trim() ||
      dto.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    const existingTenant = await this.tenantRepository.findOneBy({ slug });
    if (existingTenant) {
      throw new ConflictException('Tenant slug already in use');
    }

    const newTenant = this.tenantRepository.create({
      name: dto.name,
      slug,
    });

    return await this.tenantRepository.save(newTenant);
  }

  async getTenantById(tenantId: string): Promise<TenantResponseDto> {
    validateUUIDs(tenantId);

    const tenant = await this.tenantRepository.findOneBy({ id: tenantId });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }
}
