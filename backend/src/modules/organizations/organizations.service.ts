import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateOrganizationDto, UpdateOrganizationDto, UpdateSettingsDto,
} from './dto/organization.dto';
import { Role } from '@prisma/client';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateOrganizationDto) {
    const existing = await this.prisma.organization.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) throw new ConflictException('Organization slug already taken');

    const org = await this.prisma.organization.create({
      data: {
        ...dto,
        users: {
          create: { userId, role: Role.ORG_ADMIN },
        },
      },
    });
    return org;
  }

  async findBySlug(slug: string) {
    const org = await this.prisma.organization.findUnique({
      where: { slug },
      include: {
        settings: true,
        _count: { select: { courses: true, users: true } },
      },
    });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async update(orgId: string, userId: string, dto: UpdateOrganizationDto) {
    await this.assertAdmin(orgId, userId);
    return this.prisma.organization.update({
      where: { id: orgId },
      data: dto,
    });
  }

  async getMembers(orgId: string) {
    return this.prisma.organizationMember.findMany({
      where: { organizationId: orgId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
        },
      },
    });
  }

  async addMember(orgId: string, targetUserId: string, role: Role) {
    return this.prisma.organizationMember.upsert({
      where: { userId_organizationId: { userId: targetUserId, organizationId: orgId } },
      create: { userId: targetUserId, organizationId: orgId, role },
      update: { role },
    });
  }

  async removeMember(orgId: string, targetUserId: string, requesterId: string) {
    await this.assertAdmin(orgId, requesterId);
    return this.prisma.organizationMember.delete({
      where: { userId_organizationId: { userId: targetUserId, organizationId: orgId } },
    });
  }

  async updateMemberRole(orgId: string, targetUserId: string, role: Role, requesterId: string) {
    await this.assertAdmin(orgId, requesterId);
    const member = await this.prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId: targetUserId, organizationId: orgId } },
    });
    if (!member) throw new NotFoundException('Member not found');
    return this.prisma.organizationMember.update({
      where: { userId_organizationId: { userId: targetUserId, organizationId: orgId } },
      data: { role },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });
  }

  async getSettings(orgId: string) {
    const settings = await this.prisma.organizationSetting.findUnique({
      where: { organizationId: orgId },
    });
    return settings ?? {};
  }

  async upsertSettings(orgId: string, requesterId: string, dto: UpdateSettingsDto) {
    await this.assertAdmin(orgId, requesterId);
    return this.prisma.organizationSetting.upsert({
      where: { organizationId: orgId },
      create: { organizationId: orgId, ...dto },
      update: dto,
    });
  }

  private async assertAdmin(orgId: string, userId: string) {
    const member = await this.prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId, organizationId: orgId } },
    });
    if (!member || (member.role !== Role.ORG_ADMIN && member.role !== Role.SUPER_ADMIN)) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }
}
