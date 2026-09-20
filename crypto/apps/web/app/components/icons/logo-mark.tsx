import { IconBase, IconProps } from './icon-base';

// Two interlocking diamonds — glass facets, monogram-style mark.
export const LogoMark = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M6 12 12 4 18 12 12 20 6 12Z" />
    <path d="M6 12 12 12 18 12" />
  </IconBase>
);
