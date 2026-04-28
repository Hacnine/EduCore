import { Controller, Get, Post, Patch, Body, Param, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CertificatesService } from './certificates.service';

@ApiTags('Certificates')
@Controller('certificates')
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @Post('issue')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Issue certificate for a completed course' })
  issue(
    @Request() req,
    @Body() body: { courseId: string; expiresAt?: string; pdfUrl?: string; metadata?: any },
  ) {
    return this.certificatesService.issue(req.user.userId, body.courseId, {
      expiresAt: body.expiresAt,
      pdfUrl: body.pdfUrl,
      metadata: body.metadata,
    });
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my certificates' })
  getMyCertificates(@Request() req) {
    return this.certificatesService.getUserCertificates(req.user.userId);
  }

  @Get('verify/:certificateNumber')
  @ApiOperation({ summary: 'Publicly verify a certificate' })
  verify(@Param('certificateNumber') certNumber: string) {
    return this.certificatesService.verify(certNumber);
  }

  @Patch(':certificateNumber/revoke')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke a certificate (admin)' })
  revoke(@Param('certificateNumber') certNumber: string) {
    return this.certificatesService.revoke(certNumber);
  }
}
