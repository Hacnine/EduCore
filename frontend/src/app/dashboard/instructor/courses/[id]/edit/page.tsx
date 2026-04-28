'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2, Eye, EyeOff, Trash2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useAppDispatch, useAppSelector } from '@/store';
import { addToast } from '@/store/slices/uiSlice';
import { useUpdateCourse, usePublishCourse, useUnpublishCourse, useDeleteCourse } from '@/hooks/useInstructor';
import { useCategories } from '@/hooks/useCategories';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';

const schema = z.object({
  title: z.string().min(5),
  shortSummary: z.string().max(200).optional(),
  description: z.string().optional(),
  level: z.string(),
  language: z.string(),
  isFree: z.boolean(),
  price: z.coerce.number().min(0),
  categoryId: z.string().optional(),
  thumbnailUrl: z.string().url().optional().or(z.literal('')),
  previewVideoUrl: z.string().url().optional().or(z.literal('')),
  tags: z.string().optional(),
  requirements: z.string().optional(),
  objectives: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const orgId = user?.organizationMemberships?.[0]?.organizationId;
  const { data: categories } = useCategories(orgId);
  const updateCourse = useUpdateCourse();
  const publishCourse = usePublishCourse();
  const unpublishCourse = useUnpublishCourse();
  const deleteCourse = useDeleteCourse();

  const { data: course, isLoading } = useQuery({
    queryKey: ['course-edit', id],
    queryFn: async () => {
      const { data } = await api.get(`/courses/${id}/details`);
      return data;
    },
    enabled: Boolean(id),
  });

  useEffect(() => {
    if (!user) router.replace('/auth/login');
  }, [user, router]);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (course) {
      reset({
        title: course.title,
        shortSummary: course.shortSummary ?? '',
        description: course.description ?? '',
        level: course.level,
        language: course.language,
        isFree: course.isFree,
        price: course.price,
        categoryId: course.categoryId ?? '',
        thumbnailUrl: course.thumbnailUrl ?? '',
        previewVideoUrl: course.previewVideoUrl ?? '',
        tags: course.tags?.join(', ') ?? '',
        requirements: course.requirements?.join('\n') ?? '',
        objectives: course.objectives?.join('\n') ?? '',
      });
    }
  }, [course, reset]);

  const isFree = watch('isFree');

  const onSubmit = (values: FormValues) => {
    updateCourse.mutate(
      {
        id,
        ...values,
        tags: values.tags ? values.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        requirements: values.requirements ? values.requirements.split('\n').filter(Boolean) : [],
        objectives: values.objectives ? values.objectives.split('\n').filter(Boolean) : [],
        categoryId: values.categoryId || undefined,
        thumbnailUrl: values.thumbnailUrl || undefined,
        previewVideoUrl: values.previewVideoUrl || undefined,
        price: values.isFree ? 0 : values.price,
      },
      {
        onSuccess: () => dispatch(addToast({ title: 'Course updated', variant: 'success' })),
        onError: (err: any) => dispatch(addToast({ title: 'Error', description: err.response?.data?.message, variant: 'destructive' })),
      },
    );
  };

  const handlePublish = () => {
    publishCourse.mutate(id, {
      onSuccess: () => dispatch(addToast({ title: 'Course published!', variant: 'success' })),
      onError: (err: any) => dispatch(addToast({ title: 'Error', description: err.response?.data?.message, variant: 'destructive' })),
    });
  };

  const handleUnpublish = () => {
    unpublishCourse.mutate(id, {
      onSuccess: () => dispatch(addToast({ title: 'Course unpublished', variant: 'success' })),
      onError: (err: any) => dispatch(addToast({ title: 'Error', description: err.response?.data?.message, variant: 'destructive' })),
    });
  };

  const handleDelete = () => {
    if (!confirm('Delete this course permanently? This cannot be undone.')) return;
    deleteCourse.mutate(id, {
      onSuccess: () => {
        dispatch(addToast({ title: 'Course deleted', variant: 'success' }));
        router.push('/dashboard/instructor');
      },
    });
  };

  if (!user) return null;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard/instructor"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Edit Course</h1>
              {course && (
                <Badge variant={course.status === 'PUBLISHED' ? 'default' : 'secondary'} className="mt-1">
                  {course.status}
                </Badge>
              )}
            </div>
          </div>
          {course && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/instructor/courses/${id}/curriculum`}>Curriculum</Link>
              </Button>
              {course.status === 'PUBLISHED' ? (
                <Button variant="outline" size="sm" onClick={handleUnpublish} disabled={unpublishCourse.isPending}>
                  <EyeOff className="mr-1.5 h-3.5 w-3.5" />
                  Unpublish
                </Button>
              ) : (
                <Button size="sm" onClick={handlePublish} disabled={publishCourse.isPending}>
                  <Eye className="mr-1.5 h-3.5 w-3.5" />
                  Publish
                </Button>
              )}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Basic Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Course Title</Label>
                  <Input {...register('title')} />
                  {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Short Summary</Label>
                  <Input {...register('shortSummary')} />
                </div>
                <div className="space-y-1.5">
                  <Label>Full Description</Label>
                  <Textarea {...register('description')} rows={5} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Media</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Thumbnail URL</Label>
                  <Input {...register('thumbnailUrl')} placeholder="https://…" />
                </div>
                <div className="space-y-1.5">
                  <Label>Preview Video URL</Label>
                  <Input {...register('previewVideoUrl')} placeholder="https://…" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Course Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Level</Label>
                    <Select value={watch('level')} onValueChange={(v) => setValue('level', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BEGINNER">Beginner</SelectItem>
                        <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                        <SelectItem value="ADVANCED">Advanced</SelectItem>
                        <SelectItem value="ALL_LEVELS">All Levels</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Language</Label>
                    <Input {...register('language')} />
                  </div>
                </div>
                {categories && categories.length > 0 && (
                  <div className="space-y-1.5">
                    <Label>Category</Label>
                    <Select value={watch('categoryId') ?? ''} onValueChange={(v) => setValue('categoryId', v)}>
                      <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label>Tags (comma-separated)</Label>
                  <Input {...register('tags')} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Pricing</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <input id="isFree" type="checkbox" {...register('isFree')} className="h-4 w-4" />
                  <Label htmlFor="isFree">Free course</Label>
                </div>
                {!isFree && (
                  <div className="space-y-1.5">
                    <Label>Price (USD)</Label>
                    <Input type="number" min={0} step={0.01} {...register('price')} />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Learning Content</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Objectives (one per line)</Label>
                  <Textarea {...register('objectives')} rows={4} />
                </div>
                <div className="space-y-1.5">
                  <Label>Requirements (one per line)</Label>
                  <Textarea {...register('requirements')} rows={3} />
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <Button type="submit" disabled={updateCourse.isPending}>
                {updateCourse.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
              <Button type="button" variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Delete Course
              </Button>
            </div>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
}
