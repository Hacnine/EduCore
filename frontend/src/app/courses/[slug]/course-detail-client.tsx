'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  BookOpen, Clock, Users, Star, Globe, BarChart2,
  ChevronDown, ChevronRight, Play, Lock, CheckCircle2, Loader2,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CourseDetail } from '@/hooks/useCourse';
import { useAppSelector, useAppDispatch } from '@/store';
import { addToast } from '@/store/slices/uiSlice';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatPrice, formatDuration, getInitials } from '@/lib/utils';
import { api } from '@/lib/api';
import { useState } from 'react';
import { useReviews, useCreateReview } from '@/hooks/useReviews';
import { useEnrollments } from '@/hooks/useEnrollments';
import { formatDistanceToNow } from 'date-fns';

const levelLabel: Record<string, string> = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
  ALL_LEVELS: 'All Levels',
};

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          disabled={!onChange}
          onMouseEnter={() => onChange && setHover(i)}
          onMouseLeave={() => onChange && setHover(0)}
          onClick={() => onChange?.(i)}
          className={onChange ? 'cursor-pointer' : 'cursor-default'}
        >
          <Star className={`h-5 w-5 ${i <= (hover || value) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/40'}`} />
        </button>
      ))}
    </div>
  );
}

function ReviewsSection({ courseId, isEnrolled }: { courseId: string; isEnrolled: boolean }) {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const { data: reviews, isLoading } = useReviews(courseId);
  const createReview = useCreateReview();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const avg = reviews?.length
    ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length
    : 0;

  const handleSubmit = () => {
    if (!rating) return;
    createReview.mutate(
      { courseId, rating, body: comment || undefined },
      {
        onSuccess: () => { setSubmitted(true); dispatch(addToast({ title: 'Review submitted!', variant: 'success' })); },
        onError: (err: any) => dispatch(addToast({ title: 'Error', description: err.response?.data?.message, variant: 'destructive' })),
      },
    );
  };

  return (
    <div className="space-y-6">
      {avg > 0 && (
        <div className="flex items-center gap-4">
          <span className="text-5xl font-bold">{avg.toFixed(1)}</span>
          <div>
            <StarRating value={Math.round(avg)} />
            <p className="text-sm text-muted-foreground mt-1">{reviews?.length} rating{reviews?.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      )}

      {isEnrolled && user && !submitted && (
        <div className="p-4 border rounded-lg space-y-3">
          <p className="font-medium text-sm">Leave a Review</p>
          <StarRating value={rating} onChange={setRating} />
          <textarea
            className="w-full border rounded-md p-2 text-sm resize-none min-h-[80px]"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your thoughts (optional)"
          />
          <Button size="sm" disabled={!rating || createReview.isPending} onClick={handleSubmit}>
            {createReview.isPending ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
            Submit Review
          </Button>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading reviews…</p>
      ) : reviews?.length === 0 ? (
        <p className="text-sm text-muted-foreground">No reviews yet. Be the first!</p>
      ) : (
        <div className="space-y-4">
          {reviews?.map((r) => (
            <div key={r.id} className="flex gap-3">
              <Avatar className="h-9 w-9 shrink-0">
                {r.user.avatarUrl && <AvatarImage src={r.user.avatarUrl} />}
                <AvatarFallback className="text-xs">{getInitials(r.user.firstName, r.user.lastName)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{r.user.firstName} {r.user.lastName}</span>
                  <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}</span>
                </div>
                <StarRating value={r.rating} />
                {r.body && <p className="text-sm text-muted-foreground mt-1">{r.body}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SectionItem({
  section,
}: {
  section: {
    id: string;
    title: string;
    position: number;
    lessons: Array<{ id: string; title: string; type: string; duration?: number | null; isFree: boolean; position: number }>;
  };
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border rounded-md overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
      >
        <span className="font-medium text-sm">{section.title}</span>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{section.lessons.length} lessons</span>
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </div>
      </button>
      {open && (
        <div className="divide-y">
          {section.lessons.map((lesson) => (
            <div key={lesson.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
              {lesson.isFree ? (
                <Play className="h-3.5 w-3.5 text-primary shrink-0" />
              ) : (
                <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              )}
              <span className="flex-1 text-muted-foreground">{lesson.title}</span>
              {lesson.duration && (
                <span className="text-xs text-muted-foreground">{formatDuration(lesson.duration)}</span>
              )}
              {lesson.isFree && (
                <Badge variant="outline" className="text-xs py-0">Preview</Badge>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CourseDetailClient({ course }: { course: CourseDetail }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const qc = useQueryClient();
  const { user } = useAppSelector((s) => s.auth);
  const slug = course.slug;

  const { data: enrollments } = useEnrollments();
  const isEnrolled = enrollments?.some((e) => e.course.id === course.id) ?? false;

  const enrollMutation = useMutation({
    mutationFn: () => api.post('/enrollments', { courseId: course.id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['enrollments'] });
      dispatch(addToast({ title: 'Enrolled!', description: `You are now enrolled in "${course.title}"`, variant: 'success' }));
      router.push(`/courses/${slug}/learn`);
    },
    onError: (err: any) => {
      dispatch(addToast({ title: 'Enrollment failed', description: err.response?.data?.message ?? 'Please try again', variant: 'destructive' }));
    },
  });

  const handleEnroll = () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    if (course.isFree) {
      enrollMutation.mutate();
    } else {
      api.post('/payments/checkout', { courseId: course.id })
        .then(({ data }) => { window.location.href = data.url; })
        .catch((err) => {
          dispatch(addToast({ title: 'Checkout error', description: err.response?.data?.message ?? 'Please try again', variant: 'destructive' }));
        });
    }
  };

  const totalDuration = course.sections
    .flatMap((s) => s.lessons)
    .reduce((acc, l) => acc + (l.duration ?? 0), 0);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      {/* Hero banner */}
      <div className="bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-10">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-3 text-sm text-gray-300">
              <Link href="/courses" className="hover:text-white transition-colors">Courses</Link>
              <ChevronRight className="h-3 w-3" />
              {course.category && (
                <>
                  <span>{course.category.name}</span>
                  <ChevronRight className="h-3 w-3" />
                </>
              )}
              <span className="truncate">{course.title}</span>
            </div>

            <h1 className="text-3xl font-bold mb-3">{course.title}</h1>
            {course.shortSummary && (
              <p className="text-lg text-gray-300 mb-4">{course.shortSummary}</p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300">
              {course._count.reviews > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold text-yellow-400">{course.averageRating?.toFixed(1)}</span>
                  <span>({course._count.reviews.toLocaleString()} ratings)</span>
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {course._count.enrollments.toLocaleString()} students
              </span>
              <span className="flex items-center gap-1">
                <Globe className="h-4 w-4" />
                {course.language}
              </span>
              <span className="flex items-center gap-1">
                <BarChart2 className="h-4 w-4" />
                {levelLabel[course.level] ?? course.level}
              </span>
            </div>

            <p className="mt-3 text-sm text-gray-300">
              Created by{' '}
              <span className="text-white font-medium">
                {course.instructor.firstName} {course.instructor.lastName}
              </span>
            </p>
          </div>
        </div>
      </div>

      <main className="flex-1">
        <div className="container mx-auto px-4 py-10">
          <div className="grid lg:grid-cols-3 gap-10">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-8">
              <Tabs defaultValue="overview">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
                  <TabsTrigger value="instructor">Instructor</TabsTrigger>
                  <TabsTrigger value="reviews">Reviews</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-8 mt-6">
                  {course.objectives.length > 0 && (
                    <div>
                      <h2 className="text-xl font-bold mb-4">What you&apos;ll learn</h2>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {course.objectives.map((obj, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            <span>{obj}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Separator />

                  {course.description && (
                    <div>
                      <h2 className="text-xl font-bold mb-3">About this course</h2>
                      <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-line">
                        {course.description}
                      </div>
                    </div>
                  )}

                  {course.requirements.length > 0 && (
                    <div>
                      <h2 className="text-xl font-bold mb-3">Requirements</h2>
                      <ul className="list-disc pl-5 space-y-1">
                        {course.requirements.map((req, i) => (
                          <li key={i} className="text-sm text-muted-foreground">{req}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="curriculum" className="space-y-3 mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">Course Content</h2>
                    <span className="text-sm text-muted-foreground">
                      {course.sections.length} sections &bull; {course.totalLessons} lessons
                      {totalDuration > 0 && ` \u2022 ${formatDuration(totalDuration)} total`}
                    </span>
                  </div>
                  {course.sections
                    .slice()
                    .sort((a, b) => a.position - b.position)
                    .map((section) => (
                      <SectionItem key={section.id} section={section} />
                    ))}
                </TabsContent>

                <TabsContent value="instructor" className="mt-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                      {course.instructor.avatarUrl && (
                        <AvatarImage src={course.instructor.avatarUrl} alt={course.instructor.firstName} />
                      )}
                      <AvatarFallback className="text-lg">
                        {getInitials(course.instructor.firstName, course.instructor.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-xl font-bold">
                        {course.instructor.firstName} {course.instructor.lastName}
                      </h2>
                      {course.instructor.bio && (
                        <p className="text-muted-foreground text-sm mt-2 whitespace-pre-line">
                          {course.instructor.bio}
                        </p>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="reviews" className="mt-6">
                  <h2 className="text-xl font-bold mb-4">Student Reviews</h2>
                  <ReviewsSection courseId={course.id} isEnrolled={isEnrolled} />
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="lg:sticky lg:top-20 h-fit">
              <Card className="overflow-hidden shadow-lg">
                <div className="relative h-44 bg-muted">
                  {course.thumbnailUrl ? (
                    <Image src={course.thumbnailUrl} alt={course.title} fill className="object-cover" />
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <BookOpen className="h-12 w-12 text-muted-foreground/40" />
                    </div>
                  )}
                  {course.previewVideoUrl && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <div className="rounded-full bg-white/90 p-3">
                        <Play className="h-6 w-6 text-gray-900" />
                      </div>
                    </div>
                  )}
                </div>

                <CardContent className="p-5 space-y-4">
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-bold">
                      {course.isFree ? 'Free' : formatPrice(course.price)}
                    </span>
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleEnroll}
                    disabled={enrollMutation.isPending}
                  >
                    {enrollMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {course.isFree ? 'Enroll for free' : 'Buy now'}
                  </Button>

                  {!course.isFree && (
                    <Button variant="outline" className="w-full" size="lg">
                      Try for free
                    </Button>
                  )}

                  <Separator />

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span className="flex items-center gap-1.5"><BookOpen className="h-4 w-4" /> Lessons</span>
                      <span className="font-medium text-foreground">{course.totalLessons}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> Duration</span>
                      <span className="font-medium text-foreground">{formatDuration(totalDuration)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span className="flex items-center gap-1.5"><BarChart2 className="h-4 w-4" /> Level</span>
                      <span className="font-medium text-foreground">{levelLabel[course.level] ?? course.level}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span className="flex items-center gap-1.5"><Globe className="h-4 w-4" /> Language</span>
                      <span className="font-medium text-foreground">{course.language}</span>
                    </div>
                  </div>

                  {course.tags.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Tags</p>
                        <div className="flex flex-wrap gap-1.5">
                          {course.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
