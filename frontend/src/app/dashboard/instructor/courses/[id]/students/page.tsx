'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, Mail, BarChart2 } from 'lucide-react';
import { format } from 'date-fns';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppSelector } from '@/store';
import { useCourseStudents } from '@/hooks/useInstructor';
import { getInitials } from '@/lib/utils';

export default function StudentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = use(params);
  const router = useRouter();
  const { user } = useAppSelector((s) => s.auth);
  const { data: students, isLoading } = useCourseStudents(courseId);

  useEffect(() => {
    if (!user) router.replace('/auth/login');
  }, [user, router]);

  if (!user) return null;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-4xl">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/instructor/courses/${courseId}/curriculum`}><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Students</h1>
            {students && (
              <p className="text-sm text-muted-foreground">{students.length} enrolled</p>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
          </div>
        ) : !students?.length ? (
          <div className="text-center py-20">
            <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No students enrolled yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {students.map((enrollment) => (
              <Card key={enrollment.id}>
                <CardContent className="flex items-center gap-4 p-4">
                  <Avatar className="h-10 w-10">
                    {enrollment.user.avatarUrl && (
                      <AvatarImage src={enrollment.user.avatarUrl} alt={enrollment.user.firstName} />
                    )}
                    <AvatarFallback className="text-xs">
                      {getInitials(enrollment.user.firstName, enrollment.user.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">
                      {enrollment.user.firstName} {enrollment.user.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{enrollment.user.email}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 w-32">
                    <Progress value={enrollment.progress} className="flex-1 h-1.5" />
                    <span className="text-xs text-muted-foreground w-8 text-right">{enrollment.progress}%</span>
                  </div>
                  <Badge variant={enrollment.status === 'COMPLETED' ? 'default' : 'secondary'} className="text-xs hidden sm:flex">
                    {enrollment.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground hidden md:block">
                    {format(new Date(enrollment.enrolledAt), 'MMM d, yyyy')}
                  </span>
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
