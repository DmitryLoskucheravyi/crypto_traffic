import { Hero } from './components/sections/hero';
import { TrustStrip } from './components/sections/trust-strip';
import { Bento } from './components/sections/bento';
import { IncomeCalculator } from './components/sections/income-calculator';
import { TickerDivider } from './components/sections/ticker-divider';
import { Comparison } from './components/sections/comparison';
import { LessonPreview } from './components/sections/lesson-preview';
import { CountersStrip } from './components/sections/counters-strip';
import { HowItWorks } from './components/sections/how-it-works';
import { Roadmap } from './components/sections/roadmap';
import { MarketChart } from './components/sections/market-chart';
import { Courses } from './components/sections/courses';
import { Faq } from './components/sections/faq';
import { FinalCta } from './components/sections/final-cta';
import { Footer } from './components/sections/footer';
import { getBotUsername, getCourses, getRoadmapStages, getSiteContent } from './lib/api';

// API is unreachable from inside the Docker build stage, so a statically
// prerendered page would bake in empty courses/bot data until the next
// revalidation. Fetch fresh on every request instead — traffic is low and
// the API is local, so there's no real cost.
export const dynamic = 'force-dynamic';

export default async function Page() {
  const [courses, botUsername, roadmapStages, siteContent] = await Promise.all([
    getCourses(),
    getBotUsername(),
    getRoadmapStages(),
    getSiteContent(),
  ]);

  return (
    <main>
      <Hero botUsername={botUsername} />
      <TrustStrip />
      <Bento />
      <IncomeCalculator calculator={siteContent.calculator} courses={courses} />
      <HowItWorks courses={courses} />
      <Roadmap stages={roadmapStages} />
      <TickerDivider ticker={siteContent.ticker} />
      <MarketChart />
      <Comparison comparison={siteContent.comparison} />
      <LessonPreview preview={siteContent.lessonPreview} />
      <CountersStrip counters={siteContent.counters} />
      <Courses courses={courses} botUsername={botUsername} />
      <Faq />
      <FinalCta botUsername={botUsername} />
      <Footer />
    </main>
  );
}
