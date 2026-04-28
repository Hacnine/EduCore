import {
  IsString, IsOptional, IsBoolean, IsNumber, IsArray, IsEnum, Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CourseStatus, CourseLevel } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateCourseDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  slug: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  shortSummary?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  previewVideoUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiProperty({ enum: CourseLevel, default: CourseLevel.BEGINNER })
  @IsOptional()
  @IsEnum(CourseLevel)
  level?: CourseLevel;

  @ApiProperty({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  discountPrice?: number;

  @ApiProperty({ default: false })
  @IsOptional()
  @IsBoolean()
  isFree?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requirements?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  objectives?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  language?: string;
}

export class UpdateCourseDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() shortSummary?: string;
  @IsOptional() @IsString() thumbnailUrl?: string;
  @IsOptional() @IsString() previewVideoUrl?: string;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsEnum(CourseLevel) level?: CourseLevel;
  @IsOptional() @IsEnum(CourseStatus) status?: CourseStatus;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) price?: number;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) discountPrice?: number;
  @IsOptional() @IsBoolean() isFree?: boolean;
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) requirements?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) objectives?: string[];
}

export class CreateSectionDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  position: number;
}
