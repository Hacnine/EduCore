import { Controller, Post, Get, Body, Param, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  AssignmentsService,
  CreateAssignmentDto,
  SubmitAssignmentDto,
  GradeSubmissionDto,
} from './assignments.service';

@ApiTags('Assignments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('assignments')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Post('lesson/:lessonId')
  @ApiOperation({ summary: 'Create assignment for a lesson' })
  create(@Param('lessonId') lessonId: string, @Request() req, @Body() dto: CreateAssignmentDto) {
    return this.assignmentsService.create(lessonId, req.user.userId, dto);
  }

  @Get(':assignmentId')
  @ApiOperation({ summary: 'Get assignment details' })
  getAssignment(@Param('assignmentId') id: string) {
    return this.assignmentsService.getAssignment(id);
  }

  @Get(':assignmentId/my-submission')
  @ApiOperation({ summary: 'Get my submission for an assignment' })
  getMySubmission(@Param('assignmentId') id: string, @Request() req) {
    return this.assignmentsService.getMySubmission(id, req.user.userId);
  }

  @Post(':assignmentId/submit')
  @ApiOperation({ summary: 'Submit an assignment' })
  submit(@Param('assignmentId') id: string, @Request() req, @Body() dto: SubmitAssignmentDto) {
    return this.assignmentsService.submit(id, req.user.userId, dto);
  }

  @Post('submissions/:submissionId/grade')
  @ApiOperation({ summary: 'Grade a submission (instructor only)' })
  grade(@Param('submissionId') id: string, @Request() req, @Body() dto: GradeSubmissionDto) {
    return this.assignmentsService.grade(id, req.user.userId, dto);
  }

  @Get(':assignmentId/submissions')
  @ApiOperation({ summary: 'Get all submissions (instructor only)' })
  getSubmissions(@Param('assignmentId') id: string, @Request() req) {
    return this.assignmentsService.getSubmissions(id, req.user.userId);
  }
}
