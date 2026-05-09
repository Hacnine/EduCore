// SSR — rendered fresh on every request; protected route with server-side redirect
// Uses force-dynamic so Next.js never caches this page and always runs the server function
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import DashboardClient, { type UserProfile } from './dashboard-client';
import type { Enrollment } from '@/hooks/useEnrollments';

export const dynamic = 'force-dynamic';

async function fetchProfile(token: string): Promise<UserProfile | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';
  try {
    const res = await fetch(`${apiUrl}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function fetchEnrollments(token: string): Promise<Enrollment[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';
  try {
    const res = await fetch(`${apiUrl}/enrollments/my`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function DashboardPage() {
  const token = cookies().get('accessToken')?.value;

  // Server-side redirect — no client flash, no blank screen
  if (!token) redirect('/auth/login');

  // Both requests run in parallel on the server before any HTML is sent
  const [user, enrollments] = await Promise.all([
    fetchProfile(token),
    fetchEnrollments(token),
  ]);

  if (!user) redirect('/auth/login');

  // Hand off to client component; React Query is seeded with this data (Hydration)
  return <DashboardClient initialUser={user} initialEnrollments={enrollments} />;
}
