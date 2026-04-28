import {
  Injectable, NotFoundException, BadRequestException, ForbiddenException, ConflictException,
} from '@nestjs/common';
import { CreateCouponDto } from './payments.controller';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { PaymentStatus, PaymentProvider } from '@prisma/client';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private enrollmentsService: EnrollmentsService,
  ) {
    this.stripe = new Stripe(this.config.get<string>('STRIPE_SECRET_KEY', ''), {
      apiVersion: '2023-10-16',
    });
  }

  async createCheckoutSession(userId: string, courseId: string, couponCode?: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');
    if (course.isFree) throw new BadRequestException('Course is free, use direct enrollment');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    let discountAmount = 0;
    let coupon: Awaited<ReturnType<typeof this.prisma.coupon.findFirst>> = null;
    if (couponCode) {
      coupon = await this.prisma.coupon.findFirst({
        where: { code: couponCode, courseId, isActive: true },
      });
      if (coupon && (!coupon.expiresAt || coupon.expiresAt > new Date())) {
        const price = Number(course.discountPrice || course.price);
        discountAmount =
          coupon.discountType === 'PERCENTAGE'
            ? (price * Number(coupon.discountValue)) / 100
            : Number(coupon.discountValue);
      }
    }

    const basePrice = Number(course.discountPrice || course.price);
    const finalAmount = Math.max(0, basePrice - discountAmount);
    const amountInCents = Math.round(finalAmount * 100);

    // Create pending payment record
    const payment = await this.prisma.payment.create({
      data: {
        userId,
        courseId,
        amount: finalAmount,
        currency: 'USD',
        status: PaymentStatus.PENDING,
        provider: PaymentProvider.STRIPE,
        couponId: coupon?.id,
        discountAmount,
      },
    });

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: course.title,
              images: course.thumbnailUrl ? [course.thumbnailUrl] : [],
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${this.config.get('FRONTEND_URL')}/courses/${course.id}/learn?payment=success`,
      cancel_url: `${this.config.get('FRONTEND_URL')}/courses/${course.id}?payment=cancelled`,
      customer_email: user?.email,
      metadata: { paymentId: payment.id, userId, courseId },
    });

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { providerPaymentId: session.id },
    });

    return { sessionUrl: session.url, sessionId: session.id };
  }

  async handleWebhook(signature: string, rawBody: Buffer) {
    const webhookSecret = this.config.get('STRIPE_WEBHOOK_SECRET');
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch {
      throw new BadRequestException('Invalid webhook signature');
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata as { paymentId: string; userId: string; courseId: string } | null;
      if (!metadata) return { received: true };
      const { paymentId, userId, courseId } = metadata;

      await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.COMPLETED,
          receiptUrl: (session as any).receipt_url ?? null,
        },
      });

      await this.enrollmentsService.enroll(userId, courseId, paymentId);
    }

    return { received: true };
  }

  async getPaymentHistory(userId: string) {
    return this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Coupon management ─────────────────────────────────────────────────────

  async createCoupon(instructorId: string, dto: CreateCouponDto) {
    const course = await this.prisma.course.findUnique({
      where: { id: dto.courseId },
      select: { instructorId: true },
    });
    if (!course) throw new NotFoundException('Course not found');
    if (course.instructorId !== instructorId)
      throw new ForbiddenException('You do not own this course');

    const existing = await this.prisma.coupon.findFirst({ where: { code: dto.code } });
    if (existing) throw new ConflictException('Coupon code already exists');

    return this.prisma.coupon.create({
      data: {
        courseId: dto.courseId,
        code: dto.code.toUpperCase(),
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        maxUses: dto.maxUses,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
    });
  }

  async listCourseCoupons(instructorId: string, courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true },
    });
    if (!course) throw new NotFoundException('Course not found');
    if (course.instructorId !== instructorId)
      throw new ForbiddenException('You do not own this course');

    return this.prisma.coupon.findMany({
      where: { courseId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deactivateCoupon(instructorId: string, couponId: string) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id: couponId },
      include: { course: { select: { instructorId: true } } },
    });
    if (!coupon) throw new NotFoundException('Coupon not found');
    if (coupon.course.instructorId !== instructorId)
      throw new ForbiddenException('You do not own this coupon');

    return this.prisma.coupon.update({ where: { id: couponId }, data: { isActive: false } });
  }

  async deleteCoupon(instructorId: string, couponId: string) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id: couponId },
      include: { course: { select: { instructorId: true } } },
    });
    if (!coupon) throw new NotFoundException('Coupon not found');
    if (coupon.course.instructorId !== instructorId)
      throw new ForbiddenException('You do not own this coupon');

    return this.prisma.coupon.delete({ where: { id: couponId } });
  }

  async validateCoupon(code: string, courseId: string) {
    if (!code || !courseId) throw new BadRequestException('code and courseId are required');
    const coupon = await this.prisma.coupon.findFirst({
      where: { code: code.toUpperCase(), courseId, isActive: true },
    });
    if (!coupon) throw new NotFoundException('Coupon not found or inactive');
    if (coupon.expiresAt && coupon.expiresAt < new Date())
      throw new BadRequestException('Coupon has expired');
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses)
      throw new BadRequestException('Coupon has reached its usage limit');

    return {
      valid: true,
      discountType: coupon.discountType,
      discountValue: Number(coupon.discountValue),
    };
  }
}
