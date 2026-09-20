import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

class CalculatorTierDto {
  @IsString()
  tier: string;

  @IsNumber()
  lowPct: number;

  @IsNumber()
  highPct: number;
}

class CalculatorDto {
  @IsBoolean()
  enabled: boolean;

  @IsNumber()
  @Min(0)
  amountMin: number;

  @IsNumber()
  @Min(1)
  amountMax: number;

  @IsNumber()
  @Min(1)
  amountStep: number;

  @IsString()
  @MaxLength(8)
  currency: string;

  @IsInt()
  @Min(1)
  horizonMonths: number;

  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => CalculatorTierDto)
  tiers: CalculatorTierDto[];

  @IsString()
  @MaxLength(400)
  disclaimer: string;
}

class CountersDto {
  @IsBoolean()
  enabled: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  studentsTotal?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  seatsLeft?: number | null;

  @IsString()
  @MaxLength(160)
  note: string;
}

class ComparisonRowDto {
  @IsString()
  @MaxLength(80)
  label: string;

  @IsString()
  @MaxLength(200)
  left: string;

  @IsString()
  @MaxLength(200)
  right: string;
}

class ComparisonDto {
  @IsBoolean()
  enabled: boolean;

  @IsString()
  @MaxLength(80)
  leftTitle: string;

  @IsString()
  @MaxLength(80)
  rightTitle: string;

  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => ComparisonRowDto)
  rows: ComparisonRowDto[];
}

class LessonPreviewDto {
  @IsBoolean()
  enabled: boolean;

  @IsString()
  @MaxLength(120)
  title: string;

  @IsString()
  @MaxLength(400)
  description: string;

  @IsString()
  @MaxLength(300)
  mediaUrl: string;

  @IsString()
  @MaxLength(200)
  mediaAlt: string;

  @IsBoolean()
  isIllustrative: boolean;
}

class TickerDto {
  @IsBoolean()
  enabled: boolean;

  @IsArray()
  @ArrayMaxSize(40)
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  items: string[];
}

export class UpdateSiteContentDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => CalculatorDto)
  calculator?: CalculatorDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CountersDto)
  counters?: CountersDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ComparisonDto)
  comparison?: ComparisonDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LessonPreviewDto)
  lessonPreview?: LessonPreviewDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TickerDto)
  ticker?: TickerDto;
}
