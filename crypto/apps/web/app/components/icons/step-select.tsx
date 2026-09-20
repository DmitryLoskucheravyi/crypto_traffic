import { IconBase, IconProps } from './icon-base';

export const StepSelect = (props: IconProps) => (
  <IconBase {...props}>
    <rect x="4" y="5" width="16" height="4" rx="2" />
    <rect x="4" y="15" width="16" height="4" rx="2" />
    <path d="M4 12h6" />
    <circle cx="16" cy="12" r="2.5" />
  </IconBase>
);
