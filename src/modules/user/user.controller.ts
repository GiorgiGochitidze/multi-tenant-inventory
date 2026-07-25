import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorator/roles.decorator';
import { CurrentUser } from '../auth/decorator/current-user.decorator';
import { CurrentTenant } from '../auth/decorator/current-tenant.decorator';
import { UserRole } from './entity/User.entity';
import { InviteStaffDto } from './dto/invite-staff.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { UserResponseDto } from './dto/user-response.dto';
import type { JwtPayload } from '../auth/strategies/jwt.strategy';

@ApiTags('User Management')
@ApiCookieAuth('access_token')
@Controller('users')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: 'List all users for the active tenant' })
  async getTenantUsers(
    @CurrentTenant() tenantId: string,
  ): Promise<UserResponseDto[]> {
    return await this.userService.getTenantUsers(tenantId);
  }

  @Post('invite')
  @ApiOperation({ summary: 'Invite a new staff member or admin' })
  @ApiConflictResponse({ description: 'A user with this email already exists' })
  async inviteStaff(
    @CurrentTenant() tenantId: string,
    @Body() dto: InviteStaffDto,
  ): Promise<UserResponseDto> {
    return await this.userService.inviteStaff(tenantId, dto);
  }

  @Patch(':userId/role')
  @ApiOperation({ summary: 'Update role for the given user ID' })
  @ApiBadRequestResponse({ description: 'You cannot change your own role' })
  @ApiNotFoundResponse({ description: 'User not found under this tenant' })
  async updateUserRole(
    @CurrentUser() user: JwtPayload,
    @CurrentTenant() tenantId: string,
    @Param('userId') targetUserId: string,
    @Body() dto: UpdateRoleDto,
  ): Promise<UserResponseDto> {
    return await this.userService.updateUserRole(
      user.id,
      targetUserId,
      tenantId,
      dto,
    );
  }

  @Patch(':userId/status')
  @ApiOperation({ summary: 'Activate or deactivate a staff account' })
  @ApiBadRequestResponse({ description: 'You cannot change your own status' })
  @ApiNotFoundResponse({ description: 'User not found under this tenant' })
  async updateUserStatus(
    @CurrentUser() user: JwtPayload,
    @CurrentTenant() tenantId: string,
    @Param('userId') targetUserId: string,
    @Body() dto: UpdateStatusDto,
  ): Promise<UserResponseDto> {
    return await this.userService.updateUserStatus(
      user.id,
      targetUserId,
      tenantId,
      dto,
    );
  }
}
