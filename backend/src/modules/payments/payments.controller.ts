import {
  Controller, Post, Get, Patch, Delete, Body, Headers, Request, UseGuards,
  RawBodyRequest, Req, Param,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentsService } from './payments.service';
import {
  IsString, IsOptional, IsNumber, IsEnum, IsDateString, IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class CreateCheckoutDto {
  @ApiProperty() courseId: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() couponCode?: string;
}

export class CreateCouponDto {
  @ApiProperty() @IsString() courseId: string;
  @ApiProperty() @IsString() code: string;
  @ApiProperty({ enum: ['PERCENTAGE', 'FIXED'] })
  @IsEnum(['PERCENTAGE', 'FIXED']) discountType: 'PERCENTAGE' | 'FIXED';
  @ApiProperty() @IsNumber() @Type(() => Number) discountValue: number;
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() @Type(() => Number) maxUses?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsDateString() expiresAt?: string;
}

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Stripe checkout session' })
  createCheckout(@Request() req, @Body() dto: CreateCheckoutDto) {
    return this.paymentsService.createCheckoutSession(req.user.userId, dto.courseId, dto.couponCode);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Stripe webhook endpoint' })
  handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    return this.paymentsService.handleWebhook(signature, req.rawBody as Buffer);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment history' })
  getHistory(@Request() req) {
    return this.paymentsService.getPaymentHistory(req.user.userId);
  }

  // ── Coupon management ──────────────────────────────────────

  @Post('coupons')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a coupon for a course (instructor)' })
  createCoupon(@Request() req, @Body() dto: CreateCouponDto) {
    return this.paymentsService.createCoupon(req.user.userId, dto);
  }

  @Get('coupons/course/:courseId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List coupons for a course (instructor)' })
  listCoupons(@Request() req, @Param('courseId') courseId: string) {
    return this.paymentsService.listCourseCoupons(req.user.userId, courseId);
  }

  @Patch('coupons/:id/deactivate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate a coupon (instructor)' })
  deactivateCoupon(@Request() req, @Param('id') id: string) {
    return this.paymentsService.deactivateCoupon(req.user.userId, id);
  }

  @Delete('coupons/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a coupon (instructor)' })
  deleteCoupon(@Request() req, @Param('id') id: string) {
    return this.paymentsService.deleteCoupon(req.user.userId, id);
  }

  @Get('coupons/validate')
  @ApiOperation({ summary: 'Validate a coupon code for a course' })
  validateCoupon(
    @Req() req: any,
  ) {
    const { code, courseId } = req.query;
    return this.paymentsService.validateCoupon(code, courseId);
  }
}
