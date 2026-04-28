import {
  Injectable, NotFoundException, ForbiddenException, ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCourseDto, UpdateCourseDto, CreateSectionDto } from './dto/course.dto';
import { CourseStatus } from '@prisma/client';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async create(instructorId: string, organizationId: string, dto: CreateCourseDto) {
    const existing = await this.prisma.course.findUnique({
      where: { slug_organizationId: { slug: dto.slug, organizationId } },
    });
    if (existing) throw new ConflictException('Course slug already exists in this organization');

    return this.prisma.course.create({
      data: { ...dto, instructorId, organizationId },
    });
  }

  async findAll(query: {
    organizationId?: string;
    categoryId?: string;
    instructorId?: string;
    search?: string;
    level?: string;
    isFree?: boolean;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const {
      organizationId, categoryId, instructorId, search, level, isFree, status, page = 1, limit = 20,
    } = query;
    const skip = (page - 1) * limit;

    // If instructor queries their own courses, skip status=PUBLISHED restriction
    const where: any = instructorId
      ? { instructorId }
      : { status: status ?? CourseStatus.PUBLISHED };
    if (organizationId) where.organizationId = organizationId;
    if (categoryId) where.categoryId = categoryId;
    if (level) where.level = level;
    if (isFree !== undefined) where.isFree = isFree;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
      ];
    }

    const [courses, total] = await this.prisma.$transaction([
      this.prisma.course.findMany({
        where,
        skip,
        take: limit,
        include: {
          instructor: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          category: { select: { id: true, name: true, slug: true } },
          _count: { select: { enrollments: true, reviews: true } },
          reviews: {
            where: { isVisible: true },
            select: { rating: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.course.count({ where }),
    ]);

    const enriched = courses.map((c) => {
      const { reviews, ...rest } = c as any;
      const avgRating =
        reviews.length > 0
          ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
          : 0;
      return { ...rest, averageRating: Math.round(avgRating * 10) / 10 };
    });

    return { courses: enriched, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(slug: string, organizationId?: string) {
    const where: any = { status: CourseStatus.PUBLISHED };
    if (organizationId) {
      where.slug_organizationId = { slug, organizationId };
    } else {
      where.slug = slug;
    }

    const course = await this.prisma.course.findFirst({
      where: { slug, ...(organizationId ? { organizationId } : {}) },
      include: {
        instructor: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, bio: true } },
        category: true,
        sections: {
          orderBy: { position: 'asc' },
          include: {
            lessons: {
              orderBy: { position: 'asc' },
              select: {
                id: true, title: true, type: true, duration: true,
                isFree: true, position: true,
              },
            },
          },
        },
        _count: { select: { enrollments: true, reviews: true } },
      },
    });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  async update(courseId: string, instructorId: string, dto: UpdateCourseDto) {
    await this.assertOwner(courseId, instructorId);
    const data: any = { ...dto };
    if (dto.status === CourseStatus.PUBLISHED) {
      data.publishedAt = new Date();
    }
    return this.prisma.course.update({ where: { id: courseId }, data });
  }

  async delete(courseId: string, instructorId: string) {
    await this.assertOwner(courseId, instructorId);
    return this.prisma.course.delete({ where: { id: courseId } });
  }

  // Sections
  async createSection(courseId: string, instructorId: string, dto: CreateSectionDto) {
    await this.assertOwner(courseId, instructorId);
    return this.prisma.courseSection.create({ data: { ...dto, courseId } });
  }

  async updateSection(sectionId: string, instructorId: string, data: Partial<CreateSectionDto>) {
    const section = await this.prisma.courseSection.findUnique({
      where: { id: sectionId }, include: { course: true },
    });
    if (!section) throw new NotFoundException('Section not found');
    await this.assertOwner(section.courseId, instructorId);
    return this.prisma.courseSection.update({ where: { id: sectionId }, data });
  }

  async deleteSection(sectionId: string, instructorId: string) {
    const section = await this.prisma.courseSection.findUnique({ where: { id: sectionId } });
    if (!section) throw new NotFoundException('Section not found');
    await this.assertOwner(section.courseId, instructorId);
    return this.prisma.courseSection.delete({ where: { id: sectionId } });
  }

  private async assertOwner(courseId: string, instructorId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');
    if (course.instructorId !== instructorId) throw new ForbiddenException('Not the course owner');
  }
}
