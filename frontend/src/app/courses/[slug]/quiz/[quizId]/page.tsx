'use client';

import { use, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, XCircle, Clock, ArrowLeft, Loader2 } from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppDispatch, useAppSelector } from '@/store';
import { addToast } from '@/store/slices/uiSlice';
import { useQuiz, useSubmitQuiz } from '@/hooks/useQuizzes';

export default function QuizPage({ params }: { params: Promise<{ slug: string; quizId: string }> }) {
  const { slug, quizId } = use(params);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);

  const { data: quiz, isLoading } = useQuiz(quizId);
  const submitQuiz = useSubmitQuiz();

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<any | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user) router.replace('/auth/login');
  }, [user, router]);

  useEffect(() => {
    if (quiz?.timeLimitMinutes) {
      setTimeLeft(quiz.timeLimitMinutes * 60);
    }
  }, [quiz?.timeLimitMinutes]);

  useEffect(() => {
    if (timeLeft === null || result) return;
    if (timeLeft <= 0) { handleSubmit(); return; }
    intervalRef.current = setTimeout(() => setTimeLeft((t) => (t ?? 1) - 1), 1000);
    return () => { if (intervalRef.current) clearTimeout(intervalRef.current); };
  }, [timeLeft, result]);

  const handleSubmit = () => {
    if (!quiz) return;
    const responses = quiz.questions.map((q) => ({ questionId: q.id, selectedOptionId: answers[q.id] }));
    submitQuiz.mutate(
      { quizId, responses },
      {
        onSuccess: (data: any) => { setResult(data.data); },
        onError: (err: any) => dispatch(addToast({ title: 'Error', description: err.response?.data?.message, variant: 'destructive' })),
      },
    );
  };

  if (!user) return null;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-2xl">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/courses/${slug}/learn`}><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <h1 className="text-2xl font-bold">{isLoading ? <Skeleton className="h-7 w-48" /> : quiz?.title}</h1>
          {timeLeft !== null && !result && (
            <div className={`ml-auto flex items-center gap-1.5 font-mono text-sm font-semibold ${timeLeft < 60 ? 'text-destructive' : 'text-foreground'}`}>
              <Clock className="h-4 w-4" />
              {formatTime(timeLeft)}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)}
          </div>
        ) : result ? (
          // ── Results view ──────────────────────────────────────────────────
          <div className="text-center space-y-6">
            <div className={`inline-flex items-center justify-center h-24 w-24 rounded-full ${result.isPassed ? 'bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400'}`}>
              {result.isPassed
                ? <CheckCircle2 className="h-12 w-12" />
                : <XCircle className="h-12 w-12" />}
            </div>
            <div>
              <h2 className="text-3xl font-bold">{result.score}%</h2>
              <p className="text-muted-foreground mt-1">{result.isPassed ? 'You passed!' : `Passing score: ${quiz?.passingScore}%`}</p>
            </div>
            <div className="w-full max-w-xs mx-auto">
              <Progress value={result.score} className="h-3" />
            </div>
            <div className="flex gap-3 justify-center">
              <Button asChild variant="outline">
                <Link href={`/courses/${slug}/learn`}>Back to Course</Link>
              </Button>
              <Button onClick={() => { setResult(null); setAnswers({}); if (quiz?.timeLimitMinutes) setTimeLeft(quiz.timeLimitMinutes * 60); }}>
                Retake Quiz
              </Button>
            </div>
          </div>
        ) : (
          // ── Quiz form ─────────────────────────────────────────────────────
          <div className="space-y-6">
            {quiz?.questions.map((q, i) => (
              <Card key={q.id}>
                <CardHeader>
                  <CardTitle className="text-base">{i + 1}. {q.text}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {q.options.map((opt) => (
                    <label key={opt.id} className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-colors ${answers[q.id] === opt.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/30'}`}>
                      <input
                        type="radio"
                        name={q.id}
                        value={opt.id}
                        checked={answers[q.id] === opt.id}
                        onChange={() => setAnswers((a) => ({ ...a, [q.id]: opt.id }))}
                        className="h-4 w-4 accent-primary"
                      />
                      <span className="text-sm">{opt.text}</span>
                    </label>
                  ))}
                </CardContent>
              </Card>
            ))}

            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                {Object.keys(answers).length} / {quiz?.questions.length ?? 0} answered
              </p>
              <Button
                onClick={handleSubmit}
                disabled={submitQuiz.isPending || !quiz?.questions.length}
              >
                {submitQuiz.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Submit Quiz
              </Button>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
