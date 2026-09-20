import { getToken } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3031';

export type Course = {
  tier: 'basic' | 'medium' | 'advanced';
  title: string;
  description: string;
  price: number;
  currency: string;
  active: boolean;
};

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.message ?? `Request failed (${res.status})`);
  }

  return res.json();
}

export function login(email: string, password: string) {
  return request<{ accessToken: string }>('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function fetchCourses() {
  return request<Course[]>('/api/admin/courses');
}

export function saveCourse(course: Course) {
  return request<Course>('/api/admin/courses', {
    method: 'PUT',
    body: JSON.stringify(course),
  });
}
