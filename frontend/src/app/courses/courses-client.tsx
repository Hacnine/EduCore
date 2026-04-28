'use client';

import { useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Search, SlidersHorizontal, Star, Users, BookOpen } from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { useCourses, CourseFilters } from '@/hooks/useCourses';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/utils';

const LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ALL_LEVELS'];
const levelLabel: Record<string, string> = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
  ALL_LEVELS: 'All Levels',
};

function CourseCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="h-44 w-full rounded-none" />
      <CardContent className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </CardContent>
      <CardFooter className="px-4 pb-4">
        <Skeleton className="h-6 w-20" />
      </CardFooter>
    </Card>
  );
}

interface InitialData {
  courses: any[];
  total: number;
  totalPages: number;
  page: number;
}

interface CoursesClientProps {
  initialData: InitialData | null;
  initialSearchParams?: {
    search?: string;
    level?: string;
    isFree?: string;
    page?: string;
  };
}

export default function CoursesClient({ initialData, initialSearchParams = {} }: CoursesClientProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [search, setSearch] = useState(initialSearchParams.search ?? '');
  const [level, setLevel] = useState(initialSearchParams.level ?? '');
  const [isFree, setIsFree] = useState<boolean | undefined>(
    initialSearchParams.isFree === 'true' ? true : initialSearchParams.isFree === 'false' ? false : undefined,
  );
  const [page, setPage] = useState(Number(initialSearchParams.page ?? '1'));

  const filters: CourseFilters = {
    search: search || undefined,
    level: level || undefined,
    isFree,
    page,
    limit: 12,
  };

  const { data, isLoading, isError } = useCourses(filters, initialData ?? undefined);

  const pushFilters = (overrides: Partial<typeof filters>) => {
    const merged = { ...filters, ...overrides };
    const params = new URLSearchParams();
    if (merged.search) params.set('search', merged.search);
    if (merged.level) params.set('level', merged.level);
    if (merged.isFree !== undefined) params.set('isFree', String(merged.isFree));
    if (merged.page && merged.page > 1) params.set('page', String(merged.page));
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    pushFilters({ page: 1 });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-muted/40 border-b py-12">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold mb-2">Explore Courses</h1>
            <p className="text-muted-foreground mb-6">
              Discover {data?.total ?? initialData?.total ?? '...'} courses to grow your skills
            </p>

            {/* Search + filters */}
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 max-w-xl">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search for anything…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <Select
                value={level}
                onValueChange={(v) => { const l = v === 'ALL' ? '' : v; setLevel(l); setPage(1); pushFilters({ level: l, page: 1 }); }}
              >
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="Any level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Any level</SelectItem>
                  {LEVELS.map((l) => (
                    <SelectItem key={l} value={l}>{levelLabel[l]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={isFree === undefined ? 'ALL' : isFree ? 'free' : 'paid'}
                onValueChange={(v) => {
                  const f = v === 'free' ? true : v === 'paid' ? false : undefined;
                  setIsFree(f);
                  setPage(1);
                  pushFilters({ isFree: f, page: 1 });
                }}
              >
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue placeholder="Price" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All prices</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>

              <Button type="submit">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </form>
          </div>
        </section>

        {/* Grid */}
        <section className="container mx-auto px-4 py-10">
          {isError && (
            <div className="text-center text-destructive py-12">
              Failed to load courses. Please try again.
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => <CourseCardSkeleton key={i} />)}
            </div>
          ) : data?.courses.length === 0 ? (
            <div className="text-center py-20">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No courses found</h2>
              <p className="text-muted-foreground mb-4">Try adjusting your search or filters</p>
              <Button variant="outline" onClick={() => { setSearch(''); setLevel(''); setIsFree(undefined); setPage(1); }}>
                Clear filters
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {data?.courses.map((course: any) => (
                  <Link key={course.id} href={`/courses/${course.slug}`}>
                    <Card className="overflow-hidden h-full hover:shadow-md transition-shadow group cursor-pointer">
                      <div className="relative h-44 bg-muted overflow-hidden">
                        {course.thumbnailUrl ? (
                          <Image
                            src={course.thumbnailUrl}
                            alt={course.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="h-full flex items-center justify-center">
                            <BookOpen className="h-12 w-12 text-muted-foreground/40" />
                          </div>
                        )}
                        {course.isFree && (
                          <Badge variant="secondary" className="absolute top-2 left-2 bg-green-100 text-green-700">Free</Badge>
                        )}
                      </div>

                      <CardContent className="p-4">
                        <div className="flex items-center gap-1 mb-1">
                          <Badge variant="secondary" className="text-xs">
                            {levelLabel[course.level] ?? course.level}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-sm leading-snug mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                          {course.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mb-2">
                          {course.instructor.firstName} {course.instructor.lastName}
                        </p>
                        {course.shortSummary && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {course.shortSummary}
                          </p>
                        )}
                      </CardContent>

                      <CardFooter className="px-4 pb-4 pt-0 flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {course._count?.reviews > 0 && (
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              {course.averageRating?.toFixed(1)}
                              <span className="text-muted-foreground/60">({course._count.reviews})</span>
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {course._count?.enrollments?.toLocaleString() ?? 0}
                          </span>
                        </div>
                        <span className="font-bold text-sm">
                          {course.isFree ? 'Free' : formatPrice(course.price)}
                        </span>
                      </CardFooter>
                    </Card>
                  </Link>
                ))}
              </div>

              {data && data.totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-10">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => { const p = page - 1; setPage(p); pushFilters({ page: p }); }}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {data.page} of {data.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === data.totalPages}
                    onClick={() => { const p = page + 1; setPage(p); pushFilters({ page: p }); }}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
