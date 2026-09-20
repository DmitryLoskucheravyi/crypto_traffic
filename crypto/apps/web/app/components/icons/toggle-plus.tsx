import { IconBase, IconProps } from './icon-base';

// Just the two strokes — the square frame around it is drawn by the button, so
// the frame can stay put while the plus rotates into a cross.
export const TogglePlus = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M12 6v12" />
    <path d="M6 12h12" />
  </IconBase>
);
