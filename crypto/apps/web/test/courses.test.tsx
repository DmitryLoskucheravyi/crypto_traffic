import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Courses } from '../app/components/sections/courses';
import { BOT_URL, courses } from '../app/lib/site-data';
import { content } from '../app/lib/content';

describe('секция «Уровни курсов»', () => {
  it('рисует карточку на каждый уровень', () => {
    render(<Courses />);

    for (const course of courses) {
      expect(screen.getByText(course.title)).toBeInTheDocument();
      expect(screen.getByText(course.description)).toBeInTheDocument();
    }
  });

  it('не показывает цену: она существует только в боте', () => {
    const { container } = render(<Courses />);
    const text = container.textContent ?? '';

    expect(text).not.toMatch(/USDT/i);
    expect(text).not.toMatch(/\$/);
    // Ни одной денежной суммы: ни «10», ни «25 USD», ни «от 40».
    expect(text).not.toMatch(/\d+\s*(USD|USDT|\$|₽|€)/i);
  });

  it('на каждой карточке — одна кнопка, и она ведёт в бота', () => {
    render(<Courses />);

    const ctas = screen.getAllByRole('link', { name: new RegExp(content.courses.cta, 'i') });

    expect(ctas).toHaveLength(courses.length);
    for (const cta of ctas) {
      expect(cta).toHaveAttribute('href', BOT_URL);
      expect(cta).toHaveAttribute('target', '_blank');
      expect(cta).toHaveAttribute('rel', expect.stringContaining('noopener'));
    }
  });
});
