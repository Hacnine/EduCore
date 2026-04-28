'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Award, ExternalLink, Download, Shield, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCertificates } from '@/hooks/useCertificates';
import { useAppSelector } from '@/store';

export default function CertificatesPage() {
  const router = useRouter();
  const { user } = useAppSelector((s) => s.auth);
  const { data: certs, isLoading } = useCertificates();

  useEffect(() => {
    if (!user) router.replace('/auth/login');
  }, [user, router]);

  if (!user) return null;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-8">My Certificates</h1>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-xl" />
            ))}
          </div>
        ) : !certs?.length ? (
          <div className="text-center py-24">
            <Award className="h-14 w-14 text-muted-foreground/30 mx-auto mb-4" />
            <p className="font-medium mb-1">No certificates yet</p>
            <p className="text-sm text-muted-foreground mb-6">
              Complete a course to earn your first certificate.
            </p>
            <Button asChild>
              <Link href="/courses">Browse Courses</Link>
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {certs.map((cert) => (
              <Card key={cert.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-2 bg-gradient-to-r from-primary to-primary/60" />
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="rounded-full bg-primary/10 p-2">
                      <Award className="h-5 w-5 text-primary" />
                    </div>
                    <Badge variant={cert.status === 'ACTIVE' ? 'default' : 'destructive'} className="text-xs">
                      {cert.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="font-semibold text-sm line-clamp-2">{cert.course.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Issued {format(new Date(cert.issuedAt), 'PPP')}
                    </p>
                    {cert.expiresAt && (
                      <p className="text-xs text-muted-foreground">
                        Expires {format(new Date(cert.expiresAt), 'PPP')}
                      </p>
                    )}
                  </div>
                  <p className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
                    {cert.certificateNumber}
                  </p>
                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <a href={`/certificates/verify/${cert.certificateNumber}`} target="_blank">
                        <Shield className="mr-1.5 h-3.5 w-3.5" />
                        Verify
                      </a>
                    </Button>
                    {cert.pdfUrl && (
                      <Button variant="outline" size="sm" className="flex-1" asChild>
                        <a href={cert.pdfUrl} download>
                          <Download className="mr-1.5 h-3.5 w-3.5" />
                          PDF
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
