'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, ClipboardList, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppDispatch, useAppSelector } from '@/store';
import { addToast } from '@/store/slices/uiSlice';
import { useAssignment, useMySubmission, useSubmitAssignment } from '@/hooks/useAssignments';

export default function AssignmentPage({ params }: { params: Promise<{ slug: string; assignmentId: string }> }) {
  const { slug, assignmentId } = use(params);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);

  const { data: assignment, isLoading } = useAssignment(assignmentId);
  const { data: mySubmission, isLoading: loadingSubmission } = useMySubmission(assignmentId);
  const submitAssignment = useSubmitAssignment();

  const [content, setContent] = useState('');
  const [fileUrl, setFileUrl] = useState('');

  useEffect(() => {
    if (!user) router.replace('/auth/login');
  }, [user, router]);

  const handleSubmit = () => {
    if (!content.trim()) return;
    submitAssignment.mutate(
      { assignmentId, content, fileUrls: fileUrl ? [fileUrl] : [] },
      {
        onSuccess: () => dispatch(addToast({ title: 'Submitted!', description: 'Your assignment has been submitted.', variant: 'success' })),
        onError: (err: any) => dispatch(addToast({ title: 'Error', description: err.response?.data?.message, variant: 'destructive' })),
      },
    );
  };

  if (!user) return null;

  const isOverdue = assignment?.dueDate && new Date(assignment.dueDate) < new Date() && !mySubmission;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-2xl">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/courses/${slug}/learn`}><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            {isLoading ? <Skeleton className="h-7 w-48" /> : <h1 className="text-2xl font-bold">{assignment?.title}</h1>}
          </div>
        </div>

        {isLoading ? (
          <Skeleton className="h-48 rounded-lg" />
        ) : (
          <div className="space-y-6">
            {/* Details */}
            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <span>Max Score: <strong className="text-foreground">{assignment?.maxScore}</strong></span>
                  {assignment?.dueDate && (
                    <span className={isOverdue ? 'text-destructive font-medium' : ''}>
                      Due: {format(new Date(assignment.dueDate), 'MMM d, yyyy HH:mm')}
                      {isOverdue && ' (Overdue)'}
                    </span>
                  )}
                </div>
                <p className="text-sm whitespace-pre-line">{assignment?.instructions}</p>
              </CardContent>
            </Card>

            {/* Submission */}
            {loadingSubmission ? <Skeleton className="h-32 rounded-lg" /> : mySubmission ? (
              <Card className="border-primary/40">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    Submitted
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(mySubmission.submittedAt), 'MMM d, yyyy HH:mm')}
                  </p>
                  <div className="bg-muted/30 rounded-md p-3 text-sm whitespace-pre-line">
                    {mySubmission.content}
                  </div>
                  {mySubmission.fileUrls?.[0] && (
                    <a href={mySubmission.fileUrls[0]} target="_blank" className="text-sm text-primary hover:underline">
                      View attached file
                    </a>
                  )}
                  {mySubmission.status === 'GRADED' && (
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-md">
                      <Badge>Graded</Badge>
                      <span className="font-semibold">{mySubmission.score}/{assignment?.maxScore}</span>
                      {mySubmission.feedback && <span className="text-sm text-muted-foreground">{mySubmission.feedback}</span>}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader><CardTitle className="text-base">Your Submission</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {isOverdue && !assignment?.allowLateSubmission ? (
                    <p className="text-sm text-destructive">This assignment is overdue and late submissions are not allowed.</p>
                  ) : (
                    <>
                      {isOverdue && (
                        <p className="text-sm text-amber-600 dark:text-amber-400">
                          This assignment is past due, but late submissions are accepted.
                        </p>
                      )}
                      <div className="space-y-1.5">
                        <Label>Your Answer</Label>
                        <Textarea
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          placeholder="Write your answer here…"
                          className="min-h-[160px]"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>File URL <span className="text-muted-foreground text-xs">(optional)</span></Label>
                        <Input value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="https://github.com/…" />
                      </div>
                      <Button
                        onClick={handleSubmit}
                        disabled={!content.trim() || submitAssignment.isPending}
                      >
                        {submitAssignment.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Assignment
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
