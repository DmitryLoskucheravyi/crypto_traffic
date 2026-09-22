import { existsSync } from 'fs';
import { basename, resolve } from 'path';
import type { CourseTier } from '../catalog/catalog';

// Чем выдавать курс — настраивается через окружение, по одной переменной на
// уровень. Принимаются три формы, потому что в жизни встречаются все три:
//   COURSE_MATERIAL_BASIC=materials/basic.pdf        — файл на диске
//   COURSE_MATERIAL_BASIC=https://.../basic.pdf      — ссылка
//   COURSE_MATERIAL_BASIC=BQACAgIAAxkBAA...          — file_id уже залитого в Telegram файла
// file_id заметно дешевле остальных: Telegram не перекачивает файл заново.
//
// Относительный путь считается от рабочего каталога процесса. В dev это корень
// crypto/ (туда заходит scripts/dev-up.ps1), в контейнере — /app, куда
// docker-compose монтирует ./materials. Поэтому одна и та же строка
// "materials/…" работает и там, и там.

export type Material =
  | { kind: 'path'; value: string; filename: string }
  | { kind: 'url'; value: string; filename: string }
  | { kind: 'fileId'; value: string };

const ENV_BY_TIER: Record<CourseTier, string> = {
  basic: 'COURSE_MATERIAL_BASIC',
  medium: 'COURSE_MATERIAL_MEDIUM',
  advanced: 'COURSE_MATERIAL_ADVANCED',
};

export function resolveMaterial(
  tier: CourseTier,
  env: NodeJS.ProcessEnv = process.env,
  fileExists: (path: string) => boolean = existsSync,
): Material | null {
  const raw = env[ENV_BY_TIER[tier]]?.trim();
  if (!raw) return null;

  if (/^https?:\/\//i.test(raw)) {
    return { kind: 'url', value: raw, filename: filenameFromUrl(raw) };
  }

  // Путь узнаём по разделителю или расширению, а не по «файл существует»:
  // иначе опечатка в пути молча уехала бы в Telegram как file_id.
  if (/[\\/]/.test(raw) || /\.[a-z0-9]{2,5}$/i.test(raw)) {
    const path = resolve(raw);
    if (!fileExists(path)) return null;
    return { kind: 'path', value: path, filename: basename(path) };
  }

  return { kind: 'fileId', value: raw };
}

function filenameFromUrl(url: string): string {
  try {
    const name = basename(new URL(url).pathname);
    return name || 'course.pdf';
  } catch {
    return 'course.pdf';
  }
}
