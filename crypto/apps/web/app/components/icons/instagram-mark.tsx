import { IconBase, IconProps } from './icon-base';

// Contour drawn to match TelegramMark next to it — not the Instagram brand
// asset. The lens dot is a zero-length round-capped stroke, so it inherits the
// same weight and colour as everything else instead of needing a fill.
export const InstagramMark = (props: IconProps) => (
  <IconBase {...props}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="3.75" />
    <path d="M17.25 6.75h.01" />
  </IconBase>
);
