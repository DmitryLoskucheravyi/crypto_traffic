import { Hero } from './components/sections/hero';
import { TrustStrip } from './components/sections/trust-strip';
import { Bento } from './components/sections/bento';
import { HowItWorks } from './components/sections/how-it-works';
import { MarketChart } from './components/sections/market-chart';
import { Courses } from './components/sections/courses';
import { Faq } from './components/sections/faq';
import { FinalCta } from './components/sections/final-cta';
import { Footer } from './components/sections/footer';
import { getBotUsername, getCourses } from './lib/api';

// API is unreachable from inside the Docker build stage, so a statically
// prerendered page would bake in empty courses/bot data until the next
// revalidation. Fetch fresh on every request instead — traffic is low and
// the API is local, so there's no real cost.
export const dynamic = 'force-dynamic';

export default async function Page() {
  const [courses, botUsername] = await Promise.all([getCourses(), getBotUsername()]);

  return (
    <main>
      <Hero botUsername={botUsername} />
      <TrustStrip />
      <Bento />
      <HowItWorks courses={courses} />
      <MarketChart />
      <Courses courses={courses} botUsername={botUsername} />
      <Faq />
      <FinalCta botUsername={botUsername} />
      <Footer />
    </main>
  );
}
