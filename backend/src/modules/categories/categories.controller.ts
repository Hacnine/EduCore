import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  Request, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CategoriesService, CreateCategoryDto, UpdateCategoryDto } from './categories.service';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'List all categories (optionally filtered by organizationId)' })
  @ApiQuery({ name: 'organizationId', required: false })
  findAll(@Query('organizationId') organizationId?: string) {
    return this.categoriesService.findAll(organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single category with children' })
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a category for an organization' })
  create(@Request() req, @Body() dto: CreateCategoryDto, @Query('organizationId') organizationId: string) {
    return this.categoriesService.create(organizationId, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a category' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
    @Query('organizationId') organizationId: string,
  ) {
    return this.categoriesService.update(id, organizationId, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a category' })
  remove(@Param('id') id: string, @Query('organizationId') organizationId: string) {
    return this.categoriesService.delete(id, organizationId);
  }
}
