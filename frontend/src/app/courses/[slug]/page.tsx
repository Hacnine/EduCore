import { notFound } from 'next/navigation';
import CourseDetailClient from './course-detail-client';
import type { CourseDetail } from '@/hooks/useCourse';

// ISR + DSG (Deferred Static Generation):
// - generateStaticParams pre-builds known course slugs at build time (SSG)
// - Unknown slugs are generated on first request then cached (DSG behaviour)
// - All pages revalidate every hour (ISR)
export const revalidate = 3600;
export const dynamicParams = true; // allow on-demand generation for new courses

async function fetchCourse(slug: string): Promise<CourseDetail | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';
  try {
    const res = await fetch(`${apiUrl}/courses/${slug}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateStaticParams() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';
  try {
    const res = await fetch(`${apiUrl}/courses?limit=500`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.courses ?? []).map((c: any) => ({ slug: c.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const course = await fetchCourse(params.slug);
  if (!course) return { title: 'Course not found' };
  return {
    title: course.title,
    description: course.shortSummary ?? course.description ?? undefined,
    openGraph: {
      title: course.title,
      description: course.shortSummary ?? course.description ?? undefined,
      images: course.thumbnailUrl ? [course.thumbnailUrl] : [],
    },
  };
}

export default async function CourseDetailPage({ params }: { params: { slug: string } }) {
  const course = await fetchCourse(params.slug);
  if (!course) notFound();

  return <CourseDetailClient course={course} />;
}
