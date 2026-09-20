import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateRoadmapStageDto {
  @IsString()
  @MaxLength(120)
  title: string;

  @IsNumber()
  @Min(0)
  lessonsCount: number;

  @IsOptional()
  @IsBoolean()
  hasTest?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  summary?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(40)
  @IsString({ each: true })
  @MaxLength(160, { each: true })
  modules?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(200)
  imageUrl?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  // Omitted on create: the service appends the stage to the end.
  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;
}

export class UpdateRoadmapStageDto extends CreateRoadmapStageDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  lessonsCount: number;
}

class ReorderItemDto {
  @IsMongoId()
  id: string;

  @IsInt()
  @Min(1)
  order: number;
}

export class ReorderRoadmapDto {
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => ReorderItemDto)
  items: ReorderItemDto[];
}
