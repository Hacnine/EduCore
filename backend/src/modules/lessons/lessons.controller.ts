import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, Request, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LessonsService } from './lessons.service';
import { CreateLessonDto, UpdateLessonDto, UpdateProgressDto } from './dto/lesson.dto';

@ApiTags('Lessons')
@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Post('sections/:sectionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a lesson in a section' })
  create(
    @Param('sectionId') sectionId: string,
    @Request() req,
    @Body() dto: CreateLessonDto,
  ) {
    return this.lessonsService.create(sectionId, req.user.userId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lesson details' })
  findOne(@Param('id') id: string, @Request() req) {
    const userId = req?.user?.userId;
    return this.lessonsService.findOne(id, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a lesson' })
  update(@Param('id') id: string, @Request() req, @Body() dto: UpdateLessonDto) {
    return this.lessonsService.update(id, req.user.userId, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a lesson' })
  remove(@Param('id') id: string, @Request() req) {
    return this.lessonsService.delete(id, req.user.userId);
  }

  @Patch(':id/progress')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update lesson watch progress' })
  updateProgress(@Param('id') id: string, @Request() req, @Body() dto: UpdateProgressDto) {
    return this.lessonsService.updateProgress(id, req.user.userId, dto);
  }
}
