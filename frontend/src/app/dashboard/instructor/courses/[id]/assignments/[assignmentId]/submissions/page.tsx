'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, ClipboardList, CheckCircle2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useAppDispatch, useAppSelector } from '@/store';
import { addToast } from '@/store/slices/uiSlice';
import { useAllSubmissions, useGradeSubmission } from '@/hooks/useAssignments';
import { api } from '@/lib/api';
import { getInitials } from '@/lib/utils';

function GradeForm({ submission, assignmentId, maxScore }: { submission: any; assignmentId: string; maxScore: number }) {
  const dispatch = useAppDispatch();
  const gradeSubmission = useGradeSubmission();
  const { register, handleSubmit } = useForm({
    defaultValues: { score: submission.score ?? '', feedback: submission.feedback ?? '' },
  });

  return (
    <form onSubmit={handleSubmit((values) => {
      gradeSubmission.mutate(
        { assignmentId, submissionId: submission.id, score: Number(values.score), feedback: String(values.feedback) },
        {
          onSuccess: () => dispatch(addToast({ title: 'Graded!', variant: 'success' })),
          onError: (err: any) => dispatch(addToast({ title: 'Error', description: err.response?.data?.message, variant: 'destructive' })),
        },
      );
    })} className="space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Score (max {maxScore})</Label>
          <Input type="number" min={0} max={maxScore} {...register('score')} className="h-8" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Feedback</Label>
          <Input {...register('feedback')} placeholder="Great work!" className="h-8" />
        </div>
      </div>
      <Button size="sm" type="submit" disabled={gradeSubmission.isPending} className="h-7 px-3">
        {gradeSubmission.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save Grade'}
      </Button>
    </form>
  );
}

export default function SubmissionsPage({ params }: { params: Promise<{ id: string; assignmentId: string }> }) {
  const { id: courseId, assignmentId } = use(params);
  const router = useRouter();
  const { user } = useAppSelector((s) => s.auth);
  const { data: submissions, isLoading } = useAllSubmissions(assignmentId);

  const { data: assignment } = useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: async () => {
      const { data } = await api.get(`/assignments/${assignmentId}`);
      return data as { id: string; title: string; maxScore: number; description: string };
    },
    enabled: Boolean(assignmentId),
  });

  useEffect(() => {
    if (!user) router.replace('/auth/login');
  }, [user, router]);

  if (!user) return null;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-3xl">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/instructor/courses/${courseId}/quizzes`}><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Submissions</h1>
            {assignment && <p className="text-sm text-muted-foreground">{assignment.title}</p>}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)}
          </div>
        ) : !submissions?.length ? (
          <div className="text-center py-20">
            <ClipboardList className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No submissions yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((sub) => (
              <Card key={sub.id}>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      {sub.user?.avatarUrl && <img src={sub.user.avatarUrl} alt={sub.user.firstName} />}
                      <AvatarFallback className="text-xs">
                        {getInitials(sub.user?.firstName ?? '?', sub.user?.lastName ?? '')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{sub.user?.firstName} {sub.user?.lastName}</p>
                      <p className="text-xs text-muted-foreground">
                        Submitted {format(new Date(sub.submittedAt), 'MMM d, yyyy HH:mm')}
                      </p>
                    </div>
                    <Badge variant={sub.status === 'GRADED' ? 'default' : 'secondary'} className="text-xs">
                      {sub.status}
                    </Badge>
                    {sub.score != null && (
                      <span className="font-semibold text-sm">{sub.score}/{assignment?.maxScore ?? '?'}</span>
                    )}
                  </div>
                  <div className="bg-muted/30 rounded-md p-3 text-sm whitespace-pre-line">
                    {sub.content}
                  </div>
                  {sub.fileUrls?.[0] && (
                    <a href={sub.fileUrls[0]} target="_blank" className="text-sm text-primary hover:underline">
                      View attached file
                    </a>
                  )}
                  <Separator />
                  <GradeForm submission={sub} assignmentId={assignmentId} maxScore={assignment?.maxScore ?? 100} />
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
