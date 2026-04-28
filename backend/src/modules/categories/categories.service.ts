import {
  Injectable, NotFoundException, ConflictException, ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  IsString, IsOptional, MaxLength, MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty() @IsString() @MinLength(2) @MaxLength(100) name: string;
  @ApiProperty() @IsString() @MinLength(2) @MaxLength(100) slug: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() description?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() iconUrl?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() parentId?: string;
}

export class UpdateCategoryDto {
  @ApiProperty({ required: false }) @IsOptional() @IsString() name?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() description?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() iconUrl?: string;
}

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  /** Create a category scoped to an org (or global if no org) */
  async create(organizationId: string, dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findUnique({
      where: { slug_organizationId: { slug: dto.slug, organizationId } },
    });
    if (existing) throw new ConflictException('Category slug already exists in this organization');

    if (dto.parentId) {
      const parent = await this.prisma.category.findUnique({ where: { id: dto.parentId } });
      if (!parent) throw new NotFoundException('Parent category not found');
    }

    return this.prisma.category.create({
      data: { ...dto, organizationId },
      include: { parent: { select: { id: true, name: true } }, _count: { select: { courses: true } } },
    });
  }

  /** List all categories for an org (tree-structured, parents first) */
  async findAll(organizationId?: string) {
    return this.prisma.category.findMany({
      where: {
        organizationId: organizationId ?? null,
        parentId: null, // only top-level; sub-categories returned via children
      },
      include: {
        children: {
          include: {
            _count: { select: { courses: true } },
          },
          orderBy: { name: 'asc' },
        },
        _count: { select: { courses: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const cat = await this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        children: { include: { _count: { select: { courses: true } } } },
        _count: { select: { courses: true } },
      },
    });
    if (!cat) throw new NotFoundException('Category not found');
    return cat;
  }

  async update(id: string, organizationId: string, dto: UpdateCategoryDto) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('Category not found');
    if (cat.organizationId !== organizationId)
      throw new ForbiddenException('Category does not belong to your organization');
    return this.prisma.category.update({ where: { id }, data: dto });
  }

  async delete(id: string, organizationId: string) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('Category not found');
    if (cat.organizationId !== organizationId)
      throw new ForbiddenException('Category does not belong to your organization');
    return this.prisma.category.delete({ where: { id } });
  }
}
