import {
  Injectable, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLessonDto, UpdateLessonDto, UpdateProgressDto } from './dto/lesson.dto';

@Injectable()
export class LessonsService {
  constructor(private prisma: PrismaService) {}

  async create(sectionId: string, instructorId: string, dto: CreateLessonDto) {
    await this.assertSectionOwner(sectionId, instructorId);
    const lesson = await this.prisma.lesson.create({ data: { ...dto, sectionId } });
    // Update course lesson count
    const section = await this.prisma.courseSection.findUnique({ where: { id: sectionId } });
    if (!section) throw new NotFoundException('Section not found');
    await this.prisma.course.update({
      where: { id: section.courseId },
      data: { totalLessons: { increment: 1 } },
    });
    return lesson;
  }

  async findOne(lessonId: string, userId?: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        section: { select: { courseId: true, title: true } },
        quiz: { include: { questions: { include: { options: true } } } },
        assignment: true,
      },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');

    let progress: Awaited<ReturnType<typeof this.prisma.lessonProgress.findUnique>> = null;
    if (userId) {
      progress = await this.prisma.lessonProgress.findUnique({
        where: { userId_lessonId: { userId, lessonId } },
      });
    }
    return { ...lesson, progress };
  }

  async update(lessonId: string, instructorId: string, dto: UpdateLessonDto) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundException('Lesson not found');
    await this.assertSectionOwner(lesson.sectionId, instructorId);
    return this.prisma.lesson.update({ where: { id: lessonId }, data: dto });
  }

  async delete(lessonId: string, instructorId: string) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundException('Lesson not found');
    await this.assertSectionOwner(lesson.sectionId, instructorId);
    const section = await this.prisma.courseSection.findUnique({ where: { id: lesson.sectionId } });
    if (!section) throw new NotFoundException('Section not found');
    await this.prisma.lesson.delete({ where: { id: lessonId } });
    await this.prisma.course.update({
      where: { id: section.courseId },
      data: { totalLessons: { decrement: 1 } },
    });
    return { message: 'Lesson deleted' };
  }

  async updateProgress(lessonId: string, userId: string, dto: UpdateProgressDto) {
    const data: any = { watchedSeconds: dto.watchedSeconds };
    if (dto.isCompleted) {
      data.isCompleted = true;
      data.completedAt = new Date();
    }

    const progress = await this.prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: { userId, lessonId, ...data },
      update: data,
    });

    // Recalculate enrollment progress
    if (dto.isCompleted) {
      await this.recalculateProgress(userId, lessonId);
    }
    return progress;
  }

  private async recalculateProgress(userId: string, lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { section: true },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');
    const courseId = lesson.section.courseId;

    const [totalLessons, completedLessons] = await this.prisma.$transaction([
      this.prisma.lesson.count({ where: { section: { courseId } } }),
      this.prisma.lessonProgress.count({
        where: { userId, isCompleted: true, lesson: { section: { courseId } } },
      }),
    ]);

    const progress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

    await this.prisma.enrollment.updateMany({
      where: { userId, courseId },
      data: {
        progress,
        ...(progress >= 100 ? { status: 'COMPLETED', completedAt: new Date() } : {}),
      },
    });
  }

  private async assertSectionOwner(sectionId: string, instructorId: string) {
    const section = await this.prisma.courseSection.findUnique({
      where: { id: sectionId },
      include: { course: true },
    });
    if (!section) throw new NotFoundException('Section not found');
    if (section.course.instructorId !== instructorId)
      throw new ForbiddenException('Not the course owner');
  }
}
