'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Plus, Loader2, Trash2, HelpCircle, ChevronDown, ChevronRight, Check, X } from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useAppDispatch, useAppSelector } from '@/store';
import { addToast } from '@/store/slices/uiSlice';
import { api } from '@/lib/api';
import { useCreateQuiz, useInstructorQuiz, useAddQuestion, useDeleteQuestion } from '@/hooks/useQuizzes';
import { useCreateAssignment } from '@/hooks/useAssignments';

// ── Quiz creator form ─────────────────────────────────────────────────────────
function NewQuizForm({ lessonId, onDone }: { lessonId: string; onDone: () => void }) {
  const dispatch = useAppDispatch();
  const [title, setTitle] = useState('');
  const [passingScore, setPassingScore] = useState(70);
  const [timeLimit, setTimeLimit] = useState('');
  const createQuiz = useCreateQuiz();

  return (
    <div className="space-y-3 p-4 border rounded-lg">
      <div className="space-y-1.5">
        <Label>Quiz Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Module 1 Quiz" />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Passing Score (%)</Label>
          <Input type="number" min={0} max={100} value={passingScore} onChange={(e) => setPassingScore(Number(e.target.value))} />
        </div>
        <div className="space-y-1.5">
          <Label>Time Limit (min) <span className="text-muted-foreground text-xs">optional</span></Label>
          <Input type="number" min={1} value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} placeholder="30" />
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" disabled={!title.trim() || createQuiz.isPending}
          onClick={() => createQuiz.mutate({ lessonId, title, passingScore, timeLimitMinutes: timeLimit ? Number(timeLimit) : undefined }, {
            onSuccess: () => { dispatch(addToast({ title: 'Quiz created', variant: 'success' })); onDone(); },
            onError: (err: any) => dispatch(addToast({ title: 'Error', description: err.response?.data?.message, variant: 'destructive' })),
          })}>
          {createQuiz.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Quiz'}
        </Button>
        <Button size="sm" variant="outline" onClick={onDone}>Cancel</Button>
      </div>
    </div>
  );
}

