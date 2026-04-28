import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Assignment {
  id: string;
  title: string;
  instructions: string;
  dueDate?: string | null;
  allowLateSubmission: boolean;
  maxScore: number;
  lessonId: string;
}

export interface AssignmentSubmission {
  id: string;
  content: string;
  fileUrls: string[];
  score?: number | null;
  feedback?: string | null;
  status: string;
  submittedAt: string;
  gradedAt?: string | null;
  user?: { id: string; firstName: string; lastName: string };
}

export function useAssignment(assignmentId: string) {
  return useQuery<Assignment>({
    queryKey: ['assignment', assignmentId],
    queryFn: async () => {
      const { data } = await api.get(`/assignments/${assignmentId}`);
      return data;
    },
    enabled: Boolean(assignmentId),
  });
}

export function useMySubmission(assignmentId: string) {
  return useQuery<AssignmentSubmission | null>({
    queryKey: ['assignment-submission', assignmentId, 'my'],
    queryFn: async () => {
      const { data } = await api.get(`/assignments/${assignmentId}/my-submission`);
      return data;
    },
    enabled: Boolean(assignmentId),
  });
}

export function useAllSubmissions(assignmentId: string) {
  return useQuery<AssignmentSubmission[]>({
    queryKey: ['assignment-submissions', assignmentId],
    queryFn: async () => {
      const { data } = await api.get(`/assignments/${assignmentId}/submissions`);
      return data;
    },
    enabled: Boolean(assignmentId),
  });
}

export function useSubmitAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      assignmentId,
      content,
      fileUrls,
    }: {
      assignmentId: string;
      content: string;
      fileUrls?: string[];
    }) => api.post(`/assignments/${assignmentId}/submit`, { content, fileUrls: fileUrls ?? [] }),

    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['assignment-submission', vars.assignmentId, 'my'] });
    },
  });
}

export function useGradeSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      assignmentId,
      submissionId,
      score,
      feedback,
    }: {
      assignmentId: string;
      submissionId: string;
      score: number;
      feedback?: string;
    }) =>
      api.post(`/assignments/submissions/${submissionId}/grade`, {
        score,
        feedback,
      }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['assignment-submissions', vars.assignmentId] });
    },
  });
}

export function useCreateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      lessonId: string;
      title: string;
      instructions: string;
      maxScore?: number;
      dueDate?: string;
      allowLateSubmission?: boolean;
    }) => {
      const { lessonId, ...rest } = payload;
      return api.post(`/assignments/lesson/${lessonId}`, rest);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['instructor-courses'] }),
  });
}
