import { redirect } from 'next/navigation';

// The navbar links to /dashboard/my-courses — redirect to the main dashboard
// which already shows the student's enrolled courses.
export default function MyCoursesPage() {
  redirect('/dashboard');
}
