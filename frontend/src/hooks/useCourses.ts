import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface CourseFilters {
  search?: string;
  categoryId?: string;
  level?: string;
  isFree?: boolean;
  organizationId?: string;
  page?: number;
  limit?: number;
}

export interface CourseCard {
  id: string;
  title: string;
  slug: string;
  shortSummary?: string | null;
  thumbnailUrl?: string | null;
  price: number;
  isFree: boolean;
  level: string;
  language: string;
  totalLessons: number;
  status: string;
  publishedAt?: string | null;
  instructor: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
  };
  category?: { id: string; name: string } | null;
  organization: { id: string; name: string; slug: string };
  _count: { enrollments: number; reviews: number };
  averageRating?: number;
}

interface CoursesResponse {
  courses: CourseCard[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function useCourses(filters: CourseFilters = {}, initialData?: CoursesResponse) {
  return useQuery<CoursesResponse>({
    queryKey: ['courses', filters],
    queryFn: async () => {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== undefined && v !== ''),
      );
      const { data } = await api.get('/courses', { params });
      return data;
    },
    staleTime: 30_000,
    initialData,
  });
}
