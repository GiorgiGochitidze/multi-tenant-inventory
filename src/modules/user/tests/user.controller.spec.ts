import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from '../user.controller';
import { UserService } from '../user.service';
import { UserRole } from '../entity/User.entity';
import { UserResponseDto } from '../dto/user-response.dto';
import { InviteStaffDto } from '../dto/invite-staff.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { UpdateStatusDto } from '../dto/update-status.dto';
import type { JwtPayload } from '../../auth/strategies/jwt.strategy';

describe('UserController', () => {
  let controller: UserController;
  let mockUserService: Partial<Record<keyof UserService, jest.Mock>>;

  const mockTenantId = '7103268b-9791-46d1-9029-c9481d4a402a';
  const mockAdminUser = {
    id: 'admin-id-1',
    email: 'admin@shop.com',
  } as JwtPayload;

  const mockUserResponse = {
    id: 'target-id-1',
    name: 'Some Staff',
    email: 'staff@shop.com',
    role: UserRole.STAFF,
    isActive: true,
    tenantId: mockTenantId,
  } as UserResponseDto;

  beforeEach(async () => {
    mockUserService = {
      getTenantUsers: jest.fn(),
      inviteStaff: jest.fn(),
      updateUserRole: jest.fn(),
      updateUserStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: mockUserService }],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getTenantUsers', () => {
    it('should call userService.getTenantUsers with the resolved tenantId', async () => {
      const users = [mockUserResponse];
      mockUserService.getTenantUsers?.mockResolvedValue(users);

      const result = await controller.getTenantUsers(mockTenantId);

      expect(mockUserService.getTenantUsers).toHaveBeenCalledWith(mockTenantId);
      expect(result).toEqual(users);
    });
  });

  describe('inviteStaff', () => {
    it('should call userService.inviteStaff with tenantId and the dto', async () => {
      const dto: InviteStaffDto = {
        name: 'New Staff',
        email: 'staff@shop.com',
        password: 'plainPassword123',
        role: UserRole.STAFF,
      };
      mockUserService.inviteStaff?.mockResolvedValue(mockUserResponse);

      const result = await controller.inviteStaff(mockTenantId, dto);

      expect(mockUserService.inviteStaff).toHaveBeenCalledWith(
        mockTenantId,
        dto,
      );
      expect(result).toEqual(mockUserResponse);
    });
  });

  describe('updateUserRole', () => {
    it('should call userService.updateUserRole with adminId, targetUserId, tenantId, and dto', async () => {
      const dto: UpdateRoleDto = { role: UserRole.ADMIN };
      mockUserService.updateUserRole?.mockResolvedValue(mockUserResponse);

      const result = await controller.updateUserRole(
        mockAdminUser,
        mockTenantId,
        'target-id-1',
        dto,
      );

      expect(mockUserService.updateUserRole).toHaveBeenCalledWith(
        mockAdminUser.id,
        'target-id-1',
        mockTenantId,
        dto,
      );
      expect(result).toEqual(mockUserResponse);
    });
  });

  describe('updateUserStatus', () => {
    it('should call userService.updateUserStatus with adminId, targetUserId, tenantId, and dto', async () => {
      const dto: UpdateStatusDto = { isActive: false };
      mockUserService.updateUserStatus?.mockResolvedValue(mockUserResponse);

      const result = await controller.updateUserStatus(
        mockAdminUser,
        mockTenantId,
        'target-id-1',
        dto,
      );

      expect(mockUserService.updateUserStatus).toHaveBeenCalledWith(
        mockAdminUser.id,
        'target-id-1',
        mockTenantId,
        dto,
      );
      expect(result).toEqual(mockUserResponse);
    });
  });
});
