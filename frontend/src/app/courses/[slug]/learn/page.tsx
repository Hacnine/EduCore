'use client';

import { use, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ReactPlayer from 'react-player';
import {
  ChevronLeft, ChevronDown, ChevronRight, CheckCircle2, Circle,
  PlayCircle, FileText, HelpCircle, Clipboard, Menu, X, Loader2,
  MessageSquare, ThumbsUp, Send, ChevronUp,
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAppSelector, useAppDispatch } from '@/store';
import { addToast } from '@/store/slices/uiSlice';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn, formatDuration, getInitials } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { useDiscussions, useDiscussionComments, useCreateDiscussion, useCreateComment, useUpvoteDiscussion } from '@/hooks/useDiscussions';

interface LessonDetail {
  id: string;
  title: string;
  type: string;
  videoUrl?: string | null;
  content?: string | null;
  duration?: number | null;
  isFree: boolean;
  section: { title: string };
  userProgress?: { completed: boolean; watchedSeconds?: number } | null;
}

interface EnrollmentDetail {
  id: string;
  progress: number;
  status: string;
  course: {
    id: string;
    title: string;
    slug: string;
    sections: Array<{
      id: string;
      title: string;
      position: number;
      lessons: Array<{
        id: string;
        title: string;
        type: string;
        duration?: number | null;
        position: number;
        userProgress?: { completed: boolean } | null;
      }>;
    }>;
  };
}

const lessonTypeIcon: Record<string, React.ElementType> = {
  VIDEO: PlayCircle,
  TEXT: FileText,
  QUIZ: HelpCircle,
  ASSIGNMENT: Clipboard,
};

