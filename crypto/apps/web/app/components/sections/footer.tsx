import { content } from '../../lib/content';
import { config } from '../../lib/config';
import { InstagramMark, TelegramMark } from '../icons';

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

// Квадратная клавиша того же рисунка, что у тоггла в FAQ. Подпись едет текстом в
// sr-only, а не в aria-label: его видят и скринридер, и поисковик — иначе три ссылки
// подряд остались бы безымянными картинками без анкорного текста.
const SocialLink = ({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    title={label}
    className="inline-flex h-10 w-10 items-center justify-center rounded-[4px] border border-ink/15 text-ink-muted transition-colors duration-standard ease-premium hover:border-accent/40 hover:text-accent"
  >
    {children}
    <span className="sr-only">{label}</span>
  </a>
);

export const Footer = () => (
  <footer className="border-t border-ink/10">
    <div className="mx-auto max-w-container px-5 py-12 sm:px-6 sm:py-14 md:px-8 md:py-16">
      <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr] md:gap-12">
        <div className="sm:col-span-2 md:col-span-1">
          <div className="group flex items-center gap-2.5">
            <img
              src="/logo-mark.png"
              alt=""
              width={24}
              height={24}
              className="transition-transform duration-standard ease-premium group-hover:rotate-12"
            />
            <span className="font-mono text-sm tracking-wide text-ink-muted">{content.brand}</span>
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
            <NavLink href="#program">{content.footer.links.program}</NavLink>
            <NavLink href="#how-it-works">{content.footer.links.howItWorks}</NavLink>
            <NavLink href="#roadmap">{content.footer.links.roadmap}</NavLink>
            <NavLink href="#courses">{content.footer.links.courses}</NavLink>
            <NavLink href="#faq">{content.footer.links.faq}</NavLink>
          </ul>
        </nav>

        <div>
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink/40">
            {content.footer.contactLabel}
          </span>
          <a
            href={config.bot.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 text-sm text-ink transition-colors duration-quick ease-premium hover:text-accent"
          >
            @{config.bot.username}
            <span aria-hidden="true">↗</span>
          </a>

          {/* Бот и Instagram есть всегда, канал — только если задан в окружении:
              пустая переменная не оставляет после себя битую ссылку. */}
          <ul aria-label={content.footer.social.label} className="mt-4 flex items-center gap-2">
            <li>
              <SocialLink href={config.bot.url} label={content.footer.social.bot}>
                <TelegramMark size={18} />
              </SocialLink>
            </li>
            {config.channel && (
              <li>
                <SocialLink
                  href={config.channel.url}
                  label={`${content.footer.social.channel} @${config.channel.username}`}
                >
                  <TelegramMark size={18} />
                </SocialLink>
              </li>
            )}
            <li>
              <SocialLink
                href={config.instagram.url}
                label={`${content.footer.social.instagram} @${config.instagram.username}`}
              >
                <InstagramMark size={18} />
              </SocialLink>
            </li>
          </ul>

          <p className="mt-3 text-xs leading-relaxed text-ink-muted">
            {content.footer.contactNote}
          </p>
        </div>
      </div>

      <div className="mt-12 border-t border-ink/10 pt-6">
        <p className="max-w-3xl text-xs leading-relaxed text-ink-muted/80">{content.footer.risk}</p>
        <p className="mt-4 font-mono text-xs text-ink-muted">
          © {new Date().getFullYear()} {content.brand}
        </p>
      </div>
    </div>
  </footer>
);
