import { IconBase, IconProps } from './icon-base';

// Custom-drawn paper-plane outline — not the Telegram brand logo asset.
export const TelegramMark = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M4 11 20 4 17 19 10.5 15 8 20 8 13.5 18 6" />
  </IconBase>
);
