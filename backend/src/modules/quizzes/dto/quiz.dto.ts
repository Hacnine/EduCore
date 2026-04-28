import {
  IsString, IsOptional, IsBoolean, IsNumber, IsArray, IsEnum, ValidateNested, Min, Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { QuestionType } from '@prisma/client';

export class CreateQuizDto {
  @ApiProperty() @IsString() title: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() description?: string;
  @ApiProperty({ default: 70 }) @IsOptional() @IsNumber() @Min(0) @Max(100) passingScore?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() timeLimit?: number;
  @ApiProperty({ default: false }) @IsOptional() @IsBoolean() shuffleQuestions?: boolean;
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() maxAttempts?: number;
}

export class QuizOptionDto {
  @ApiProperty() @IsString() text: string;
  @ApiProperty({ default: false }) @IsBoolean() isCorrect: boolean;
  @ApiProperty() @IsNumber() @Type(() => Number) position: number;
}

export class CreateQuizQuestionDto {
  @ApiProperty() @IsString() text: string;
  @ApiProperty({ enum: QuestionType }) @IsEnum(QuestionType) type: QuestionType;
  @ApiProperty({ default: 1 }) @IsOptional() @IsNumber() points?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsString() explanation?: string;
  @ApiProperty() @IsNumber() @Type(() => Number) position: number;
  @ApiProperty({ type: [QuizOptionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizOptionDto)
  options: QuizOptionDto[];
}

export class SubmitQuizDto {
  @ApiProperty()
  @IsArray()
  responses: {
    questionId: string;
    selectedOptionIds?: string[];
    textAnswer?: string;
  }[];
}
