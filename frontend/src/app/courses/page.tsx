import { Suspense } from 'react';
import CoursesClient from './courses-client';

// ISR: revalidate course listing every 60 seconds
export const revalidate = 60;

interface SearchParams {
  search?: string;
  level?: string;
  isFree?: string;
  page?: string;
}

async function fetchInitialCourses(params: SearchParams) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';
  const qs = new URLSearchParams({ limit: '12', page: params.page ?? '1' });
  if (params.search) qs.set('search', params.search);
  if (params.level) qs.set('level', params.level);
  if (params.isFree !== undefined) qs.set('isFree', params.isFree);

  try {
    const res = await fetch(`${apiUrl}/courses?${qs}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const initialData = await fetchInitialCourses(searchParams);

  return (
    <Suspense>
      <CoursesClient initialData={initialData} initialSearchParams={searchParams} />
    </Suspense>
  );
}
