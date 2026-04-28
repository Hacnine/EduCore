import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Certificate {
  id: string;
  certificateNumber: string;
  status: string;
  issuedAt: string;
  expiresAt?: string | null;
  pdfUrl?: string | null;
  course: { id: string; title: string; slug: string; thumbnailUrl?: string | null };
}

export function useCertificates() {
  return useQuery<Certificate[]>({
    queryKey: ['certificates', 'my'],
    queryFn: async () => {
      const { data } = await api.get('/certificates/my');
      return data;
    },
    staleTime: 60_000,
  });
}
