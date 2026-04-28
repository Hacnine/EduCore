import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  Request, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CoursesService } from './courses.service';
import { CreateCourseDto, UpdateCourseDto, CreateSectionDto } from './dto/course.dto';

@ApiTags('Courses')
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  @ApiOperation({ summary: 'List published courses' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'instructorId', required: false })
  @ApiQuery({ name: 'level', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(@Query() query: any) {
    return this.coursesService.findAll(query);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get course details by slug' })
  findOne(@Param('slug') slug: string, @Query('orgId') orgId?: string) {
    return this.coursesService.findOne(slug, orgId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new course' })
  create(
    @Request() req,
    @Body() dto: CreateCourseDto,
    @Query('organizationId') organizationId: string,
  ) {
    return this.coursesService.create(req.user.userId, organizationId, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a course' })
  update(@Param('id') id: string, @Request() req, @Body() dto: UpdateCourseDto) {
    return this.coursesService.update(id, req.user.userId, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a course' })
  remove(@Param('id') id: string, @Request() req) {
    return this.coursesService.delete(id, req.user.userId);
  }

  // Sections
  @Post(':courseId/sections')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a course section' })
  createSection(
    @Param('courseId') courseId: string,
    @Request() req,
    @Body() dto: CreateSectionDto,
  ) {
    return this.coursesService.createSection(courseId, req.user.userId, dto);
  }

  @Patch('sections/:sectionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a section' })
  updateSection(
    @Param('sectionId') sectionId: string,
    @Request() req,
    @Body() dto: Partial<CreateSectionDto>,
  ) {
    return this.coursesService.updateSection(sectionId, req.user.userId, dto);
  }

  @Delete('sections/:sectionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a section' })
  deleteSection(@Param('sectionId') sectionId: string, @Request() req) {
    return this.coursesService.deleteSection(sectionId, req.user.userId);
  }
}
