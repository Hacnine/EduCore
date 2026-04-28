import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TrackEventDto {
  @ApiProperty() @IsString() eventType: string;
  @ApiProperty({ required: false }) @IsOptional() courseId?: string;
  @ApiProperty({ required: false }) @IsOptional() properties?: Record<string, any>;
  @ApiProperty({ required: false }) @IsOptional() sessionId?: string;
}

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async track(
    userId: string | null,
    organizationId: string | null,
    dto: TrackEventDto,
    meta: { ipAddress?: string; userAgent?: string; referrer?: string },
  ) {
    return this.prisma.analyticsEvent.create({
      data: {
        userId,
        organizationId,
        courseId: dto.courseId,
        eventType: dto.eventType,
        properties: dto.properties,
        sessionId: dto.sessionId,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        referrer: meta.referrer,
      },
    });
  }

  async getOrgStats(organizationId: string) {
    const [totalCourses, totalStudents, totalRevenue, totalEnrollments] =
      await this.prisma.$transaction([
        this.prisma.course.count({ where: { organizationId } }),
        this.prisma.organizationMember.count({ where: { organizationId, role: 'STUDENT' } }),
        this.prisma.payment.aggregate({
          where: {
            status: 'COMPLETED',
            courseId: { in: (await this.prisma.course.findMany({ where: { organizationId }, select: { id: true } })).map(c => c.id) },
          },
          _sum: { amount: true },
        }),
        this.prisma.enrollment.count({ where: { course: { organizationId } } }),
      ]);

    return {
      totalCourses,
      totalStudents,
      totalRevenue: totalRevenue._sum?.amount || 0,
      totalEnrollments,
    };
  }

  async getCourseStats(courseId: string) {
    const [enrollments, completions, avgRating, totalRevenue, recentEvents] =
      await this.prisma.$transaction([
        this.prisma.enrollment.count({ where: { courseId } }),
        this.prisma.enrollment.count({ where: { courseId, status: 'COMPLETED' } }),
        this.prisma.review.aggregate({
          where: { courseId, isVisible: true },
          _avg: { rating: true },
        }),
        this.prisma.payment.aggregate({
          where: { courseId, status: 'COMPLETED' },
          _sum: { amount: true },
        }),
        this.prisma.analyticsEvent.findMany({
          where: { courseId },
          orderBy: { createdAt: 'desc' },
          take: 100,
          select: { eventType: true, createdAt: true },
        }),
      ]);

    return {
      enrollments,
      completions,
      completionRate: enrollments > 0 ? (completions / enrollments) * 100 : 0,
      avgRating: avgRating._avg.rating || 0,
      totalRevenue: totalRevenue._sum?.amount || 0,
      recentEvents,
    };
  }
}