// ── Discussion thread per lesson ────────────────────────────────────────────
function DiscussionThread({ courseId }: { courseId: string }) {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const { data: discussions, isLoading } = useDiscussions(courseId);
  const createDiscussion = useCreateDiscussion();
  const upvote = useUpvoteDiscussion();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="mt-8 border-t pt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold flex items-center gap-2"><MessageSquare className="h-4 w-4" />Discussions</h2>
        <Button size="sm" variant="outline" onClick={() => setShowForm(true)} className="h-7 px-3">
          <Send className="h-3.5 w-3.5 mr-1" />Ask a question
        </Button>
      </div>

      {showForm && (
        <div className="p-4 border rounded-lg space-y-3 mb-4">
          <input className="w-full border rounded-md p-2 text-sm" placeholder="Title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
          <textarea className="w-full border rounded-md p-2 text-sm resize-none min-h-[80px]" placeholder="Describe your question…" value={newContent} onChange={(e) => setNewContent(e.target.value)} />
          <div className="flex gap-2">
            <Button size="sm" className="h-7 px-3" disabled={!newTitle.trim() || !newContent.trim() || createDiscussion.isPending}
              onClick={() => createDiscussion.mutate({ courseId, title: newTitle, body: newContent }, {
                onSuccess: () => { setNewTitle(''); setNewContent(''); setShowForm(false); },
                onError: (err: any) => dispatch(addToast({ title: 'Error', description: err.response?.data?.message, variant: 'destructive' })),
              })}>
              {createDiscussion.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Post'}
            </Button>
            <Button size="sm" variant="outline" className="h-7 px-3" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {isLoading ? <Skeleton className="h-20 rounded-lg" /> : !discussions?.length ? (
        <p className="text-sm text-muted-foreground">No discussions yet. Start one!</p>
      ) : (
        <div className="space-y-3">
          {discussions.map((d) => (
            <div key={d.id} className="border rounded-lg overflow-hidden">
              <button className="w-full flex items-start gap-3 p-4 text-left hover:bg-muted/20 transition-colors" onClick={() => setExpandedId(expandedId === d.id ? null : d.id)}>
                <Avatar className="h-7 w-7 shrink-0">
                  {d.user?.avatarUrl && <AvatarImage src={d.user.avatarUrl} />}
                  <AvatarFallback className="text-xs">{getInitials(d.user?.firstName ?? '?', d.user?.lastName ?? '')}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{d.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{d.body}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                  {d.isResolved && <Badge variant="outline" className="text-xs text-green-600 border-green-400">Resolved</Badge>}
                  <span className="flex items-center gap-1"><ThumbsUp className="h-3.5 w-3.5" />{d.upvotes ?? 0}</span>
                  <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" />{d._count?.comments ?? 0}</span>
                  {expandedId === d.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>
              {expandedId === d.id && <DiscussionComments discussionId={d.id} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DiscussionComments({ discussionId }: { discussionId: string }) {
  const dispatch = useAppDispatch();
  const { data: comments } = useDiscussionComments(discussionId, true);
  const createComment = useCreateComment();
  const [text, setText] = useState('');

  return (
    <div className="border-t bg-muted/10 px-4 pb-4">
      <div className="py-3 space-y-3">
        {comments?.map((c) => (
          <div key={c.id} className="flex gap-2">
            <Avatar className="h-6 w-6 shrink-0">
              {c.user?.avatarUrl && <AvatarImage src={c.user.avatarUrl} />}
              <AvatarFallback className="text-xs">{getInitials(c.user?.firstName ?? '?', c.user?.lastName ?? '')}</AvatarFallback>
            </Avatar>
            <div>
              <span className="text-xs font-medium">{c.user?.firstName} </span>
              <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</span>
              <p className="text-sm mt-0.5">{c.body}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-2">
        <input className="flex-1 border rounded-md px-2 py-1 text-sm" placeholder="Write a reply…" value={text} onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && text.trim()) { createComment.mutate({ discussionId, body: text }, { onSuccess: () => setText(''), onError: (err: any) => dispatch(addToast({ title: 'Error', description: err.response?.data?.message, variant: 'destructive' })) }); } }} />
        <Button size="sm" className="h-8 px-2" disabled={!text.trim() || createComment.isPending}
          onClick={() => createComment.mutate({ discussionId, body: text }, { onSuccess: () => setText(''), onError: (err: any) => dispatch(addToast({ title: 'Error', description: err.response?.data?.message, variant: 'destructive' })) })}>
          <Send className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export default function LearnPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const qc = useQueryClient();
  const { user } = useAppSelector((s) => s.auth);

  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  // Fetch enrollment with course structure
  const { data: enrollment, isLoading: enrollLoading } = useQuery<EnrollmentDetail>({
    queryKey: ['enrollment', slug],
    queryFn: async () => {
      const { data } = await api.get(`/enrollments/${slug}`);
      return data;
    },
    enabled: Boolean(user && slug),
    onSuccess: (data) => {
      // Auto-open first section, select first incomplete lesson
      if (!activeLessonId) {
        const firstSection = data.course.sections.sort((a, b) => a.position - b.position)[0];
        if (firstSection) {
          setOpenSections({ [firstSection.id]: true });
          const firstIncomplete = firstSection.lessons
            .sort((a, b) => a.position - b.position)
            .find((l) => !l.userProgress?.completed);
          const firstLesson = firstIncomplete ?? firstSection.lessons[0];
          if (firstLesson) setActiveLessonId(firstLesson.id);
        }
      }
    },
  } as any);

  // Fetch active lesson detail
  const { data: activeLesson, isLoading: lessonLoading } = useQuery<LessonDetail>({
    queryKey: ['lesson', activeLessonId],
    queryFn: async () => {
      const { data } = await api.get(`/lessons/${activeLessonId}`);
      return data;
    },
    enabled: Boolean(activeLessonId),
    staleTime: 10_000,
  });

  // Mark progress mutation
  const progressMutation = useMutation({
    mutationFn: ({ lessonId, completed, watchedSeconds }: { lessonId: string; completed: boolean; watchedSeconds?: number }) =>
      api.patch(`/lessons/${lessonId}/progress`, { completed, watchedSeconds }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['enrollment', slug] });
      qc.invalidateQueries({ queryKey: ['lesson', activeLessonId] });
    },
    onError: () => {
      dispatch(addToast({ title: 'Could not save progress', variant: 'destructive' }));
    },
  });

  const markComplete = useCallback(() => {
    if (!activeLessonId) return;
    progressMutation.mutate({ lessonId: activeLessonId, completed: true });
  }, [activeLessonId, progressMutation]);

  const handleVideoProgress = useCallback(
    ({ playedSeconds }: { playedSeconds: number }) => {
      if (!activeLessonId || !activeLesson?.duration) return;
      const pct = (playedSeconds / activeLesson.duration) * 100;
      if (pct >= 90 && !activeLesson.userProgress?.completed) {
        progressMutation.mutate({ lessonId: activeLessonId, completed: true, watchedSeconds: Math.floor(playedSeconds) });
      }
    },
    [activeLessonId, activeLesson, progressMutation],
  );

  // Navigate to next lesson
  const handleNext = () => {
    if (!enrollment) return;
    const allLessons = enrollment.course.sections
      .sort((a, b) => a.position - b.position)
      .flatMap((s) => s.lessons.sort((a, b) => a.position - b.position));
    const idx = allLessons.findIndex((l) => l.id === activeLessonId);
    if (idx < allLessons.length - 1) {
      setActiveLessonId(allLessons[idx + 1].id);
    }
  };

  if (!user) {
    router.replace('/auth/login');
    return null;
  }

  if (enrollLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!enrollment) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-lg font-semibold">You are not enrolled in this course.</p>
        <Button asChild><Link href={`/courses/${slug}`}>View course</Link></Button>
      </div>
    );
  }

  const sortedSections = enrollment.course.sections.sort((a, b) => a.position - b.position);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center gap-3 border-b bg-background px-4 py-2 shrink-0">
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="shrink-0">
          {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
        <Link href={`/courses/${slug}`} className="text-sm font-medium hover:text-primary transition-colors line-clamp-1 flex items-center gap-1">
          <ChevronLeft className="h-4 w-4 shrink-0" />
          {enrollment.course.title}
        </Link>
        <div className="ml-auto flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
            <span>{enrollment.progress}% complete</span>
            <Progress value={enrollment.progress} className="h-1.5 w-24" />
          </div>
          {enrollment.status === 'COMPLETED' && (
            <Badge variant="success">Completed</Badge>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="w-72 shrink-0 border-r bg-background flex flex-col overflow-hidden">
            <div className="p-4 border-b">
              <p className="font-semibold text-sm">Course Content</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {sortedSections.flatMap((s) => s.lessons).filter((l) => l.userProgress?.completed).length}/
                {sortedSections.flatMap((s) => s.lessons).length} lessons completed
              </p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {sortedSections.map((section) => {
                const isOpen = openSections[section.id] ?? false;
                return (
                  <div key={section.id}>
                    <button
                      onClick={() => setOpenSections((o) => ({ ...o, [section.id]: !o[section.id] }))}
                      className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
                    >
                      <span className="text-xs font-semibold line-clamp-1">{section.title}</span>
                      {isOpen ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
                    </button>
                    {isOpen && (
                      <div>
                        {section.lessons.sort((a, b) => a.position - b.position).map((lesson) => {
                          const Icon = lessonTypeIcon[lesson.type] ?? PlayCircle;
                          const isActive = lesson.id === activeLessonId;
                          const isComplete = lesson.userProgress?.completed;
                          return (
                            <button
                              key={lesson.id}
                              onClick={() => setActiveLessonId(lesson.id)}
                              className={cn(
                                'w-full flex items-start gap-2.5 px-4 py-2.5 text-left text-xs hover:bg-accent transition-colors',
                                isActive && 'bg-accent text-accent-foreground font-medium',
                              )}
                            >
                              {isComplete ? (
                                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary" />
                              ) : (
                                <Circle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-muted-foreground" />
                              )}
                              <span className="flex-1 line-clamp-2">{lesson.title}</span>
                              {lesson.duration && (
                                <span className="shrink-0 text-muted-foreground">{formatDuration(lesson.duration)}</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    <Separator />
                  </div>
                );
              })}
            </div>
          </aside>
        )}

        {/* Main lesson area */}
        <main className="flex-1 overflow-y-auto bg-background">
          {lessonLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !activeLesson ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 p-8">
              <PlayCircle className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">Select a lesson to start learning</p>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto px-4 py-8">
              {/* Breadcrumb */}
              <p className="text-xs text-muted-foreground mb-2">{activeLesson.section.title}</p>
              <h1 className="text-2xl font-bold mb-6">{activeLesson.title}</h1>

              {/* Video */}
              {activeLesson.type === 'VIDEO' && activeLesson.videoUrl && (
                <div className="relative aspect-video rounded-lg overflow-hidden bg-black mb-6">
                  <ReactPlayer
                    url={activeLesson.videoUrl}
                    width="100%"
                    height="100%"
                    controls
                    onProgress={handleVideoProgress}
                    config={{
                      youtube: { playerVars: { modestbranding: 1 } },
                    }}
                  />
                </div>
              )}

              {/* Text content */}
              {activeLesson.content && (
                <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-line mb-6">
                  {activeLesson.content}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between gap-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  {activeLesson.userProgress?.completed ? (
                    <div className="flex items-center gap-1.5 text-sm text-primary font-medium">
                      <CheckCircle2 className="h-4 w-4" />
                      Completed
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={markComplete}
                      disabled={progressMutation.isPending}
                    >
                      {progressMutation.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                      Mark as complete
                    </Button>
                  )}
                </div>
                <Button size="sm" onClick={handleNext}>
                  Next lesson
                  <ChevronRight className="ml-1.5 h-4 w-4" />
                </Button>
              </div>

              {/* Discussions */}
              <DiscussionThread courseId={enrollment.course.id} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
