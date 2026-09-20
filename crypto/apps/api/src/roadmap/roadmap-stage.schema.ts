import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class RoadmapStage extends Document {
  // Not unique: reordering swaps two positions, and a unique index would
  // reject the intermediate state. The service re-sequences after every
  // mutation instead, so the stored orders stay 1..N with no gaps.
  @Prop({ required: true, min: 1, index: true })
  order: number;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true, min: 0 })
  lessonsCount: number;

  @Prop({ required: true, default: false })
  hasTest: boolean;

  @Prop({ default: '' })
  summary: string;

  @Prop({ type: [String], default: [] })
  modules: string[];

  // One of the generated isometric assets in apps/web/public, e.g.
  // '/roadmap-3.png'. Empty means the card renders without an object.
  @Prop({ default: '' })
  imageUrl: string;

  @Prop({ required: true, default: true })
  active: boolean;
}

export const RoadmapStageSchema = SchemaFactory.createForClass(RoadmapStage);
