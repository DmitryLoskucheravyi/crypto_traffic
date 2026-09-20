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

export type CalculatorTier = { tier: string; lowPct: number; highPct: number };

export type SiteContent = {
  calculator: {
    amountMin: number;
    amountMax: number;
    amountStep: number;
    currency: string;
    horizonMonths: number;
    tiers: CalculatorTier[];
    disclaimer: string;
  } | null;
  counters: {
    studentsTotal: number | null;
    seatsLeft: number | null;
    note: string;
    updatedAt: string | null;
  } | null;
  comparison: {
    leftTitle: string;
    rightTitle: string;
    rows: Array<{ label: string; left: string; right: string }>;
  } | null;
  lessonPreview: {
    title: string;
    description: string;
    mediaUrl: string;
    mediaAlt: string;
    isIllustrative: boolean;
  } | null;
  ticker: { items: string[] } | null;
};

export const EMPTY_SITE_CONTENT: SiteContent = {
  calculator: null,
  counters: null,
  comparison: null,
  lessonPreview: null,
  ticker: null,
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

export async function getRoadmapStages(): Promise<RoadmapStage[]> {
  try {
    const res = await fetch(`${API_BASE}/api/roadmap`, { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function getSiteContent(): Promise<SiteContent> {
  try {
    const res = await fetch(`${API_BASE}/api/site-content`, { cache: 'no-store' });
    if (!res.ok) return EMPTY_SITE_CONTENT;
    return res.json();
  } catch {
    return EMPTY_SITE_CONTENT;
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
