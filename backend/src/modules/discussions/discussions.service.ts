import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DiscussionCategory } from '@prisma/client';

export class CreateDiscussionDto {
  @ApiProperty() @IsString() courseId: string;
  @ApiProperty() @IsString() title: string;
  @ApiProperty() @IsString() body: string;
  @ApiProperty({ enum: DiscussionCategory, default: DiscussionCategory.GENERAL })
  @IsOptional() @IsEnum(DiscussionCategory)
  category?: DiscussionCategory;
}

export class UpdateDiscussionDto {
  @ApiProperty({ required: false }) @IsOptional() @IsString() title?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() body?: string;
}

export class CreateCommentDto {
  @ApiProperty() @IsString() body: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() parentId?: string;
}

@Injectable()
export class DiscussionsService {
  constructor(private prisma: PrismaService) {}

  async createDiscussion(userId: string, dto: CreateDiscussionDto) {
    return this.prisma.discussion.create({
      data: { userId, ...dto },
      include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
    });
  }

  async getCourseDiscussions(courseId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [discussions, total] = await this.prisma.$transaction([
      this.prisma.discussion.findMany({
        where: { courseId },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          _count: { select: { comments: true } },
        },
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.discussion.count({ where: { courseId } }),
    ]);
    return { discussions, total, page, limit };
  }

  async getDiscussion(discussionId: string) {
    const discussion = await this.prisma.discussion.findUnique({
      where: { id: discussionId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        comments: {
          where: { parentId: null },
          include: {
            user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
            replies: {
              include: {
                user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!discussion) throw new NotFoundException('Discussion not found');
    return discussion;
  }

  async updateDiscussion(discussionId: string, userId: string, dto: UpdateDiscussionDto) {
    const discussion = await this.prisma.discussion.findUnique({ where: { id: discussionId } });
    if (!discussion) throw new NotFoundException('Discussion not found');
    if (discussion.userId !== userId) throw new ForbiddenException('You can only edit your own discussions');
    return this.prisma.discussion.update({ where: { id: discussionId }, data: dto });
  }

  async deleteDiscussion(discussionId: string, userId: string) {
    const discussion = await this.prisma.discussion.findUnique({ where: { id: discussionId } });
    if (!discussion) throw new NotFoundException('Discussion not found');
    if (discussion.userId !== userId) throw new ForbiddenException('You can only delete your own discussions');
    return this.prisma.discussion.delete({ where: { id: discussionId } });
  }

  async pinDiscussion(discussionId: string) {
    const discussion = await this.prisma.discussion.findUnique({ where: { id: discussionId } });
    if (!discussion) throw new NotFoundException('Discussion not found');
    return this.prisma.discussion.update({
      where: { id: discussionId },
      data: { isPinned: !discussion.isPinned },
    });
  }

  async resolveDiscussion(discussionId: string, userId: string) {
    const discussion = await this.prisma.discussion.findUnique({ where: { id: discussionId } });
    if (!discussion) throw new NotFoundException('Discussion not found');
    if (discussion.userId !== userId) throw new ForbiddenException('Only the author can resolve this discussion');
    return this.prisma.discussion.update({
      where: { id: discussionId },
      data: { isResolved: !discussion.isResolved },
    });
  }

  async upvoteDiscussion(discussionId: string) {
    const discussion = await this.prisma.discussion.findUnique({ where: { id: discussionId } });
    if (!discussion) throw new NotFoundException('Discussion not found');
    return this.prisma.discussion.update({
      where: { id: discussionId },
      data: { upvotes: { increment: 1 } },
    });
  }

  async addComment(discussionId: string, userId: string, dto: CreateCommentDto) {
    return this.prisma.discussionComment.create({
      data: { discussionId, userId, ...dto },
      include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
    });
  }

  async upvoteComment(commentId: string) {
    const comment = await this.prisma.discussionComment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Comment not found');
    return this.prisma.discussionComment.update({
      where: { id: commentId },
      data: { upvotes: { increment: 1 } },
    });
  }

  async markCommentAsAnswer(commentId: string, userId: string) {
    const comment = await this.prisma.discussionComment.findUnique({
      where: { id: commentId },
      include: { discussion: true },
    });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.discussion.userId !== userId)
      throw new ForbiddenException('Only the discussion author can mark an answer');
    return this.prisma.discussionComment.update({
      where: { id: commentId },
      data: { isAnswer: true },
    });
  }

  async deleteComment(commentId: string, userId: string) {
    const comment = await this.prisma.discussionComment.findUnique({ where: { id: commentId } });
    if (!comment || comment.userId !== userId) throw new ForbiddenException('Not your comment');
    return this.prisma.discussionComment.delete({ where: { id: commentId } });
  }
}
