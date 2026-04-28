import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Coupon {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  maxUses?: number | null;
  usedCount: number;
  isActive: boolean;
  expiresAt?: string | null;
  courseId: string;
}

export function useCourseCoupons(courseId: string) {
  return useQuery<Coupon[]>({
    queryKey: ['coupons', courseId],
    queryFn: async () => {
      const { data } = await api.get(`/payments/coupons/course/${courseId}`);
      return data;
    },
    enabled: Boolean(courseId),
  });
}

export function useCreateCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      courseId: string;
      code: string;
      discountType: 'PERCENTAGE' | 'FIXED';
      discountValue: number;
      maxUses?: number;
      expiresAt?: string;
    }) => api.post('/payments/coupons', payload),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['coupons', vars.courseId] }),
  });
}

export function useDeactivateCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; courseId: string }) =>
      api.patch(`/payments/coupons/${id}/deactivate`),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['coupons', vars.courseId] }),
  });
}

export function useDeleteCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; courseId: string }) =>
      api.delete(`/payments/coupons/${id}`),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['coupons', vars.courseId] }),
  });
}

export function useValidateCoupon() {
  return useMutation({
    mutationFn: ({ code, courseId }: { code: string; courseId: string }) =>
      api.get('/payments/coupons/validate', { params: { code, courseId } }),
  });
}
