import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Enrollment {
  id: string;
  status: string;
  progress: number;
  enrolledAt: string;
  completedAt?: string | null;
  course: {
    id: string;
    title: string;
    slug: string;
    thumbnailUrl?: string | null;
    totalLessons: number;
    instructor: { firstName: string; lastName: string };
  };
}

export function useEnrollments() {
  return useQuery<Enrollment[]>({
    queryKey: ['enrollments', 'my'],
    queryFn: async () => {
      const { data } = await api.get('/enrollments/my');
      return data;
    },
    staleTime: 30_000,
  });
}
