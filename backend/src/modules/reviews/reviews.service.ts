import {
  Injectable, NotFoundException, ConflictException, BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateReviewDto {
  @ApiProperty() courseId: string;
  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsNumber() @Min(1) @Max(5) @Type(() => Number)
  rating: number;
  @ApiProperty({ required: false }) @IsOptional() @IsString() title?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() body?: string;
}

export class UpdateReviewDto {
  @ApiProperty({ required: false })
  @IsOptional() @IsNumber() @Min(1) @Max(5) @Type(() => Number)
  rating?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsString() title?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() body?: string;
}

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateReviewDto) {
    // Check enrollment
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId: dto.courseId } },
    });
    if (!enrollment) throw new BadRequestException('Must be enrolled to leave a review');

    const existing = await this.prisma.review.findUnique({
      where: { userId_courseId: { userId, courseId: dto.courseId } },
    });
    if (existing) throw new ConflictException('Review already submitted');

    return this.prisma.review.create({
      data: { userId, ...dto },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });
  }

  async getCourseReviews(courseId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [reviews, total] = await this.prisma.$transaction([
      this.prisma.review.findMany({
        where: { courseId, isVisible: true },
        skip,
        take: limit,
        include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.review.count({ where: { courseId, isVisible: true } }),
    ]);

    const avgRating = await this.prisma.review.aggregate({
      where: { courseId, isVisible: true },
      _avg: { rating: true },
    });

    return { reviews, total, avgRating: avgRating._avg.rating, page, limit };
  }

  async update(reviewId: string, userId: string, dto: UpdateReviewDto) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review || review.userId !== userId) throw new NotFoundException('Review not found');
    return this.prisma.review.update({ where: { id: reviewId }, data: dto });
  }

  async delete(reviewId: string, userId: string) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review || review.userId !== userId) throw new NotFoundException('Review not found');
    return this.prisma.review.delete({ where: { id: reviewId } });
  }
}