// ── Assignment creator form ───────────────────────────────────────────────────
function NewAssignmentForm({ lessonId, onDone }: { lessonId: string; onDone: () => void }) {
  const dispatch = useAppDispatch();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [maxScore, setMaxScore] = useState(100);
  const [dueDate, setDueDate] = useState('');
  const [allowLate, setAllowLate] = useState(false);
  const createAssignment = useCreateAssignment();

  return (
    <div className="space-y-3 p-4 border rounded-lg">
      <div className="space-y-1.5">
        <Label>Assignment Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Build a TODO App" />
      </div>
      <div className="space-y-1.5">
        <Label>Instructions</Label>
        <textarea className="w-full border rounded-md p-2 text-sm resize-none min-h-[80px]" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe what students need to do…" />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Max Score</Label>
          <Input type="number" min={1} value={maxScore} onChange={(e) => setMaxScore(Number(e.target.value))} />
        </div>
        <div className="space-y-1.5">
          <Label>Due Date <span className="text-muted-foreground text-xs">optional</span></Label>
          <Input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={allowLate} onChange={(e) => setAllowLate(e.target.checked)} className="h-4 w-4" />
        Allow late submission
      </label>
      <div className="flex gap-2">
        <Button size="sm" disabled={!title.trim() || !description.trim() || createAssignment.isPending}
          onClick={() => createAssignment.mutate({ lessonId, title, instructions: description, maxScore, dueDate: dueDate || undefined, allowLateSubmission: allowLate }, {
            onSuccess: () => { dispatch(addToast({ title: 'Assignment created', variant: 'success' })); onDone(); },
            onError: (err: any) => dispatch(addToast({ title: 'Error', description: err.response?.data?.message, variant: 'destructive' })),
          })}>
          {createAssignment.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Assignment'}
        </Button>
        <Button size="sm" variant="outline" onClick={onDone}>Cancel</Button>
      </div>
    </div>
  );
}

// ── Question editor ───────────────────────────────────────────────────────────
function AddQuestionForm({ quizId, onDone }: { quizId: string; onDone: () => void }) {
  const dispatch = useAppDispatch();
  const addQuestion = useAddQuestion();
  const [text, setText] = useState('');
  const [points, setPoints] = useState(1);
  const [options, setOptions] = useState([
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ]);

  const submit = () => {
    if (!text.trim() || options.every((o) => !o.text.trim())) return;
    addQuestion.mutate(
      { quizId, text, type: 'SINGLE_CHOICE', points, options: options.filter((o) => o.text.trim()) },
      {
        onSuccess: () => { setText(''); setOptions([{ text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }]); onDone(); },
        onError: (err: any) => dispatch(addToast({ title: 'Error', description: err.response?.data?.message, variant: 'destructive' })),
      },
    );
  };

  return (
    <div className="p-4 border rounded-lg space-y-3 bg-muted/20">
      <div className="space-y-1.5">
        <Label>Question Text</Label>
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="What is…?" />
      </div>
      <div className="space-y-1.5">
        <Label>Options <span className="text-xs text-muted-foreground">(check the correct answer)</span></Label>
        {options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <input type="radio" name="correct" checked={opt.isCorrect} onChange={() => setOptions(options.map((o, j) => ({ ...o, isCorrect: j === i })))} className="h-4 w-4" />
            <Input value={opt.text} onChange={(e) => setOptions(options.map((o, j) => j === i ? { ...o, text: e.target.value } : o))} placeholder={`Option ${i + 1}`} className="h-8 text-sm" />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <Label className="text-sm">Points</Label>
        <Input type="number" min={1} value={points} onChange={(e) => setPoints(Number(e.target.value))} className="w-20 h-8" />
        <div className="flex gap-2 ml-auto">
          <Button size="sm" onClick={submit} disabled={addQuestion.isPending} className="h-7 px-3">
            {addQuestion.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Add Question'}
          </Button>
          <Button size="sm" variant="outline" onClick={onDone} className="h-7 px-3">Cancel</Button>
        </div>
      </div>
    </div>
  );
}

export default function QuizzesAssignmentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = use(params);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const [expandedQuiz, setExpandedQuiz] = useState<string | null>(null);
  const [addingQuestionFor, setAddingQuestionFor] = useState<string | null>(null);
  const [addingFor, setAddingFor] = useState<{ lessonId: string; type: 'quiz' | 'assignment' } | null>(null);
  const deleteQuestion = useDeleteQuestion();

  useEffect(() => {
    if (!user) router.replace('/auth/login');
  }, [user, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['course-qa', courseId],
    queryFn: async () => {
      const { data } = await api.get(`/courses/${courseId}/curriculum`);
      return data as {
        id: string;
        title: string;
        sections: Array<{
          id: string;
          title: string;
          lessons: Array<{ id: string; title: string; type: string; quiz?: { id: string; title: string; _count: { questions: number } } | null; assignment?: { id: string; title: string } | null }>;
        }>;
      };
    },
    enabled: Boolean(courseId),
  });

  if (!user) return null;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-3xl">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/instructor/courses/${courseId}/curriculum`}><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <h1 className="text-2xl font-bold">Quizzes & Assignments</h1>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
          </div>
        ) : (
          <div className="space-y-6">
            {data?.sections.map((section) => (
              <div key={section.id}>
                <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">{section.title}</h2>
                <div className="space-y-2">
                  {section.lessons.map((lesson) => (
                    <Card key={lesson.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{lesson.title}</p>
                            <p className="text-xs text-muted-foreground">{lesson.type}</p>
                          </div>
                          <div className="flex gap-2">
                            {!lesson.quiz && (
                              <Button size="sm" variant="outline" className="h-7 px-2 text-xs"
                                onClick={() => setAddingFor({ lessonId: lesson.id, type: 'quiz' })}>
                                <Plus className="h-3 w-3 mr-1" />Quiz
                              </Button>
                            )}
                            {!lesson.assignment && (
                              <Button size="sm" variant="outline" className="h-7 px-2 text-xs"
                                onClick={() => setAddingFor({ lessonId: lesson.id, type: 'assignment' })}>
                                <Plus className="h-3 w-3 mr-1" />Assignment
                              </Button>
                            )}
                          </div>
                        </div>

                        {addingFor?.lessonId === lesson.id && addingFor.type === 'quiz' && (
                          <div className="mt-3">
                            <NewQuizForm lessonId={lesson.id} onDone={() => setAddingFor(null)} />
                          </div>
                        )}
                        {addingFor?.lessonId === lesson.id && addingFor.type === 'assignment' && (
                          <div className="mt-3">
                            <NewAssignmentForm lessonId={lesson.id} onDone={() => setAddingFor(null)} />
                          </div>
                        )}

                        {lesson.quiz && (
                          <div className="mt-3 border rounded-md overflow-hidden">
                            <button
                              className="w-full flex items-center gap-2 px-3 py-2 bg-muted/30 hover:bg-muted/50 text-sm text-left"
                              onClick={() => setExpandedQuiz(expandedQuiz === lesson.quiz!.id ? null : lesson.quiz!.id)}
                            >
                              <HelpCircle className="h-4 w-4 text-primary" />
                              <span className="font-medium flex-1">{lesson.quiz.title}</span>
                              <span className="text-xs text-muted-foreground">{lesson.quiz._count.questions} questions</span>
                              {expandedQuiz === lesson.quiz.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </button>
                            {expandedQuiz === lesson.quiz.id && (
                              <QuizEditor quizId={lesson.quiz.id} onAddQuestion={() => setAddingQuestionFor(lesson.quiz!.id)} addingQuestion={addingQuestionFor === lesson.quiz.id} onDoneAdding={() => setAddingQuestionFor(null)} />
                            )}
                          </div>
                        )}

                        {lesson.assignment && (
                          <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md text-sm">
                            <span className="font-medium flex-1">{lesson.assignment.title}</span>
                            <Button size="sm" variant="outline" className="h-6 px-2 text-xs" asChild>
                              <Link href={`/dashboard/instructor/courses/${courseId}/assignments/${lesson.assignment.id}/submissions`}>
                                Submissions
                              </Link>
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function QuizEditor({ quizId, onAddQuestion, addingQuestion, onDoneAdding }: { quizId: string; onAddQuestion: () => void; addingQuestion: boolean; onDoneAdding: () => void }) {
  const dispatch = useAppDispatch();
  const { data: quiz } = useInstructorQuiz(quizId);
  const deleteQuestion = useDeleteQuestion();

  return (
    <div className="divide-y">
      {quiz?.questions.map((q, i) => (
        <div key={q.id} className="px-3 py-2 flex items-start gap-2">
          <span className="text-xs text-muted-foreground mt-0.5 w-5 shrink-0">{i + 1}.</span>
          <div className="flex-1 text-sm">
            <p>{q.text}</p>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {q.options.map((opt) => (
                <span key={opt.id} className={`text-xs px-2 py-0.5 rounded-full border ${opt.isCorrect ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-950/30 dark:border-green-800 dark:text-green-400' : 'bg-muted border-border text-muted-foreground'}`}>
                  {opt.isCorrect && <Check className="inline h-2.5 w-2.5 mr-0.5" />}
                  {opt.text}
                </span>
              ))}
            </div>
          </div>
          <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0"
            onClick={() => { if (confirm('Delete question?')) deleteQuestion.mutate({ questionId: q.id, quizId }, { onError: (err: any) => dispatch(addToast({ title: 'Error', description: err.response?.data?.message, variant: 'destructive' })) }); }}>
            <Trash2 className="h-3 w-3 text-destructive" />
          </Button>
        </div>
      ))}
      {addingQuestion ? (
        <div className="p-3">
          <AddQuestionForm quizId={quizId} onDone={onDoneAdding} />
        </div>
      ) : (
        <button onClick={onAddQuestion} className="w-full px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/20 flex items-center gap-1.5 transition-colors">
          <Plus className="h-3.5 w-3.5" />Add Question
        </button>
      )}
    </div>
  );
}
