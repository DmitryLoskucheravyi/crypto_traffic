import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CourseTier = 'basic' | 'medium' | 'advanced';

export const COURSE_TIERS: CourseTier[] = ['basic', 'medium', 'advanced'];

@Schema({ timestamps: true })
export class Course extends Document {
  @Prop({ required: true, unique: true, enum: COURSE_TIERS })
  tier: CourseTier;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ required: true, default: 'USD' })
  currency: string;

  @Prop({ required: true, default: true })
  active: boolean;
}

export const CourseSchema = SchemaFactory.createForClass(Course);
