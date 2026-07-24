import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entity/User.entity';
import { Repository } from 'typeorm';
import { validateUUIDs } from '../../utils/idsValidation.util';
import { InviteStaffDto } from './dto/invite-staff.dto';
import * as bcrypt from 'bcrypt';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getTenantUsers(tenantId: string) {
    validateUUIDs(tenantId);

    return await this.userRepository.find({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        tenantId: true,
        createdAt: true,
        updatedAt: true,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async inviteStaff(tenantId: string, dto: InviteStaffDto) {
    validateUUIDs(tenantId);

    const existingUser = await this.userRepository.findOneBy({
      email: dto.email,
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const newUser = this.userRepository.create({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
      role: dto.role,
      tenantId,
    });

    const savedUser = await this.userRepository.save(newUser);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, refreshToken, ...result } = savedUser;
    return result;
  }

  async updateUserRole(
    adminId: string,
    targetUserId: string,
    tenantId: string,
    dto: UpdateRoleDto,
  ) {
    const targetUser = await this.findAndValidateTargetUser(
      adminId,
      targetUserId,
      tenantId,
      'You cannot change your own role',
    );

    targetUser.role = dto.role;
    const updated = await this.userRepository.save(targetUser);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, refreshToken, ...result } = updated;
    return result;
  }

  async updateUserStatus(
    adminId: string,
    targetUserId: string,
    tenantId: string,
    dto: UpdateStatusDto,
  ) {
    const targetUser = await this.findAndValidateTargetUser(
      adminId,
      targetUserId,
      tenantId,
      'You cannot change your own status',
    );

    targetUser.isActive = dto.isActive;
    const updated = await this.userRepository.save(targetUser);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, refreshToken, ...result } = updated;
    return result;
  }

  private async findAndValidateTargetUser(
    adminId: string,
    targetUserId: string,
    tenantId: string,
    selfErrorMessage: string,
  ): Promise<User> {
    validateUUIDs(adminId, targetUserId, tenantId);

    if (adminId === targetUserId) {
      throw new BadRequestException(selfErrorMessage);
    }

    const targetUser = await this.userRepository.findOneBy({
      id: targetUserId,
      tenantId,
    });

    if (!targetUser) {
      throw new NotFoundException(
        'User with this ID not found under this tenant',
      );
    }

    return targetUser;
  }
}
