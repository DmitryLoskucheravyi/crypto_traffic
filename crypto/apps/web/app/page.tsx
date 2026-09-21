import { Hero } from './components/sections/hero';
import { TrustStrip } from './components/sections/trust-strip';
import { Bento } from './components/sections/bento';
import { IncomeCalculator } from './components/sections/income-calculator';
import { TickerDivider } from './components/sections/ticker-divider';
import { Comparison } from './components/sections/comparison';
import { CountersStrip } from './components/sections/counters-strip';
import { HowItWorks } from './components/sections/how-it-works';
import { Roadmap } from './components/sections/roadmap';
import { MarketChart } from './components/sections/market-chart';
import { Courses } from './components/sections/courses';
import { Faq } from './components/sections/faq';
import { FinalCta } from './components/sections/final-cta';
import { Footer } from './components/sections/footer';

// Ни одного запроса на сервер: весь контент лежит в app/lib/site-data.ts и
// запекается в HTML на сборке. Страница — статический файл, её можно раздать
// любым nginx без Node-процесса рядом.
export default function Page() {
  return (
    <main>
      <Hero />
      <TrustStrip />
      <Bento />
      <IncomeCalculator />
      <HowItWorks />
      <Roadmap />
      <TickerDivider />
      <MarketChart />
      <Comparison />
      <CountersStrip />
      <Courses />
      <Faq />
      <FinalCta />
      <Footer />
    </main>
  );
}
