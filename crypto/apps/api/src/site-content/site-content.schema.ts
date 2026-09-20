import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export const SITE_CONTENT_KEY = 'default';

// One document per site. Everything here is owner-edited copy or owner-entered
// numbers — nothing is computed and nothing is invented in code. A block with
// enabled=false (or with its required fields empty) is simply not returned to
// the landing page, and the section disappears.

@Schema({ _id: false })
export class CalculatorTier {
  @Prop({ required: true }) tier: string;
  @Prop({ required: true }) lowPct: number;
  @Prop({ required: true }) highPct: number;
}

@Schema({ _id: false })
export class CalculatorBlock {
  @Prop({ default: false }) enabled: boolean;
  @Prop({ default: 100 }) amountMin: number;
  @Prop({ default: 10000 }) amountMax: number;
  @Prop({ default: 100 }) amountStep: number;
  @Prop({ default: 'USD' }) currency: string;
  @Prop({ default: 12 }) horizonMonths: number;
  @Prop({ type: [CalculatorTier], default: [] }) tiers: CalculatorTier[];
  @Prop({ default: '' }) disclaimer: string;
}

@Schema({ _id: false })
export class CountersBlock {
  @Prop({ default: false }) enabled: boolean;
  @Prop({ type: Number, default: null }) studentsTotal: number | null;
  @Prop({ type: Number, default: null }) seatsLeft: number | null;
  @Prop({ default: '' }) note: string;
  @Prop({ type: Date, default: null }) updatedAt: Date | null;
}

@Schema({ _id: false })
export class ComparisonRow {
  @Prop({ required: true }) label: string;
  @Prop({ required: true }) left: string;
  @Prop({ required: true }) right: string;
}

@Schema({ _id: false })
export class ComparisonBlock {
  @Prop({ default: false }) enabled: boolean;
  @Prop({ default: '' }) leftTitle: string;
  @Prop({ default: '' }) rightTitle: string;
  @Prop({ type: [ComparisonRow], default: [] }) rows: ComparisonRow[];
}

@Schema({ _id: false })
export class LessonPreviewBlock {
  @Prop({ default: false }) enabled: boolean;
  @Prop({ default: '' }) title: string;
  @Prop({ default: '' }) description: string;
  @Prop({ default: '' }) mediaUrl: string;
  @Prop({ default: '' }) mediaAlt: string;
  @Prop({ default: true }) isIllustrative: boolean;
}

@Schema({ _id: false })
export class TickerBlock {
  @Prop({ default: false }) enabled: boolean;
  @Prop({ type: [String], default: [] }) items: string[];
}

@Schema({ timestamps: true })
export class SiteContent extends Document {
  @Prop({ required: true, unique: true, default: SITE_CONTENT_KEY })
  key: string;

  @Prop({ type: CalculatorBlock, default: () => ({}) })
  calculator: CalculatorBlock;

  @Prop({ type: CountersBlock, default: () => ({}) })
  counters: CountersBlock;

  @Prop({ type: ComparisonBlock, default: () => ({}) })
  comparison: ComparisonBlock;

  @Prop({ type: LessonPreviewBlock, default: () => ({}) })
  lessonPreview: LessonPreviewBlock;

  @Prop({ type: TickerBlock, default: () => ({}) })
  ticker: TickerBlock;
}

export const SiteContentSchema = SchemaFactory.createForClass(SiteContent);
