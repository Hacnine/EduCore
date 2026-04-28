import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface InstructorStats {
  totalCourses: number;
  totalStudents: number;
  totalRevenue: number;
  totalEnrollments: number;
  averageRating: number;
}

export function useInstructorStats() {
  return useQuery<InstructorStats>({
    queryKey: ['instructor-stats'],
    queryFn: async () => {
      const { data } = await api.get('/analytics/instructor-stats');
      return data;
    },
    staleTime: 60_000,
  });
}

export function useCreateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      organizationId: string;
      title: string;
      description?: string;
      shortSummary?: string;
      price?: number;
      isFree?: boolean;
      level?: string;
      language?: string;
      categoryId?: string;
      tags?: string[];
      requirements?: string[];
      objectives?: string[];
    }) => api.post('/courses', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['instructor-courses'] }),
  });
}

export function useUpdateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string; [key: string]: any }) =>
      api.patch(`/courses/${id}`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['instructor-courses'] }),
  });
}

export function usePublishCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/courses/${id}/publish`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['instructor-courses'] }),
  });
}

export function useUnpublishCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/courses/${id}/unpublish`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['instructor-courses'] }),
  });
}

export function useDeleteCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/courses/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['instructor-courses'] }),
  });
}

export function useCreateSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, title, position }: { courseId: string; title: string; position?: number }) =>
      api.post(`/courses/${courseId}/sections`, { title, position }),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['course-curriculum', vars.courseId] }),
  });
}

export function useUpdateSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sectionId, courseId, ...payload }: { sectionId: string; courseId: string; title?: string; position?: number }) =>
      api.patch(`/sections/${sectionId}`, payload),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['course-curriculum', vars.courseId] }),
  });
}

export function useDeleteSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sectionId, courseId }: { sectionId: string; courseId: string }) =>
      api.delete(`/sections/${sectionId}`),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['course-curriculum', vars.courseId] }),
  });
}

export function useCreateLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      sectionId,
      courseId,
      ...payload
    }: {
      sectionId: string;
      courseId: string;
      title: string;
      type: string;
      videoUrl?: string;
      content?: string;
      duration?: number;
      isFree?: boolean;
      position?: number;
    }) => api.post(`/sections/${sectionId}/lessons`, payload),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['course-curriculum', vars.courseId] }),
  });
}

export function useUpdateLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      lessonId,
      courseId,
      ...payload
    }: {
      lessonId: string;
      courseId: string;
      [key: string]: any;
    }) => api.patch(`/lessons/${lessonId}`, payload),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['course-curriculum', vars.courseId] }),
  });
}

export function useDeleteLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ lessonId, courseId }: { lessonId: string; courseId: string }) =>
      api.delete(`/lessons/${lessonId}`),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['course-curriculum', vars.courseId] }),
  });
}

export function useCourseStudents(courseId: string) {
  return useQuery({
    queryKey: ['course-students', courseId],
    queryFn: async () => {
      const { data } = await api.get(`/enrollments/course/${courseId}`);
      return data as Array<{
        id: string;
        progress: number;
        status: string;
        enrolledAt: string;
        user: { id: string; firstName: string; lastName: string; email: string; avatarUrl?: string | null };
      }>;
    },
    enabled: Boolean(courseId),
  });
}

export function useCourseCurriculum(courseId: string) {
  return useQuery({
    queryKey: ['course-curriculum', courseId],
    queryFn: async () => {
      const { data } = await api.get(`/courses/${courseId}/curriculum`);
      return data as {
        sections: Array<{
          id: string;
          title: string;
          position: number;
          lessons: Array<{
            id: string;
            title: string;
            type: string;
            duration?: number | null;
            isFree: boolean;
            position: number;
            videoUrl?: string | null;
          }>;
        }>;
      };
    },
    enabled: Boolean(courseId),
  });
}
