import { content } from '../../lib/content';

export const Footer = () => (
  <footer className="py-12 border-t border-ink/10">
    <div className="max-w-container mx-auto px-6 md:px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="group flex items-center gap-2">
        <img
          src="/logo-mark.png"
          alt=""
          width={20}
          height={20}
          className="rounded-full transition-transform duration-standard ease-premium group-hover:rotate-12"
        />
        <span className="font-mono text-sm text-ink-muted">крипто курсы</span>
      </div>
      <p className="text-sm text-ink-muted max-w-md">{content.footer.note}</p>
      <span className="text-sm text-ink-muted">© {new Date().getFullYear()}</span>
    </div>
  </footer>
);
