import { existsSync } from 'fs';
import { basename, resolve } from 'path';

// Чем выдавать курс — строка из COURSE_MATERIAL_<УРОВЕНЬ>. Принимаются три
// формы, потому что в жизни встречаются все три:
//   materials/basic.pdf        — файл на диске
//   https://.../basic.pdf      — ссылка
//   BQACAgIAAxkBAA...          — file_id уже залитого в Telegram файла
// file_id заметно дешевле остальных: Telegram не перекачивает файл заново.
//
// Относительный путь считается от рабочего каталога процесса. В dev это корень
// crypto/, в контейнере — /app, куда docker-compose монтирует ./materials.
// Поэтому одна и та же строка "materials/…" работает и там, и там.

export type Material =
  | { kind: 'path'; value: string; filename: string }
  | { kind: 'url'; value: string; filename: string }
  | { kind: 'fileId'; value: string };

/**
 * Разбирает строку конфига в материал. Файловая система приходит аргументом —
 * по умолчанию настоящая, в тестах подменённая.
 */
export function resolveMaterial(
  raw: string | null | undefined,
  fileExists: (path: string) => boolean = existsSync,
): Material | null {
  const value = raw?.trim();
  if (!value) return null;

  if (/^https?:\/\//i.test(value)) {
    return { kind: 'url', value, filename: filenameFromUrl(value) };
  }

  // Путь узнаём по разделителю или расширению, а не по «файл существует»:
  // иначе опечатка в пути молча уехала бы в Telegram как file_id.
  if (/[\\/]/.test(value) || /\.[a-z0-9]{2,5}$/i.test(value)) {
    const path = resolve(value);
    if (!fileExists(path)) return null;
    return { kind: 'path', value: path, filename: basename(path) };
  }

  return { kind: 'fileId', value };
}

function filenameFromUrl(url: string): string {
  try {
    return basename(new URL(url).pathname) || 'course.pdf';
  } catch {
    return 'course.pdf';
  }
}
