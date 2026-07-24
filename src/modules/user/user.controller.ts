import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
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

@Controller('users')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getTenantUsers(@CurrentTenant() tenantId: string) {
    return await this.userService.getTenantUsers(tenantId);
  }

  @Post('invite')
  async inviteStaff(
    @CurrentTenant() tenantId: string,
    @Body() dto: InviteStaffDto,
  ) {
    return await this.userService.inviteStaff(tenantId, dto);
  }

  @Patch(':userId/role')
  async updateUserRole(
    @CurrentUser('id') adminId: string,
    @CurrentTenant() tenantId: string,
    @Param('userId') targetUserId: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return await this.userService.updateUserRole(
      adminId,
      targetUserId,
      tenantId,
      dto,
    );
  }

  @Patch(':userId/status')
  async updateUserStatus(
    @CurrentUser('id') adminId: string,
    @CurrentTenant() tenantId: string,
    @Param('userId') targetUserId: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return await this.userService.updateUserStatus(
      adminId,
      targetUserId,
      tenantId,
      dto,
    );
  }
}
