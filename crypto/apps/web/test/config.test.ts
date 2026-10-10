import { describe, expect, it } from 'vitest';
import { accountHandle, buildPublicConfig } from '../app/lib/config';

describe('accountHandle', () => {
  it('понимает имя, @имя и полный адрес одинаково', () => {
    for (const raw of ['courses', '@courses', 'https://t.me/courses', ' https://t.me/courses/ ']) {
      expect(accountHandle(raw)).toBe('courses');
    }
  });

  it('отбрасывает метки из ссылки, скопированной из приложения', () => {
    expect(
      accountHandle('https://www.instagram.com/crypt0_spheere?stkn=dnVxMG84bm15aDZi&utm_source=qr'),
    ).toBe('crypt0_spheere');
  });

  it('оставляет пригласительную ссылку канала', () => {
    expect(accountHandle('https://t.me/+AbCdEf')).toBe('+AbCdEf');
  });

  it('пустое остаётся пустым', () => {
    expect(accountHandle(undefined)).toBe('');
    expect(accountHandle('   ')).toBe('');
  });
});

describe('buildPublicConfig', () => {
  it('без окружения берёт фолбэки: бот и Instagram проекта, канала нет', () => {
    const config = buildPublicConfig({});

    expect(config.siteUrl).toBe('http://localhost:3030');
    expect(config.bot.url).toBe(`https://t.me/${config.bot.username}`);
    expect(config.channel).toBeNull();
    expect(config.instagram?.url).toBe('https://www.instagram.com/crypt0_spheere/');
  });

  it('пустая строка из docker compose — то же, что незаданная переменная', () => {
    expect(buildPublicConfig({ siteUrl: '', botUsername: '' })).toEqual(buildPublicConfig({}));
  });

  it('собирает полные ссылки и срезает слеш у адреса сайта', () => {
    const config = buildPublicConfig({
      siteUrl: 'https://example.com/',
      botUsername: '@my_bot',
      channelUsername: 'https://t.me/news',
      instagramUsername: 'insta',
    });

    expect(config.siteUrl).toBe('https://example.com');
    expect(config.bot).toEqual({ username: 'my_bot', url: 'https://t.me/my_bot' });
    expect(config.channel).toEqual({ username: 'news', url: 'https://t.me/news' });
    expect(config.instagram).toEqual({
      username: 'insta',
      url: 'https://www.instagram.com/insta/',
    });
  });
});
