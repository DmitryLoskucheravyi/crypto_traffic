import { IconBase, IconProps } from './icon-base';

export const ChartPulse = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M3 16.5h3.2L9 9l3.4 10 2.6-6.5H21" />
    <circle cx="9" cy="9" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="12.4" cy="19" r="1.1" fill="currentColor" stroke="none" />
  </IconBase>
);
