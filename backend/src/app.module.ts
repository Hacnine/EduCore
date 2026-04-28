import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { CoursesModule } from './modules/courses/courses.module';
import { LessonsModule } from './modules/lessons/lessons.module';
import { EnrollmentsModule } from './modules/enrollments/enrollments.module';
import { QuizzesModule } from './modules/quizzes/quizzes.module';
import { AssignmentsModule } from './modules/assignments/assignments.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { CertificatesModule } from './modules/certificates/certificates.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { DiscussionsModule } from './modules/discussions/discussions.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { CategoriesModule } from './modules/categories/categories.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    OrganizationsModule,
    CoursesModule,
    LessonsModule,
    EnrollmentsModule,
    QuizzesModule,
    AssignmentsModule,
    PaymentsModule,
    CertificatesModule,
    ReviewsModule,
    DiscussionsModule,
    NotificationsModule,
    AnalyticsModule,
    CategoriesModule,
  ],
})
export class AppModule {}
