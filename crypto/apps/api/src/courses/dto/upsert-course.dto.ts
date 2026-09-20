import { IsBoolean, IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { COURSE_TIERS, CourseTier } from '../course.schema';

export class UpsertCourseDto {
  @IsIn(COURSE_TIERS)
  tier: CourseTier;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
