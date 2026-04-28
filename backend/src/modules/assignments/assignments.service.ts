import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IsString, IsOptional, IsNumber, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@prisma/client';

export class CreateAssignmentDto {
  @ApiProperty() @IsString() title: string;
  @ApiProperty() @IsString() instructions: string;
  @ApiProperty({ default: 100 }) @IsOptional() @IsNumber() @Type(() => Number) maxScore?: number;
  @ApiProperty({ required: false }) @IsOptional() dueDate?: string;
  @ApiProperty({ default: true }) @IsOptional() allowLateSubmission?: boolean;
}

export class SubmitAssignmentDto {
  @ApiProperty({ required: false }) @IsOptional() @IsString() content?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsArray() @IsString({ each: true }) fileUrls?: string[];
}

export class GradeSubmissionDto {
  @ApiProperty() @IsNumber() @Type(() => Number) score: number;
  @ApiProperty({ required: false }) @IsOptional() @IsString() feedback?: string;
}

@Injectable()
export class AssignmentsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async create(lessonId: string, instructorId: string, dto: CreateAssignmentDto) {
    await this.assertLessonOwner(lessonId, instructorId);
    return this.prisma.assignment.create({
      data: {
        ...dto,
        lessonId,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
    });
  }

  async getAssignment(assignmentId: string) {
    const assignment = await this.prisma.assignment.findUnique({ where: { id: assignmentId } });
    if (!assignment) throw new NotFoundException('Assignment not found');
    return assignment;
  }

  async getMySubmission(assignmentId: string, userId: string) {
    const submission = await this.prisma.assignmentSubmission.findUnique({
      where: { assignmentId_userId: { assignmentId, userId } },
    });
    if (!submission) throw new NotFoundException('No submission found');
    return submission;
  }

  async submit(assignmentId: string, userId: string, dto: SubmitAssignmentDto) {
    const assignment = await this.prisma.assignment.findUnique({ where: { id: assignmentId } });
    if (!assignment) throw new NotFoundException('Assignment not found');

    // Check due date
    if (assignment.dueDate && new Date() > assignment.dueDate) {
      if (!assignment.allowLateSubmission) {
        throw new BadRequestException('Assignment due date has passed and late submissions are not allowed');
      }
    }

    return this.prisma.assignmentSubmission.upsert({
      where: { assignmentId_userId: { assignmentId, userId } },
      create: { assignmentId, userId, ...dto, status: 'SUBMITTED', submittedAt: new Date() },
      update: { ...dto, status: 'SUBMITTED', submittedAt: new Date() },
    });
  }

  async grade(submissionId: string, instructorId: string, dto: GradeSubmissionDto) {
    const submission = await this.prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
          include: { lesson: { include: { section: { include: { course: true } } } } },
        },
      },
    });
    if (!submission) throw new NotFoundException('Submission not found');
    if (submission.assignment.lesson.section.course.instructorId !== instructorId) {
      throw new ForbiddenException('Not the course owner');
    }

    const graded = await this.prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: { ...dto, status: 'GRADED', gradedAt: new Date() },
    });

    // Notify student
    await this.notifications.create({
      userId: submission.userId,
      type: NotificationType.ASSIGNMENT_GRADED,
      title: 'Assignment Graded',
      body: `Your submission for "${submission.assignment.title}" has been graded. Score: ${dto.score}`,
      metadata: { submissionId, score: dto.score, feedback: dto.feedback },
    });

    return graded;
  }

  async getSubmissions(assignmentId: string, instructorId: string) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { lesson: { include: { section: { include: { course: true } } } } },
    });
    if (!assignment || assignment.lesson.section.course.instructorId !== instructorId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.assignmentSubmission.findMany({
      where: { assignmentId },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
      orderBy: { submittedAt: 'desc' },
    });
  }

  private async assertLessonOwner(lessonId: string, instructorId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { section: { include: { course: true } } },
    });
    if (!lesson || lesson.section.course.instructorId !== instructorId) {
      throw new ForbiddenException('Not the course owner');
    }
  }
}
