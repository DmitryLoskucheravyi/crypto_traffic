'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Course, fetchCourses, ApiError } from '../../lib/api';
import { clearToken } from '../../lib/auth';
import { CourseEditor } from '../../components/course-editor';
import { Skeleton } from '../../components/ui/panel';

export default function CoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    fetchCourses()
      .then(setCourses)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          clearToken();
          router.replace('/login');
          return;
        }
        setError(err instanceof ApiError ? err.message : 'Не вдалося завантажити курси');
      });
  }, [router]);

  useEffect(load, [load]);

  return (
    <div>
      <p className="max-w-xl text-sm text-ink-muted">
        Зміни тут одразу відображаються на лендінгу та в Telegram-боті. Вимкнений курс зникає
        з обох.
      </p>

      {error && <p className="mt-6 text-sm text-danger">{error}</p>}

      {!courses && !error && (
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-[420px]" />
          ))}
        </div>
      )}

      {courses && (
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {courses.map((course) => (
            <CourseEditor key={course.tier} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}
