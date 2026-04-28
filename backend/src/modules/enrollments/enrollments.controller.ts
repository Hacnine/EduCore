import { Controller, Get, Post, Body, Param, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EnrollmentsService } from './enrollments.service';
import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class EnrollDto {
  @ApiProperty() courseId: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() paymentId?: string;
}

@ApiTags('Enrollments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Enroll in a course' })
  enroll(@Request() req, @Body() dto: EnrollDto) {
    return this.enrollmentsService.enroll(req.user.userId, dto.courseId, dto.paymentId);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get my enrollments' })
  getMyEnrollments(@Request() req) {
    return this.enrollmentsService.getUserEnrollments(req.user.userId);
  }

  @Get(':courseId')
  @ApiOperation({ summary: 'Get enrollment detail for a course' })
  getEnrollment(@Request() req, @Param('courseId') courseId: string) {
    return this.enrollmentsService.getEnrollment(req.user.userId, courseId);
  }

  @Get('course/:courseId/students')
  @ApiOperation({ summary: 'Get students enrolled in a course (instructor only)' })
  getCourseStudents(@Param('courseId') courseId: string, @Request() req) {
    return this.enrollmentsService.getCourseStudents(courseId, req.user.userId);
  }
}
