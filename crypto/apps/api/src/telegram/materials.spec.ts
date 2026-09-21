import { resolveMaterial } from './materials';

const exists = () => true;
const missing = () => false;

describe('resolveMaterial', () => {
  it('без переменной окружения материалов нет', () => {
    expect(resolveMaterial('basic', {}, exists)).toBeNull();
    expect(resolveMaterial('basic', { COURSE_MATERIAL_BASIC: '   ' }, exists)).toBeNull();
  });

  it('узнаёт ссылку', () => {
    const material = resolveMaterial(
      'medium',
      { COURSE_MATERIAL_MEDIUM: 'https://cdn.example/courses/medium.pdf' },
      missing,
    );

    expect(material).toEqual({
      kind: 'url',
      value: 'https://cdn.example/courses/medium.pdf',
      filename: 'medium.pdf',
    });
  });

  it('узнаёт путь на диске', () => {
    const material = resolveMaterial(
      'advanced',
      { COURSE_MATERIAL_ADVANCED: 'materials/advanced.pdf' },
      exists,
    );

    expect(material?.kind).toBe('path');
    expect(material && 'filename' in material && material.filename).toBe('advanced.pdf');
  });

  it('не выдаёт путь, которого нет на диске, за file_id', () => {
    expect(
      resolveMaterial('advanced', { COURSE_MATERIAL_ADVANCED: 'materials/advanced.pdf' }, missing),
    ).toBeNull();
  });

  it('всё остальное считает file_id — Telegram не перекачивает файл заново', () => {
    const material = resolveMaterial(
      'basic',
      { COURSE_MATERIAL_BASIC: 'BQACAgIAAxkBAAIB' },
      missing,
    );

    expect(material).toEqual({ kind: 'fileId', value: 'BQACAgIAAxkBAAIB' });
  });

  it('берёт переменную своего уровня, а не соседнего', () => {
    const env = {
      COURSE_MATERIAL_BASIC: 'file-basic',
      COURSE_MATERIAL_MEDIUM: 'file-medium',
      COURSE_MATERIAL_ADVANCED: 'file-advanced',
    };

    expect(resolveMaterial('basic', env, missing)).toMatchObject({ value: 'file-basic' });
    expect(resolveMaterial('medium', env, missing)).toMatchObject({ value: 'file-medium' });
    expect(resolveMaterial('advanced', env, missing)).toMatchObject({ value: 'file-advanced' });
  });
});
