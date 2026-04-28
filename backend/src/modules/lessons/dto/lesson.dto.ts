import { IsString, IsOptional, IsBoolean, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LessonType } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateLessonDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: LessonType, default: LessonType.VIDEO })
  @IsEnum(LessonType)
  type: LessonType;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  position: number;

  @ApiProperty({ default: false })
  @IsOptional()
  @IsBoolean()
  isFree?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  duration?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  videoProvider?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  content?: string;
}

export class UpdateLessonDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsBoolean() isFree?: boolean;
  @IsOptional() @IsNumber() @Type(() => Number) duration?: number;
  @IsOptional() @IsString() videoUrl?: string;
  @IsOptional() @IsString() videoProvider?: string;
  @IsOptional() @IsString() content?: string;
}

export class UpdateProgressDto {
  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  watchedSeconds: number;

  @ApiProperty({ default: false })
  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;
}
