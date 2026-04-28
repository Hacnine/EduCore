import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  children?: Category[];
}

export function useCategories(organizationId?: string) {
  return useQuery<Category[]>({
    queryKey: ['categories', organizationId],
    queryFn: async () => {
      const { data } = await api.get('/categories', {
        params: organizationId ? { organizationId } : undefined,
      });
      return data;
    },
    staleTime: 300_000,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      organizationId: string;
      name: string;
      description?: string;
      parentId?: string;
    }) => api.post('/categories', payload, { params: { organizationId: payload.organizationId } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, organizationId }: { id: string; organizationId: string }) =>
      api.delete(`/categories/${id}`, { params: { organizationId } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });
}
