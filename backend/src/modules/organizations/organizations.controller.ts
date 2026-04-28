import {
  Controller, Get, Post, Patch, Delete, Body, Param, Request, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto, UpdateOrganizationDto, UpdateSettingsDto } from './dto/organization.dto';
import { Role } from '@prisma/client';
import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class UpdateRoleDto {
  @ApiProperty({ enum: Role }) @IsEnum(Role) role: Role;
}

@ApiTags('Organizations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly orgsService: OrganizationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new organization' })
  create(@Request() req, @Body() dto: CreateOrganizationDto) {
    return this.orgsService.create(req.user.userId, dto);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get organization by slug' })
  findOne(@Param('slug') slug: string) {
    return this.orgsService.findBySlug(slug);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update organization' })
  update(@Param('id') id: string, @Request() req, @Body() dto: UpdateOrganizationDto) {
    return this.orgsService.update(id, req.user.userId, dto);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'List organization members' })
  getMembers(@Param('id') id: string) {
    return this.orgsService.getMembers(id);
  }

  @Patch(':id/members/:userId/role')
  @ApiOperation({ summary: 'Update a member role' })
  updateMemberRole(
    @Param('id') id: string,
    @Param('userId') targetUserId: string,
    @Body() dto: UpdateRoleDto,
    @Request() req,
  ) {
    return this.orgsService.updateMemberRole(id, targetUserId, dto.role, req.user.userId);
  }

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: 'Remove a member from organization' })
  removeMember(
    @Param('id') id: string,
    @Param('userId') targetUserId: string,
    @Request() req,
  ) {
    return this.orgsService.removeMember(id, targetUserId, req.user.userId);
  }

  @Get(':id/settings')
  @ApiOperation({ summary: 'Get organization settings' })
  getSettings(@Param('id') id: string) {
    return this.orgsService.getSettings(id);
  }

  @Patch(':id/settings')
  @ApiOperation({ summary: 'Upsert organization settings' })
  upsertSettings(@Param('id') id: string, @Request() req, @Body() dto: UpdateSettingsDto) {
    return this.orgsService.upsertSettings(id, req.user.userId, dto);
  }
}
