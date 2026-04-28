'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppDispatch, useAppSelector } from '@/store';
import { addToast } from '@/store/slices/uiSlice';
import { useCreateCourse } from '@/hooks/useInstructor';
import { useCategories } from '@/hooks/useCategories';

const schema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  shortSummary: z.string().max(200).optional(),
  description: z.string().optional(),
  level: z.string().default('BEGINNER'),
  language: z.string().default('English'),
  isFree: z.boolean().default(false),
  price: z.coerce.number().min(0).default(0),
  categoryId: z.string().optional(),
  tags: z.string().optional(),
  requirements: z.string().optional(),
  objectives: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function NewCoursePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const orgId = user?.organizationMemberships?.[0]?.organizationId;
  const { data: categories } = useCategories(orgId);
  const createCourse = useCreateCourse();

  useEffect(() => {
    if (!user) router.replace('/auth/login');
  }, [user, router]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const isFree = watch('isFree');

  const onSubmit = (values: FormValues) => {
    if (!orgId) {
      dispatch(addToast({ title: 'No organization found', variant: 'destructive' }));
      return;
    }
    createCourse.mutate(
      {
        organizationId: orgId,
        title: values.title,
        shortSummary: values.shortSummary,
        description: values.description,
        level: values.level,
        language: values.language,
        isFree: values.isFree,
        price: values.isFree ? 0 : values.price,
        categoryId: values.categoryId || undefined,
        tags: values.tags ? values.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        requirements: values.requirements ? values.requirements.split('\n').filter(Boolean) : [],
        objectives: values.objectives ? values.objectives.split('\n').filter(Boolean) : [],
      },
      {
        onSuccess: (res) => {
          dispatch(addToast({ title: 'Course created!', variant: 'success' }));
          router.push(`/dashboard/instructor/courses/${res.data.id}/curriculum`);
        },
        onError: (err: any) => {
          dispatch(addToast({ title: 'Error', description: err.response?.data?.message, variant: 'destructive' }));
        },
      },
    );
  };

  if (!user) return null;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-2xl">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/instructor"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <h1 className="text-2xl font-bold">Create New Course</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Basic Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Course Title <span className="text-destructive">*</span></Label>
                <Input {...register('title')} placeholder="e.g. Complete JavaScript Bootcamp" />
                {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Short Summary</Label>
                <Input {...register('shortSummary')} placeholder="One-line description (max 200 chars)" maxLength={200} />
              </div>
              <div className="space-y-1.5">
                <Label>Full Description</Label>
                <Textarea {...register('description')} rows={5} placeholder="Detailed description of what students will learn…" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Course Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Level</Label>
                  <Select defaultValue="BEGINNER" onValueChange={(v) => setValue('level', v)}>
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
                  <Input {...register('language')} defaultValue="English" />
                </div>
              </div>

              {categories && categories.length > 0 && (
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select onValueChange={(v) => setValue('categoryId', v)}>
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
                <Label>Tags <span className="text-xs text-muted-foreground">(comma-separated)</span></Label>
                <Input {...register('tags')} placeholder="javascript, react, web development" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Pricing</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  id="isFree"
                  type="checkbox"
                  {...register('isFree')}
                  className="h-4 w-4"
                />
                <Label htmlFor="isFree">This course is free</Label>
              </div>
              {!isFree && (
                <div className="space-y-1.5">
                  <Label>Price (USD)</Label>
                  <Input type="number" min={0} step={0.01} {...register('price')} placeholder="29.99" />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Learning Content</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Learning Objectives <span className="text-xs text-muted-foreground">(one per line)</span></Label>
                <Textarea {...register('objectives')} rows={4} placeholder="Understand JavaScript fundamentals&#10;Build React apps from scratch" />
              </div>
              <div className="space-y-1.5">
                <Label>Requirements <span className="text-xs text-muted-foreground">(one per line)</span></Label>
                <Textarea {...register('requirements')} rows={3} placeholder="Basic computer knowledge&#10;Internet connection" />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button type="submit" disabled={createCourse.isPending}>
              {createCourse.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Course
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/dashboard/instructor">Cancel</Link>
            </Button>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
}
