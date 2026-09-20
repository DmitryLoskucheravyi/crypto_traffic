import { content } from '../../lib/content';

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <li>
    <a
      href={href}
      className="text-sm text-ink-muted transition-colors duration-quick ease-premium hover:text-accent"
    >
      {children}
    </a>
  </li>
);

export const Footer = ({ botUsername }: { botUsername: string }) => (
  <footer className="border-t border-ink/10">
    <div className="mx-auto max-w-container px-6 py-14 md:px-8 md:py-16">
      <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr] md:gap-12">
        <div>
          <div className="group flex items-center gap-2.5">
            <img
              src="/logo-mark.png"
              alt=""
              width={24}
              height={24}
              className="transition-transform duration-standard ease-premium group-hover:rotate-12"
            />
            <span className="font-mono text-sm tracking-wide text-ink-muted">
              {content.footer.brand}
            </span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-muted">
            {content.footer.note}
          </p>
        </div>

        <nav aria-label={content.footer.navLabel}>
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink/40">
            {content.footer.navLabel}
          </span>
          <ul className="mt-4 space-y-2.5">
            <NavLink href="#roadmap">{content.footer.links.roadmap}</NavLink>
            <NavLink href="#courses">{content.footer.links.courses}</NavLink>
            <NavLink href="#faq">{content.footer.links.faq}</NavLink>
          </ul>
        </nav>

        <div>
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink/40">
            {content.footer.contactLabel}
          </span>
          {botUsername ? (
            <a
              href={`https://t.me/${botUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm text-ink transition-colors duration-quick ease-premium hover:text-accent"
            >
              @{botUsername}
              <span aria-hidden="true">↗</span>
            </a>
          ) : (
            // The bot name comes from the API; without it a dead link is worse
            // than a plain line of text.
            <p className="mt-4 text-sm text-ink-muted">{content.footer.contactFallback}</p>
          )}
          <p className="mt-3 text-xs leading-relaxed text-ink-muted">
            {content.footer.contactNote}
          </p>
        </div>
      </div>

      <div className="mt-12 border-t border-ink/10 pt-6">
        <p className="max-w-3xl text-xs leading-relaxed text-ink-muted/80">
          {content.footer.risk}
        </p>
        <p className="mt-4 font-mono text-xs text-ink-muted">
          © {new Date().getFullYear()} {content.footer.brand}
        </p>
      </div>
    </div>
  </footer>
);
