import { Controller, Get, Post, Patch, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QuizzesService } from './quizzes.service';
import { CreateQuizDto, CreateQuizQuestionDto, SubmitQuizDto } from './dto/quiz.dto';

@ApiTags('Quizzes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('quizzes')
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Post('lesson/:lessonId')
  @ApiOperation({ summary: 'Create a quiz for a lesson' })
  createQuiz(@Param('lessonId') lessonId: string, @Request() req, @Body() dto: CreateQuizDto) {
    return this.quizzesService.createQuiz(lessonId, req.user.userId, dto);
  }

  @Post(':quizId/questions')
  @ApiOperation({ summary: 'Add a question to a quiz' })
  addQuestion(
    @Param('quizId') quizId: string,
    @Request() req,
    @Body() dto: CreateQuizQuestionDto,
  ) {
    return this.quizzesService.addQuestion(quizId, req.user.userId, dto);
  }

  @Get(':quizId')
  @ApiOperation({ summary: 'Get quiz with questions (answers hidden for students)' })
  getQuiz(@Param('quizId') quizId: string) {
    return this.quizzesService.getQuiz(quizId);
  }

  @Get(':quizId/instructor')
  @ApiOperation({ summary: 'Get quiz with correct answers (instructor)' })
  getQuizInstructor(@Param('quizId') quizId: string, @Request() req) {
    return this.quizzesService.getQuizForInstructor(quizId, req.user.userId);
  }

  @Patch('questions/:questionId')
  @ApiOperation({ summary: 'Update a quiz question (instructor)' })
  updateQuestion(
    @Param('questionId') questionId: string,
    @Request() req,
    @Body() dto: Partial<CreateQuizQuestionDto>,
  ) {
    return this.quizzesService.updateQuestion(questionId, req.user.userId, dto);
  }

  @Delete('questions/:questionId')
  @ApiOperation({ summary: 'Delete a quiz question (instructor)' })
  deleteQuestion(@Param('questionId') questionId: string, @Request() req) {
    return this.quizzesService.deleteQuestion(questionId, req.user.userId);
  }

  @Post(':quizId/attempts/start')
  @ApiOperation({ summary: 'Start a quiz attempt' })
  startAttempt(@Param('quizId') quizId: string, @Request() req) {
    return this.quizzesService.startAttempt(quizId, req.user.userId);
  }

  @Post('attempts/:attemptId/submit')
  @ApiOperation({ summary: 'Submit a quiz attempt' })
  submitAttempt(
    @Param('attemptId') attemptId: string,
    @Request() req,
    @Body() dto: SubmitQuizDto,
  ) {
    return this.quizzesService.submitAttempt(attemptId, req.user.userId, dto);
  }

  @Get('attempts/:attemptId')
  @ApiOperation({ summary: 'Get full attempt detail with per-question results' })
  getAttemptDetail(@Param('attemptId') attemptId: string, @Request() req) {
    return this.quizzesService.getAttemptDetail(attemptId, req.user.userId);
  }

  @Get(':quizId/attempts/my')
  @ApiOperation({ summary: 'Get my attempt history for a quiz' })
  getAttemptHistory(@Param('quizId') quizId: string, @Request() req) {
    return this.quizzesService.getAttemptHistory(quizId, req.user.userId);
  }
}
