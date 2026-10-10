import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { resolveMaterial } from './materials';

const exists = () => true;
const missing = () => false;

describe('resolveMaterial', () => {
  it('без значения материалов нет', () => {
    expect(resolveMaterial(null, exists)).toBeNull();
    expect(resolveMaterial('   ', exists)).toBeNull();
  });

  it('узнаёт ссылку', () => {
    const material = resolveMaterial('https://cdn.example/courses/medium.pdf', missing);

    expect(material).toEqual({
      kind: 'url',
      value: 'https://cdn.example/courses/medium.pdf',
      filename: 'medium.pdf',
    });
  });

  it('узнаёт путь на диске', () => {
    const material = resolveMaterial('materials/advanced.pdf', exists);

    expect(material?.kind).toBe('path');
    expect(material && 'filename' in material && material.filename).toBe('advanced.pdf');
  });

  it('не выдаёт путь, которого нет на диске, за file_id', () => {
    expect(resolveMaterial('materials/advanced.pdf', missing)).toBeNull();
  });

  it('всё остальное считает file_id — Telegram не перекачивает файл заново', () => {
    const material = resolveMaterial('BQACAgIAAxkBAAIB', missing);

    expect(material).toEqual({ kind: 'fileId', value: 'BQACAgIAAxkBAAIB' });
  });

  // Курсы выдаются файлами с кириллицей в имени и по пути относительно корня
  // проекта — на настоящей файловой системе, без подменённого existsSync.
  it('находит настоящий файл по относительному пути с кириллицей', () => {
    const dir = mkdtempSync(join(tmpdir(), 'materials-'));
    const cwd = process.cwd();

    try {
      writeFileSync(join(dir, 'Криптотрейдинг_базовый_уровень.pdf'), '%PDF-1.4\n');
      process.chdir(dir);

      const material = resolveMaterial('./Криптотрейдинг_базовый_уровень.pdf');

      expect(material?.kind).toBe('path');
      expect(material && 'filename' in material && material.filename).toBe(
        'Криптотрейдинг_базовый_уровень.pdf',
      );
    } finally {
      process.chdir(cwd);
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
