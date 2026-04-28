'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, Plus, Pencil, Trash2, Loader2, GripVertical,
  ChevronDown, ChevronRight, PlayCircle, FileText, HelpCircle, Clipboard,
  Check, X,
} from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppDispatch, useAppSelector } from '@/store';
import { addToast } from '@/store/slices/uiSlice';
import { api } from '@/lib/api';
import {
  useCreateSection, useUpdateSection, useDeleteSection,
  useCreateLesson, useUpdateLesson, useDeleteLesson,
} from '@/hooks/useInstructor';
import { cn, formatDuration } from '@/lib/utils';

const lessonTypeIcon: Record<string, React.ElementType> = {
  VIDEO: PlayCircle,
  TEXT: FileText,
  QUIZ: HelpCircle,
  ASSIGNMENT: Clipboard,
};

interface Lesson {
  id: string; title: string; type: string; duration?: number | null; isFree: boolean; position: number; videoUrl?: string | null;
}
interface Section {
  id: string; title: string; position: number; lessons: Lesson[];
}

function InlineEdit({ value, onSave, className }: { value: string; onSave: (v: string) => void; className?: string }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  if (!editing) return (
    <button onClick={() => setEditing(true)} className={cn('text-left hover:underline decoration-dashed underline-offset-2', className)}>
      {value}
    </button>
  );
  return (
    <div className="flex items-center gap-2">
      <Input value={val} onChange={(e) => setVal(e.target.value)} className="h-7 text-sm" autoFocus onKeyDown={(e) => { if (e.key === 'Enter') { onSave(val); setEditing(false); } if (e.key === 'Escape') { setVal(value); setEditing(false); } }} />
      <button onClick={() => { onSave(val); setEditing(false); }} className="text-green-600 hover:text-green-700"><Check className="h-4 w-4" /></button>
      <button onClick={() => { setVal(value); setEditing(false); }} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
    </div>
  );
}

