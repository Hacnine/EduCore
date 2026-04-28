'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PlusCircle, BookOpen, Users, DollarSign, BarChart2, Eye, Pencil, TrendingUp, GraduationCap, Tag, HelpCircle } from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { useAppSelector } from '@/store';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/utils';

interface OrgStats {
  totalCourses: number;
  totalStudents: number;
  totalRevenue: number;
  totalEnrollments: number;
}

interface InstructorCourse {
  id: string;
  title: string;
  slug: string;
  status: string;
  price: number;
  isFree: boolean;
  _count: { enrollments: number; reviews: number };
  averageRating?: number;
}

function StatCard({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: string | number; sub?: string }) {
  return (
    <Card>
      <CardContent className="flex items-start gap-4 p-6">
        <div className="rounded-full bg-primary/10 p-3">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function InstructorDashboardPage() {
  const router = useRouter();
  const { user } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (!user) router.replace('/auth/login');
  }, [user, router]);

  // Fetch instructor's courses
  const { data: coursesData, isLoading: coursesLoading } = useQuery<{ courses: InstructorCourse[] }>({
    queryKey: ['instructor-courses'],
    queryFn: async () => {
      const { data } = await api.get('/courses', { params: { limit: 50 } });
      return data;
    },
    enabled: Boolean(user),
  });

  if (!user) return null;

  const myCourses = coursesData?.courses ?? [];

  const stats = {
    totalCourses: myCourses.length,
    totalStudents: myCourses.reduce((a, c) => a + c._count.enrollments, 0),
    published: myCourses.filter((c) => c.status === 'PUBLISHED').length,
  };

  const statusVariant: Record<string, 'default' | 'secondary' | 'outline' | 'success' | 'destructive'> = {
    PUBLISHED: 'success',
    DRAFT: 'secondary',
    ARCHIVED: 'outline',
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 bg-muted/20">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold">Instructor Studio</h1>
              <p className="text-muted-foreground mt-1">Manage your courses and track performance</p>
            </div>
            <Button asChild>
              <Link href="/dashboard/instructor/courses/new">
                <PlusCircle className="h-4 w-4 mr-2" />
                New Course
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <StatCard icon={BookOpen} label="Total courses" value={stats.totalCourses} sub={`${stats.published} published`} />
            <StatCard icon={Users} label="Total students" value={stats.totalStudents.toLocaleString()} />
            <StatCard icon={TrendingUp} label="Published" value={stats.published} />
          </div>

          {/* Courses table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>My Courses</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/instructor/courses/new">
                  <PlusCircle className="h-4 w-4 mr-1" />
                  Add
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {coursesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : myCourses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No courses yet</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Create your first course to start teaching.
                  </p>
                  <Button asChild>
                    <Link href="/dashboard/instructor/courses/new">Create course</Link>
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="text-left py-3 pr-4 font-medium">Course</th>
                        <th className="text-center py-3 px-4 font-medium">Status</th>
                        <th className="text-right py-3 px-4 font-medium">Students</th>
                        <th className="text-right py-3 px-4 font-medium">Price</th>
                        <th className="text-right py-3 pl-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myCourses.map((course) => (
                        <tr key={course.id} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="py-3 pr-4">
                            <p className="font-medium line-clamp-1">{course.title}</p>
                          </td>
                          <td className="text-center py-3 px-4">
                            <Badge variant={statusVariant[course.status] ?? 'outline'} className="text-xs">
                              {course.status}
                            </Badge>
                          </td>
                          <td className="text-right py-3 px-4 text-muted-foreground">
                            {course._count.enrollments.toLocaleString()}
                          </td>
                          <td className="text-right py-3 px-4 font-medium">
                            {course.isFree ? 'Free' : formatPrice(course.price)}
                          </td>
                          <td className="text-right py-3 pl-4">
                            <div className="flex items-center justify-end gap-1 flex-wrap">
                              <Button variant="ghost" size="icon" className="h-8 w-8" asChild title="Preview">
                                <Link href={`/courses/${course.slug}`}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" asChild title="Edit">
                                <Link href={`/dashboard/instructor/courses/${course.id}/edit`}>
                                  <Pencil className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" asChild title="Curriculum">
                                <Link href={`/dashboard/instructor/courses/${course.id}/curriculum`}>
                                  <BookOpen className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" asChild title="Students">
                                <Link href={`/dashboard/instructor/courses/${course.id}/students`}>
                                  <GraduationCap className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" asChild title="Quizzes & Assignments">
                                <Link href={`/dashboard/instructor/courses/${course.id}/quizzes`}>
                                  <HelpCircle className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" asChild title="Coupons">
                                <Link href={`/dashboard/instructor/courses/${course.id}/coupons`}>
                                  <Tag className="h-4 w-4" />
                                </Link>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
