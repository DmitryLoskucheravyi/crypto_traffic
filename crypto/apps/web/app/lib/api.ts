export type Course = {
  tier: 'basic' | 'medium' | 'advanced';
  title: string;
  description: string;
  price: number;
  currency: string;
  active: boolean;
};

const API_BASE = process.env.API_INTERNAL_URL ?? 'http://localhost:3031';

export async function getCourses(): Promise<Course[]> {
  try {
    const res = await fetch(`${API_BASE}/api/courses`, { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function getBotUsername(): Promise<string> {
  try {
    const res = await fetch(`${API_BASE}/api/bot-info`, { next: { revalidate: 300 } });
    if (!res.ok) return '';
    const data = await res.json();
    return data.username ?? '';
  } catch {
    return '';
  }
}
