import {
  Injectable, NotFoundException, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateQuizDto, CreateQuizQuestionDto, SubmitQuizDto } from './dto/quiz.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class QuizzesService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async createQuiz(lessonId: string, instructorId: string, dto: CreateQuizDto) {
    await this.assertLessonOwner(lessonId, instructorId);
    return this.prisma.quiz.create({ data: { ...dto, lessonId } });
  }

  async addQuestion(quizId: string, instructorId: string, dto: CreateQuizQuestionDto) {
    await this.assertQuizOwner(quizId, instructorId);
    const { options, ...questionData } = dto;
    return this.prisma.quizQuestion.create({
      data: {
        ...questionData,
        quizId,
        options: { create: options },
      },
      include: { options: true },
    });
  }

  async getQuiz(quizId: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          orderBy: { position: 'asc' },
          include: { options: { orderBy: { position: 'asc' } } },
        },
      },
    });
    if (!quiz) throw new NotFoundException('Quiz not found');

    let questions = quiz.questions;
    if (quiz.shuffleQuestions) {
      questions = [...questions].sort(() => Math.random() - 0.5);
    }

    // Hide isCorrect from students
    return {
      ...quiz,
      questions: questions.map((q) => ({
        ...q,
        options: q.options.map(({ isCorrect: _, ...opt }) => opt),
      })),
    };
  }

  async getQuizForInstructor(quizId: string, instructorId: string) {
    await this.assertQuizOwner(quizId, instructorId);
    return this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          orderBy: { position: 'asc' },
          include: { options: { orderBy: { position: 'asc' } } },
        },
      },
    });
  }

  async updateQuestion(questionId: string, instructorId: string, dto: Partial<CreateQuizQuestionDto>) {
    const question = await this.prisma.quizQuestion.findUnique({
      where: { id: questionId },
      include: { quiz: true },
    });
    if (!question) throw new NotFoundException('Question not found');
    await this.assertQuizOwner(question.quizId, instructorId);

    const { options, ...questionData } = dto as any;
    const updated = await this.prisma.quizQuestion.update({
      where: { id: questionId },
      data: questionData,
    });
    if (options) {
      await this.prisma.quizQuestionOption.deleteMany({ where: { questionId } });
      await this.prisma.quizQuestionOption.createMany({
        data: options.map((o: any) => ({ ...o, questionId })),
      });
    }
    return this.prisma.quizQuestion.findUnique({
      where: { id: questionId },
      include: { options: true },
    });
  }

  async deleteQuestion(questionId: string, instructorId: string) {
    const question = await this.prisma.quizQuestion.findUnique({ where: { id: questionId } });
    if (!question) throw new NotFoundException('Question not found');
    await this.assertQuizOwner(question.quizId, instructorId);
    return this.prisma.quizQuestion.delete({ where: { id: questionId } });
  }

  async getAttemptDetail(attemptId: string, userId: string) {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        responses: {
          include: {
            question: { include: { options: { orderBy: { position: 'asc' } } } },
          },
        },
      },
    });
    if (!attempt) throw new NotFoundException('Attempt not found');
    if (attempt.userId !== userId) throw new ForbiddenException('Not your attempt');
    return attempt;
  }

  async startAttempt(quizId: string, userId: string) {
    const quiz = await this.prisma.quiz.findUnique({ where: { id: quizId } });
    if (!quiz) throw new NotFoundException('Quiz not found');

    if (quiz.maxAttempts) {
      const count = await this.prisma.quizAttempt.count({ where: { quizId, userId } });
      if (count >= quiz.maxAttempts) {
        throw new BadRequestException('Maximum attempts reached');
      }
    }

    return this.prisma.quizAttempt.create({ data: { quizId, userId } });
  }

  async submitAttempt(attemptId: string, userId: string, dto: SubmitQuizDto) {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: { include: { questions: { include: { options: true } } } },
      },
    });
    if (!attempt) throw new NotFoundException('Attempt not found');
    if (attempt.userId !== userId) throw new ForbiddenException('Not your attempt');
    if (attempt.submittedAt) throw new BadRequestException('Attempt already submitted');

    const questionMap = new Map(attempt.quiz.questions.map((q) => [q.id, q]));
    let totalPoints = 0;
    let earnedPoints = 0;
    const responses: Array<{
      attemptId: string;
      questionId: string;
      selectedOptionIds: string[];
      textAnswer: string | undefined;
      isCorrect: boolean | null;
      pointsEarned: number;
    }> = [];

    for (const response of dto.responses) {
      const question = questionMap.get(response.questionId);
      if (!question) continue;
      totalPoints += question.points;

      let isCorrect: boolean | null = false;
      let pointsEarned = 0;

      if (question.type === 'SHORT_ANSWER') {
        // Requires manual grading — mark as pending
        isCorrect = null;
      } else {
        const correctIds = question.options.filter((o) => o.isCorrect).map((o) => o.id);
        const selectedIds = response.selectedOptionIds || [];
        isCorrect =
          correctIds.length === selectedIds.length &&
          correctIds.every((id) => selectedIds.includes(id));
        pointsEarned = isCorrect ? question.points : 0;
        earnedPoints += pointsEarned;
      }

      responses.push({
        attemptId,
        questionId: response.questionId,
        selectedOptionIds: response.selectedOptionIds || [],
        textAnswer: response.textAnswer,
        isCorrect,
        pointsEarned,
      });
    }

    const score = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
    const isPassed = score >= attempt.quiz.passingScore;
    const timeTaken = Math.floor((Date.now() - attempt.startedAt.getTime()) / 1000);

    await this.prisma.$transaction([
      this.prisma.quizAttemptResponse.createMany({ data: responses }),
      this.prisma.quizAttempt.update({
        where: { id: attemptId },
        data: { score, isPassed, submittedAt: new Date(), timeTaken },
      }),
    ]);

    // Notify student of quiz result
    await this.notifications.create({
      userId,
      type: NotificationType.COURSE_UPDATE,
      title: isPassed ? 'Quiz Passed!' : 'Quiz Submitted',
      body: `You scored ${Math.round(score)}% on the quiz. ${isPassed ? 'Congratulations!' : 'Keep practicing!'}`,
      metadata: { attemptId, score, isPassed },
    });

    return { score, isPassed, timeTaken };
  }

  async getAttemptHistory(quizId: string, userId: string) {
    return this.prisma.quizAttempt.findMany({
      where: { quizId, userId },
      include: { responses: true },
      orderBy: { startedAt: 'desc' },
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

  private async assertQuizOwner(quizId: string, instructorId: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: { lesson: { include: { section: { include: { course: true } } } } },
    });
    if (!quiz || quiz.lesson.section.course.instructorId !== instructorId) {
      throw new ForbiddenException('Not the course owner');
    }
  }
}
