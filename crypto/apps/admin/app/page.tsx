'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Course, fetchCourses, ApiError } from './lib/api';
import { getToken, clearToken } from './lib/auth';
import { CourseEditor } from './components/course-editor';

export default function DashboardPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }

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

  const logout = () => {
    clearToken();
    router.replace('/login');
  };

  return (
    <main className="max-w-container mx-auto px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Курси</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Зміни тут одразу відображаються на лендінгу та в Telegram-боті.
          </p>
        </div>
        <button onClick={logout} className="text-sm text-ink-muted hover:text-ink">
          Вийти
        </button>
      </div>

      {error && <p className="mt-6 text-danger">{error}</p>}

      {!courses && !error && <p className="mt-8 text-ink-muted">Завантаження...</p>}

      {courses && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {courses.map((course) => (
            <CourseEditor key={course.tier} course={course} />
          ))}
        </div>
      )}
    </main>
  );
}
