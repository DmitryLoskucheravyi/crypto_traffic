import { content } from '../../lib/content';
import { LogoMark } from '../icons';

export const Footer = () => (
  <footer className="py-12 border-t border-ink/10">
    <div className="max-w-container mx-auto px-6 md:px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <LogoMark size={18} className="text-accent" />
        <span className="font-mono text-sm text-ink-muted">крипто курси</span>
      </div>
      <p className="text-sm text-ink-muted max-w-md">{content.footer.note}</p>
      <span className="text-sm text-ink-muted">© {new Date().getFullYear()}</span>
    </div>
  </footer>
);
