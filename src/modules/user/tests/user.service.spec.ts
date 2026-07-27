import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { UserService } from '../user.service';
import { User, UserRole } from '../entity/User.entity';
import {
  createMockRepository,
  MockRepository,
} from '../../../../test/mock-repository';
import { buildUser } from '../../auth/tests/auth.factory';
import { InviteStaffDto } from '../dto/invite-staff.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { UpdateStatusDto } from '../dto/update-status.dto';

/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-assignment */

jest.mock('bcrypt');
import * as bcrypt from 'bcrypt';
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('UserService', () => {
  let service: UserService;
  let mockRepository: MockRepository<User>;

  const mockTenantId = '7103268b-9791-46d1-9029-c9481d4a402a';

  beforeEach(async () => {
    mockRepository = createMockRepository<User>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getRepositoryToken(User), useValue: mockRepository },
      ],
    }).compile();

    service = module.get<UserService>(UserService);

    mockedBcrypt.hash.mockResolvedValue('hashed-value' as never);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getTenantUsers', () => {
    it('should return the list of users for the tenant', async () => {
      const users = [buildUser(), buildUser({ id: 'second-id' })];
      mockRepository.find?.mockResolvedValue(users);

      const result = await service.getTenantUsers(mockTenantId);

      expect(mockRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: mockTenantId },
          order: { createdAt: 'DESC' },
        }),
      );
      expect(result).toEqual(users);
    });
  });

  describe('inviteStaff', () => {
    const inviteDto: InviteStaffDto = {
      name: 'New Staff',
      email: 'staff@shop.com',
      password: 'plainPassword123',
      role: UserRole.STAFF,
    };

    it('should create a new staff user and strip sensitive fields from the result', async () => {
      const savedUser = buildUser({
        name: inviteDto.name,
        email: inviteDto.email,
        password: 'hashed-value',
        refreshToken: 'some-refresh-token',
      });

      mockRepository.findOneBy?.mockResolvedValue(null);
      mockRepository.create?.mockReturnValue(savedUser);
      mockRepository.save?.mockResolvedValue(savedUser);

      const result = await service.inviteStaff(mockTenantId, inviteDto);

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({
        email: inviteDto.email,
      });
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(inviteDto.password, 10);
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('refreshToken');
      expect(result).toEqual(
        expect.objectContaining({
          name: savedUser.name,
          email: savedUser.email,
        }),
      );
    });

    it('should throw ConflictException if the email is already in use', async () => {
      mockRepository.findOneBy?.mockResolvedValue(buildUser());

      await expect(
        service.inviteStaff(mockTenantId, inviteDto),
      ).rejects.toThrow(ConflictException);

      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('updateUserRole', () => {
    const adminId = '7103268b-9791-46d1-9029-c9481d4a402b';
    const targetUserId = '7103268b-9791-46d1-9029-c9481d4a402c';
    const updateRoleDto: UpdateRoleDto = { role: UserRole.ADMIN };

    it('should update the role and strip sensitive fields from the result', async () => {
      const targetUser = buildUser({ id: targetUserId, role: UserRole.STAFF });
      const updatedUser = { ...targetUser, role: UserRole.ADMIN };

      mockRepository.findOneBy?.mockResolvedValue(targetUser);
      mockRepository.save?.mockResolvedValue(updatedUser);

      const result = await service.updateUserRole(
        adminId,
        targetUserId,
        mockTenantId,
        updateRoleDto,
      );

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({
        id: targetUserId,
        tenantId: mockTenantId,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ role: UserRole.ADMIN }),
      );
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('refreshToken');
    });

    it('should throw BadRequestException when an admin tries to change their own role', async () => {
      await expect(
        service.updateUserRole(adminId, adminId, mockTenantId, updateRoleDto),
      ).rejects.toThrow(BadRequestException);

      expect(mockRepository.findOneBy).not.toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if the target user does not exist under this tenant', async () => {
      mockRepository.findOneBy?.mockResolvedValue(null);

      await expect(
        service.updateUserRole(
          adminId,
          targetUserId,
          mockTenantId,
          updateRoleDto,
        ),
      ).rejects.toThrow(NotFoundException);

      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('updateUserStatus', () => {
    const adminId = '7103268b-9791-46d1-9029-c9481d4a402b';
    const targetUserId = '7103268b-9791-46d1-9029-c9481d4a402c';
    const updateStatusDto: UpdateStatusDto = { isActive: false };

    it('should update the status and strip sensitive fields from the result', async () => {
      const targetUser = buildUser({ id: targetUserId, isActive: true });
      const updatedUser = { ...targetUser, isActive: false };

      mockRepository.findOneBy?.mockResolvedValue(targetUser);
      mockRepository.save?.mockResolvedValue(updatedUser);

      const result = await service.updateUserStatus(
        adminId,
        targetUserId,
        mockTenantId,
        updateStatusDto,
      );

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: false }),
      );
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('refreshToken');
    });

    it('should throw BadRequestException when an admin tries to change their own status', async () => {
      await expect(
        service.updateUserStatus(
          adminId,
          adminId,
          mockTenantId,
          updateStatusDto,
        ),
      ).rejects.toThrow(BadRequestException);

      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if the target user does not exist under this tenant', async () => {
      mockRepository.findOneBy?.mockResolvedValue(null);

      await expect(
        service.updateUserStatus(
          adminId,
          targetUserId,
          mockTenantId,
          updateStatusDto,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