function AddLessonForm({ sectionId, courseId, onDone }: { sectionId: string; courseId: string; onDone: () => void }) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('VIDEO');
  const [videoUrl, setVideoUrl] = useState('');
  const [isFree, setIsFree] = useState(false);
  const createLesson = useCreateLesson();
  const dispatch = useAppDispatch();

  const submit = () => {
    if (!title.trim()) return;
    createLesson.mutate(
      { sectionId, courseId, title: title.trim(), type, videoUrl: videoUrl || undefined, isFree },
      {
        onSuccess: () => { setTitle(''); setVideoUrl(''); onDone(); },
        onError: (err: any) => dispatch(addToast({ title: 'Error', description: err.response?.data?.message, variant: 'destructive' })),
      },
    );
  };

  return (
    <div className="p-3 bg-muted/30 rounded-md space-y-2 mt-2">
      <div className="flex gap-2">
        <Input placeholder="Lesson title" value={title} onChange={(e) => setTitle(e.target.value)} className="h-8 text-sm" />
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-32 h-8 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="VIDEO">Video</SelectItem>
            <SelectItem value="TEXT">Text</SelectItem>
            <SelectItem value="QUIZ">Quiz</SelectItem>
            <SelectItem value="ASSIGNMENT">Assignment</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {type === 'VIDEO' && (
        <Input placeholder="Video URL" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} className="h-8 text-sm" />
      )}
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isFree} onChange={(e) => setIsFree(e.target.checked)} className="h-3.5 w-3.5" />
          Free preview
        </label>
        <div className="flex gap-2 ml-auto">
          <Button size="sm" variant="outline" onClick={onDone} className="h-7 px-2 text-xs">Cancel</Button>
          <Button size="sm" onClick={submit} disabled={createLesson.isPending} className="h-7 px-2 text-xs">
            {createLesson.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Add'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function SectionBlock({ section, courseId }: { section: Section; courseId: string }) {
  const [open, setOpen] = useState(true);
  const [addingLesson, setAddingLesson] = useState(false);
  const dispatch = useAppDispatch();
  const updateSection = useUpdateSection();
  const deleteSection = useDeleteSection();
  const deleteLesson = useDeleteLesson();
  const updateLesson = useUpdateLesson();

  const handleDeleteLesson = (lessonId: string) => {
    if (!confirm('Delete this lesson?')) return;
    deleteLesson.mutate({ lessonId, courseId }, {
      onError: (err: any) => dispatch(addToast({ title: 'Error', description: err.response?.data?.message, variant: 'destructive' })),
    });
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-muted/30">
        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab shrink-0" />
        <button onClick={() => setOpen(!open)} className="mr-1">
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        <div className="flex-1">
          <InlineEdit
            value={section.title}
            className="font-medium text-sm"
            onSave={(v) => updateSection.mutate({ sectionId: section.id, courseId, title: v }, {
              onError: (err: any) => dispatch(addToast({ title: 'Error', description: err.response?.data?.message, variant: 'destructive' })),
            })}
          />
        </div>
        <span className="text-xs text-muted-foreground">{section.lessons.length} lessons</span>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={() => { if (confirm('Delete this section and all its lessons?')) deleteSection.mutate({ sectionId: section.id, courseId }); }}
        >
          <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
        </Button>
      </div>

      {open && (
        <div className="divide-y">
          {section.lessons
            .slice()
            .sort((a, b) => a.position - b.position)
            .map((lesson) => {
              const Icon = lessonTypeIcon[lesson.type] ?? FileText;
              return (
                <div key={lesson.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/20 group">
                  <GripVertical className="h-3.5 w-3.5 text-muted-foreground cursor-grab shrink-0" />
                  <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="flex-1 text-sm">{lesson.title}</span>
                  {lesson.isFree && <Badge variant="outline" className="text-xs py-0">Preview</Badge>}
                  {lesson.duration && <span className="text-xs text-muted-foreground">{formatDuration(lesson.duration)}</span>}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => {
                        const newTitle = prompt('Lesson title:', lesson.title);
                        if (newTitle && newTitle !== lesson.title) {
                          updateLesson.mutate({ lessonId: lesson.id, courseId, title: newTitle });
                        }
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleDeleteLesson(lesson.id)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })}
          {addingLesson ? (
            <div className="px-4 pb-3">
              <AddLessonForm sectionId={section.id} courseId={courseId} onDone={() => setAddingLesson(false)} />
            </div>
          ) : (
            <button
              onClick={() => setAddingLesson(true)}
              className="w-full px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/20 flex items-center gap-2 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add lesson
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function CurriculumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = use(params);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const createSection = useCreateSection();
  const [addingSection, setAddingSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');

  useEffect(() => {
    if (!user) router.replace('/auth/login');
  }, [user, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['course-curriculum', courseId],
    queryFn: async () => {
      const { data } = await api.get(`/courses/${courseId}/curriculum`);
      return data as { id: string; title: string; sections: Section[] };
    },
    enabled: Boolean(courseId),
  });

  const handleAddSection = () => {
    if (!newSectionTitle.trim()) return;
    createSection.mutate(
      { courseId, title: newSectionTitle.trim() },
      {
        onSuccess: () => { setNewSectionTitle(''); setAddingSection(false); },
        onError: (err: any) => dispatch(addToast({ title: 'Error', description: err.response?.data?.message, variant: 'destructive' })),
      },
    );
  };

  if (!user) return null;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/dashboard/instructor/courses/${courseId}/edit`}><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Curriculum</h1>
              {data && <p className="text-sm text-muted-foreground">{data.title}</p>}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/instructor/courses/${courseId}/students`}>Students</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/instructor/courses/${courseId}/coupons`}>Coupons</Link>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
          </div>
        ) : (
          <div className="space-y-3">
            {data?.sections
              .slice()
              .sort((a, b) => a.position - b.position)
              .map((section) => (
                <SectionBlock key={section.id} section={section} courseId={courseId} />
              ))}

            {addingSection ? (
              <div className="border rounded-lg p-4 space-y-3">
                <Input
                  placeholder="Section title"
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddSection(); if (e.key === 'Escape') setAddingSection(false); }}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddSection} disabled={createSection.isPending}>
                    {createSection.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Section'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setAddingSection(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <Button variant="outline" className="w-full" onClick={() => setAddingSection(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Section
              </Button>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
