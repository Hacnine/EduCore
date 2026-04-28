'use client';

import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, Trophy, Clock, PlayCircle, TrendingUp, Award } from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { useEnrollments } from '@/hooks/useEnrollments';
import { useAppSelector } from '@/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div className="rounded-full bg-primary/10 p-3">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAppSelector((s) => s.auth);
  const { data: enrollments, isLoading } = useEnrollments();

  useEffect(() => {
    if (!user && !isLoading) router.replace('/auth/login');
  }, [user, isLoading, router]);

  if (!user) return null;

  const inProgress = enrollments?.filter((e) => e.status === 'ACTIVE') ?? [];
  const completed = enrollments?.filter((e) => e.status === 'COMPLETED') ?? [];

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 bg-muted/20">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold">
              Welcome back, {user.firstName}! 👋
            </h1>
            <p className="text-muted-foreground mt-1">
              Here&apos;s your learning progress at a glance.
            </p>
          </div>

          {/* Stats */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard icon={BookOpen} label="Enrolled courses" value={enrollments?.length ?? 0} />
            <StatCard icon={PlayCircle} label="In progress" value={inProgress.length} />
            <StatCard icon={Trophy} label="Completed" value={completed.length} />
            <StatCard
              icon={TrendingUp}
              label="Avg. progress"
              value={
                inProgress.length
                  ? `${Math.round(inProgress.reduce((a, e) => a + e.progress, 0) / inProgress.length)}%`
                  : '0%'
              }
            />
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Enrolled courses */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">My Courses</h2>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/courses">Browse more</Link>
                </Button>
              </div>

              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i}>
                      <CardContent className="flex gap-4 p-4">
                        <Skeleton className="h-20 w-32 rounded-md shrink-0" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                          <Skeleton className="h-2 w-full" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : enrollments?.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No courses yet</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      Start your learning journey today!
                    </p>
                    <Button asChild>
                      <Link href="/courses">Explore courses</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {enrollments?.map((enrollment) => (
                    <Card key={enrollment.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="flex gap-4 p-4">
                        {/* Thumbnail */}
                        <div className="relative h-20 w-32 rounded-md overflow-hidden bg-muted shrink-0">
                          {enrollment.course.thumbnailUrl ? (
                            <Image
                              src={enrollment.course.thumbnailUrl}
                              alt={enrollment.course.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="h-full flex items-center justify-center">
                              <BookOpen className="h-6 w-6 text-muted-foreground/40" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-sm line-clamp-2">
                              {enrollment.course.title}
                            </h3>
                            <Badge
                              variant={enrollment.status === 'COMPLETED' ? 'success' : 'secondary'}
                              className="shrink-0 text-xs"
                            >
                              {enrollment.status === 'COMPLETED' ? 'Completed' : 'In progress'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {enrollment.course.instructor.firstName} {enrollment.course.instructor.lastName}
                          </p>

                          <div className="mt-2 space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{enrollment.progress}% complete</span>
                              <span>
                                {Math.round(enrollment.course.totalLessons * enrollment.progress / 100)}/
                                {enrollment.course.totalLessons} lessons
                              </span>
                            </div>
                            <Progress value={enrollment.progress} className="h-1.5" />
                          </div>

                          <Button
                            size="sm"
                            variant={enrollment.status === 'COMPLETED' ? 'outline' : 'default'}
                            className="mt-3 h-7 text-xs"
                            asChild
                          >
                            <Link href={`/courses/${enrollment.course.slug}/learn`}>
                              {enrollment.status === 'COMPLETED' ? 'Review' : 'Continue'}
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick links */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start gap-2" asChild>
                    <Link href="/dashboard/certificates">
                      <Award className="h-4 w-4" />
                      My Certificates
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2" asChild>
                    <Link href="/dashboard/instructor">
                      <TrendingUp className="h-4 w-4" />
                      Instructor Studio
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2" asChild>
                    <Link href="/profile">
                      <BookOpen className="h-4 w-4" />
                      Edit Profile
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Completed courses */}
              {completed.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-yellow-500" />
                      Achievements
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {completed.slice(0, 3).map((e) => (
                      <div key={e.id} className="flex items-center gap-2 text-sm">
                        <div className="rounded-full bg-yellow-100 p-1">
                          <Award className="h-3 w-3 text-yellow-600" />
                        </div>
                        <span className="line-clamp-1 text-muted-foreground">{e.course.title}</span>
                      </div>
                    ))}
                    {completed.length > 3 && (
                      <Button variant="link" className="p-0 h-auto text-xs" asChild>
                        <Link href="/dashboard/certificates">View all certificates →</Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
