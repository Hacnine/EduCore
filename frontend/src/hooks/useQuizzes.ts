import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface QuizOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}

export interface QuizQuestion {
  id: string;
  text: string;
  type: string;
  points: number;
  options: QuizOption[];
}

export interface Quiz {
  id: string;
  title: string;
  description?: string | null;
  passingScore: number;
  shuffleQuestions: boolean;
  timeLimit?: number | null; // in seconds
  lessonId: string;
  questions: QuizQuestion[];
}

export interface QuizAttempt {
  id: string;
  score: number;
  isPassed: boolean;
  completedAt: string;
  responses: Array<{
    question: { id: string; text: string; type: string; points: number };
    selectedOption?: { id: string; text: string } | null;
    isCorrect: boolean;
    pointsEarned: number;
  }>;
}

export function useQuiz(quizId: string) {
  return useQuery<Quiz>({
    queryKey: ['quiz', quizId],
    queryFn: async () => {
      const { data } = await api.get(`/quizzes/${quizId}`);
      return data;
    },
    enabled: Boolean(quizId),
  });
}

export function useInstructorQuiz(quizId: string) {
  return useQuery<Quiz>({
    queryKey: ['quiz-instructor', quizId],
    queryFn: async () => {
      const { data } = await api.get(`/quizzes/${quizId}/instructor`);
      return data;
    },
    enabled: Boolean(quizId),
  });
}

export function useQuizAttempt(attemptId: string) {
  return useQuery<QuizAttempt>({
    queryKey: ['quiz-attempt', attemptId],
    queryFn: async () => {
      const { data } = await api.get(`/quizzes/attempts/${attemptId}`);
      return data;
    },
    enabled: Boolean(attemptId),
  });
}

export function useSubmitQuiz() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      quizId,
      responses,
    }: {
      quizId: string;
      responses: Array<{ questionId: string; selectedOptionId?: string }>;
    }) => {
      // Step 1: start attempt
      const { data: attempt } = await api.post(`/quizzes/${quizId}/attempts/start`);
      const attemptId: string = attempt.id;
      // Step 2: submit with selectedOptionIds as array
      const { data } = await api.post(`/quizzes/attempts/${attemptId}/submit`, {
        responses: responses.map((r) => ({
          questionId: r.questionId,
          selectedOptionIds: r.selectedOptionId ? [r.selectedOptionId] : [],
        })),
      });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['enrollments'] }),
  });
}

export function useCreateQuiz() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      lessonId: string;
      title: string;
      description?: string;
      passingScore?: number;
      timeLimitMinutes?: number;
      shuffleQuestions?: boolean;
    }) => {
      const { lessonId, timeLimitMinutes, ...rest } = payload;
      return api.post(`/quizzes/lesson/${lessonId}`, {
        ...rest,
        timeLimit: timeLimitMinutes ? timeLimitMinutes * 60 : undefined,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['instructor-courses'] }),
  });
}

export function useAddQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      quizId,
      ...payload
    }: {
      quizId: string;
      text: string;
      type: string;
      points?: number;
      options: Array<{ text: string; isCorrect: boolean }>;
    }) => api.post(`/quizzes/${quizId}/questions`, payload),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['quiz-instructor', vars.quizId] }),
  });
}

export function useUpdateQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      questionId,
      quizId,
      ...payload
    }: {
      questionId: string;
      quizId: string;
      text?: string;
      points?: number;
      options?: Array<{ text: string; isCorrect: boolean }>;
    }) => api.patch(`/quizzes/questions/${questionId}`, payload),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['quiz-instructor', vars.quizId] }),
  });
}

export function useDeleteQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ questionId, quizId }: { questionId: string; quizId: string }) =>
      api.delete(`/quizzes/questions/${questionId}`),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['quiz-instructor', vars.quizId] }),
  });
}
