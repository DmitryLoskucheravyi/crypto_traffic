export const MODES = ['off', 'approve', 'auto'] as const;
export type Mode = (typeof MODES)[number];

export function isMode(value: string): value is Mode {
  return (MODES as readonly string[]).includes(value);
}

export type Trigger = 'scheduled' | 'manual';
