import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, Request, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  DiscussionsService, CreateDiscussionDto, CreateCommentDto, UpdateDiscussionDto,
} from './discussions.service';

@ApiTags('Discussions')
@Controller('discussions')
export class DiscussionsController {
  constructor(private readonly discussionsService: DiscussionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a discussion' })
  create(@Request() req, @Body() dto: CreateDiscussionDto) {
    return this.discussionsService.createDiscussion(req.user.userId, dto);
  }

  @Get('course/:courseId')
  @ApiOperation({ summary: 'List discussions for a course' })
  getCourseDiscussions(
    @Param('courseId') courseId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.discussionsService.getCourseDiscussions(courseId, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get discussion with comments' })
  getOne(@Param('id') id: string) {
    return this.discussionsService.getDiscussion(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Edit own discussion' })
  update(@Param('id') id: string, @Request() req, @Body() dto: UpdateDiscussionDto) {
    return this.discussionsService.updateDiscussion(id, req.user.userId, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete own discussion' })
  remove(@Param('id') id: string, @Request() req) {
    return this.discussionsService.deleteDiscussion(id, req.user.userId);
  }

  @Patch(':id/pin')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle pin a discussion (instructor/admin)' })
  pin(@Param('id') id: string) {
    return this.discussionsService.pinDiscussion(id);
  }

  @Patch(':id/resolve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle resolve a discussion (author)' })
  resolve(@Param('id') id: string, @Request() req) {
    return this.discussionsService.resolveDiscussion(id, req.user.userId);
  }

  @Post(':id/upvote')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upvote a discussion' })
  upvote(@Param('id') id: string) {
    return this.discussionsService.upvoteDiscussion(id);
  }

  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a comment to a discussion' })
  addComment(@Param('id') id: string, @Request() req, @Body() dto: CreateCommentDto) {
    return this.discussionsService.addComment(id, req.user.userId, dto);
  }

  @Post('comments/:commentId/upvote')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upvote a comment' })
  upvoteComment(@Param('commentId') commentId: string) {
    return this.discussionsService.upvoteComment(commentId);
  }

  @Patch('comments/:commentId/answer')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark a comment as the answer (discussion author)' })
  markAnswer(@Param('commentId') commentId: string, @Request() req) {
    return this.discussionsService.markCommentAsAnswer(commentId, req.user.userId);
  }

  @Delete('comments/:commentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a comment' })
  deleteComment(@Param('commentId') commentId: string, @Request() req) {
    return this.discussionsService.deleteComment(commentId, req.user.userId);
  }
}
