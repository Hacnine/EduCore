import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, Request, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReviewsService, CreateReviewDto, UpdateReviewDto } from './reviews.service';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit a course review' })
  create(@Request() req, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(req.user.userId, dto);
  }

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Get reviews for a course' })
  getCourseReviews(
    @Param('courseId') courseId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.reviewsService.getCourseReviews(courseId, page, limit);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update your review' })
  update(@Param('id') id: string, @Request() req, @Body() dto: UpdateReviewDto) {
    return this.reviewsService.update(id, req.user.userId, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete your review' })
  remove(@Param('id') id: string, @Request() req) {
    return this.reviewsService.delete(id, req.user.userId);
  }
}
