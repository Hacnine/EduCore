import {
  Controller, Get, Post, Body, Param, Request, UseGuards, Headers, Ip,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnalyticsService, TrackEventDto } from './analytics.service';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('track')
  @ApiOperation({ summary: 'Track an analytics event' })
  track(
    @Body() dto: TrackEventDto,
    @Request() req,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
    @Headers('referer') referrer: string,
  ) {
    const userId = req?.user?.userId || null;
    const orgId = dto.properties?.organizationId || null;
    return this.analyticsService.track(userId, orgId, dto, { ipAddress: ip, userAgent, referrer });
  }

  @Get('org/:orgId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get organization-level stats' })
  getOrgStats(@Param('orgId') orgId: string) {
    return this.analyticsService.getOrgStats(orgId);
  }

  @Get('course/:courseId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get course-level stats' })
  getCourseStats(@Param('courseId') courseId: string) {
    return this.analyticsService.getCourseStats(courseId);
  }
}
