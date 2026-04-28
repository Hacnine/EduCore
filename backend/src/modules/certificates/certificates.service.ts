import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CertificatesService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async issue(userId: string, courseId: string, options?: { expiresAt?: string; pdfUrl?: string; metadata?: any }) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (!enrollment || enrollment.status !== 'COMPLETED') {
      throw new NotFoundException('No completed enrollment found for this course');
    }

    const existing = await this.prisma.certificate.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (existing) throw new ConflictException('Certificate already issued');

    const cert = await this.prisma.certificate.create({
      data: {
        userId,
        courseId,
        certificateNumber: `CERT-${uuidv4().toUpperCase().slice(0, 8)}`,
        status: 'ISSUED',
        expiresAt: options?.expiresAt ? new Date(options.expiresAt) : undefined,
        pdfUrl: options?.pdfUrl,
        metadata: options?.metadata,
      },
      include: {
        course: { select: { title: true, instructor: { select: { firstName: true, lastName: true } } } },
        user: { select: { firstName: true, lastName: true } },
      },
    });

    // Notify student
    await this.notifications.create({
      userId,
      type: NotificationType.CERTIFICATE,
      title: 'Certificate Issued!',
      body: `Your certificate for "${cert.course.title}" has been issued. Certificate #${cert.certificateNumber}`,
      metadata: { certificateNumber: cert.certificateNumber, courseId },
    });

    return cert;
  }

  async verify(certificateNumber: string) {
    const cert = await this.prisma.certificate.findUnique({
      where: { certificateNumber },
      include: {
        course: { select: { id: true, title: true } },
        user: { select: { firstName: true, lastName: true } },
      },
    });
    if (!cert) throw new NotFoundException('Certificate not found');
    return cert;
  }

  async getUserCertificates(userId: string) {
    return this.prisma.certificate.findMany({
      where: { userId, status: 'ISSUED' },
      include: {
        course: { select: { id: true, title: true, thumbnailUrl: true } },
      },
      orderBy: { issuedAt: 'desc' },
    });
  }

  async revoke(certificateNumber: string) {
    const cert = await this.prisma.certificate.findUnique({ where: { certificateNumber } });
    if (!cert) throw new NotFoundException('Certificate not found');
    return this.prisma.certificate.update({
      where: { certificateNumber },
      data: { status: 'REVOKED', revokedAt: new Date() },
    });
  }
}
