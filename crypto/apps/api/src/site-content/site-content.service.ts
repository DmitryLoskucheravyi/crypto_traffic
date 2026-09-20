import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SITE_CONTENT_KEY, SiteContent } from './site-content.schema';
import { UpdateSiteContentDto } from './dto/update-site-content.dto';

@Injectable()
export class SiteContentService {
  constructor(
    @InjectModel(SiteContent.name) private readonly model: Model<SiteContent>,
  ) {}

  private getOrCreate() {
    return this.model
      .findOneAndUpdate(
        { key: SITE_CONTENT_KEY },
        { $setOnInsert: { key: SITE_CONTENT_KEY } },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      )
      .exec();
  }

  findForAdmin() {
    return this.getOrCreate();
  }

  // The landing page only ever sees blocks that are switched on AND actually
  // filled in. A half-configured calculator would otherwise render a section
  // quoting numbers nobody entered.
  async findPublic() {
    const doc = await this.getOrCreate();
    const { calculator, counters, comparison, lessonPreview, ticker } = doc.toObject();

    const calculatorReady =
      calculator?.enabled &&
      calculator.tiers?.length > 0 &&
      calculator.disclaimer.trim().length > 0 &&
      calculator.amountMax > calculator.amountMin;

    const countersReady =
      counters?.enabled && (counters.studentsTotal !== null || counters.seatsLeft !== null);

    const comparisonReady = comparison?.enabled && comparison.rows?.length > 0;

    const lessonPreviewReady =
      lessonPreview?.enabled && lessonPreview.mediaUrl.trim().length > 0;

    const tickerReady = ticker?.enabled && ticker.items?.length > 0;

    return {
      calculator: calculatorReady ? calculator : null,
      counters: countersReady ? counters : null,
      comparison: comparisonReady ? comparison : null,
      lessonPreview: lessonPreviewReady ? lessonPreview : null,
      ticker: tickerReady ? ticker : null,
    };
  }

  async update(dto: UpdateSiteContentDto) {
    const patch: Record<string, unknown> = { ...dto };

    // Stamped server-side: the landing shows this date next to the numbers, so
    // it has to mean "when the owner last confirmed them", not a client clock.
    if (dto.counters) {
      patch.counters = { ...dto.counters, updatedAt: new Date() };
    }

    return this.model
      .findOneAndUpdate(
        { key: SITE_CONTENT_KEY },
        { $set: patch },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      )
      .exec();
  }
}
