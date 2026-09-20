import { getToken } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3031';
const BOT_API_BASE = process.env.NEXT_PUBLIC_BOT_API_URL ?? 'http://localhost:3033';

export type Course = {
  tier: 'basic' | 'medium' | 'advanced';
  title: string;
  description: string;
  price: number;
  currency: string;
  active: boolean;
};

export type RoadmapStage = {
  _id: string;
  order: number;
  title: string;
  lessonsCount: number;
  hasTest: boolean;
  summary: string;
  modules: string[];
  imageUrl: string;
  imageFrontUrl: string;
  active: boolean;
};

// Stage input without the server-managed fields.
export type RoadmapStageDraft = Omit<RoadmapStage, '_id' | 'order'>;

export type SiteContent = {
  calculator: {
    enabled: boolean;
    amountMin: number;
    amountMax: number;
    amountStep: number;
    currency: string;
    horizonMonths: number;
    tiers: Array<{ tier: string; lowPct: number; highPct: number }>;
    disclaimer: string;
  };
  counters: {
    enabled: boolean;
    studentsTotal: number | null;
    seatsLeft: number | null;
    note: string;
    updatedAt: string | null;
  };
  comparison: {
    enabled: boolean;
    leftTitle: string;
    rightTitle: string;
    rows: Array<{ label: string; left: string; right: string }>;
  };
  lessonPreview: {
    enabled: boolean;
    title: string;
    description: string;
    mediaUrl: string;
    mediaAlt: string;
    isIllustrative: boolean;
  };
  ticker: { enabled: boolean; items: string[] };
};

export type BotMode = 'off' | 'approve' | 'auto';

export type BotState = {
  id: number;
  mode: BotMode;
  dailyHour: number;
  dailyMinute: number;
  lastRunAt: string | null;
  nextRunAt: string | null;
  pendingDraft: string | null;
  updatedAt: string;
};

export type BotHistoryItem = {
  id: number;
  content: string;
  trigger: 'scheduled' | 'manual';
  mode: BotMode;
  status: 'published' | 'pending' | 'rejected' | 'failed';
  error: string | null;
  createdAt: string;
};

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(baseUrl: string, path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${baseUrl}${path}`, {
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

// --- apps/api (курси, вхід) ---

export function login(email: string, password: string) {
  return request<{ accessToken: string }>(API_BASE, '/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function fetchCourses() {
  return request<Course[]>(API_BASE, '/api/admin/courses');
}

export function saveCourse(course: Course) {
  return request<Course>(API_BASE, '/api/admin/courses', {
    method: 'PUT',
    body: JSON.stringify(course),
  });
}

// --- apps/api (дорожня карта) ---

export function fetchRoadmap() {
  return request<RoadmapStage[]>(API_BASE, '/api/admin/roadmap');
}

export function createStage(draft: RoadmapStageDraft) {
  return request<RoadmapStage>(API_BASE, '/api/admin/roadmap', {
    method: 'POST',
    body: JSON.stringify(draft),
  });
}

export function updateStage(id: string, draft: RoadmapStageDraft) {
  return request<RoadmapStage>(API_BASE, `/api/admin/roadmap/${id}`, {
    method: 'PUT',
    body: JSON.stringify(draft),
  });
}

export function deleteStage(id: string) {
  return request<{ ok: true }>(API_BASE, `/api/admin/roadmap/${id}`, { method: 'DELETE' });
}

export function reorderStages(items: Array<{ id: string; order: number }>) {
  return request<RoadmapStage[]>(API_BASE, '/api/admin/roadmap/reorder', {
    method: 'PATCH',
    body: JSON.stringify({ items }),
  });
}

// --- apps/api (контент сайту) ---

export function fetchSiteContent() {
  return request<SiteContent>(API_BASE, '/api/admin/site-content');
}

export function saveSiteContent(patch: Partial<SiteContent>) {
  return request<SiteContent>(API_BASE, '/api/admin/site-content', {
    method: 'PUT',
    body: JSON.stringify(patch),
  });
}

// --- apps/bot (канал-бот) ---

export function fetchBotStatus() {
  return request<BotState>(BOT_API_BASE, '/api/status');
}

export function setBotMode(mode: BotMode) {
  return request<BotState>(BOT_API_BASE, '/api/mode', {
    method: 'POST',
    body: JSON.stringify({ mode }),
  });
}

export function postNow() {
  return request<BotState>(BOT_API_BASE, '/api/post-now', { method: 'POST' });
}

export function publishDraft() {
  return request<BotState>(BOT_API_BASE, '/api/draft/publish', { method: 'POST' });
}

export function regenerateDraft() {
  return request<BotState>(BOT_API_BASE, '/api/draft/regenerate', { method: 'POST' });
}

export function rejectDraft() {
  return request<BotState>(BOT_API_BASE, '/api/draft/reject', { method: 'POST' });
}

export function fetchBotHistory(limit = 20) {
  return request<BotHistoryItem[]>(BOT_API_BASE, `/api/history?limit=${limit}`);
}
