import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface DiscussionComment {
  id: string;
  body: string;
  upvotes: number;
  isAnswer: boolean;
  createdAt: string;
  parentId?: string | null;
  user: { id: string; firstName: string; lastName: string; avatarUrl?: string | null };
  replies?: DiscussionComment[];
}

export interface Discussion {
  id: string;
  title: string;
  body: string;
  isPinned: boolean;
  isResolved: boolean;
  upvotes: number;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string; avatarUrl?: string | null };
  _count: { comments: number };
}

export function useDiscussions(courseId: string) {
  return useQuery<Discussion[]>({
    queryKey: ['discussions', courseId],
    queryFn: async () => {
      const { data } = await api.get(`/discussions/course/${courseId}`);
      return data.discussions ?? data;
    },
    enabled: Boolean(courseId),
    staleTime: 30_000,
  });
}

// Fetch full discussion including nested comments
export function useDiscussionComments(discussionId: string, enabled = false) {
  return useQuery<DiscussionComment[]>({
    queryKey: ['discussion-comments', discussionId],
    queryFn: async () => {
      const { data } = await api.get(`/discussions/${discussionId}`);
      return data.comments ?? [];
    },
    enabled: enabled && Boolean(discussionId),
  });
}

export function useCreateDiscussion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { courseId: string; title: string; body: string }) =>
      api.post('/discussions', payload),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['discussions', vars.courseId] }),
  });
}

export function useCreateComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ discussionId, body, parentId }: { discussionId: string; body: string; parentId?: string }) =>
      api.post(`/discussions/${discussionId}/comments`, { body, parentId }),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['discussion-comments', vars.discussionId] }),
  });
}

export function useUpvoteDiscussion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, courseId }: { id: string; courseId: string }) =>
      api.post(`/discussions/${id}/upvote`),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['discussions', vars.courseId] }),
  });
}

export function useResolveDiscussion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) => api.patch(`/discussions/${id}/resolve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['discussions'] }),
  });
}
