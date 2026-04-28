import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface CourseDetail {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  shortSummary?: string | null;
  thumbnailUrl?: string | null;
  previewVideoUrl?: string | null;
  price: number;
  isFree: boolean;
  level: string;
  language: string;
  status: string;
  totalLessons: number;
  tags: string[];
  requirements: string[];
  objectives: string[];
  publishedAt?: string | null;
  instructor: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
    bio?: string | null;
  };
  category?: { id: string; name: string } | null;
  organization: { id: string; name: string; slug: string };
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
    }>;
  }>;
  _count: { enrollments: number; reviews: number };
  averageRating?: number;
}

export function useCourse(slug: string) {
  return useQuery<CourseDetail>({
    queryKey: ['course', slug],
    queryFn: async () => {
      const { data } = await api.get(`/courses/${slug}`);
      return data;
    },
    enabled: Boolean(slug),
    staleTime: 60_000,
  });
}
