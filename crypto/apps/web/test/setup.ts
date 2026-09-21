import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// jsdom не реализует matchMedia, а на нём стоят и useReducedMotion из
// framer-motion, и переключение вёрстки карточек курсов.
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

// framer-motion дергает IntersectionObserver для whileInView.
if (!window.IntersectionObserver) {
  window.IntersectionObserver = class {
    readonly root = null;
    readonly rootMargin = '';
    readonly thresholds: readonly number[] = [];
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  } as unknown as typeof window.IntersectionObserver;
}

vi.stubGlobal('scrollTo', () => {});
