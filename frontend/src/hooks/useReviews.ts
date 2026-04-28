import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Review {
  id: string;
  rating: number;
  body?: string | null;
  isVisible: boolean;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string; avatarUrl?: string | null };
}

export function useReviews(courseId: string) {
  return useQuery<Review[]>({
    queryKey: ['reviews', courseId],
    queryFn: async () => {
      const { data } = await api.get(`/reviews/course/${courseId}`);
      // API returns { reviews, total, avgRating, page, limit }
      return data.reviews ?? data;
    },
    enabled: Boolean(courseId),
    staleTime: 60_000,
  });
}

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { courseId: string; rating: number; body?: string }) =>
      api.post('/reviews', payload),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['reviews', vars.courseId] }),
  });
}
