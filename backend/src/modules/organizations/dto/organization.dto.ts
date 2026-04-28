import { IsString, IsOptional, IsUrl, MinLength, IsBoolean, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateOrganizationDto {
  @ApiProperty({ example: 'Acme Academy' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'acme-academy' })
  @IsString()
  slug: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  domain?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  website?: string;
}

export class UpdateOrganizationDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  website?: string;
}

export class UpdateSettingsDto {
  @ApiProperty({ required: false }) @IsOptional() @IsString() primaryColor?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() logoUrl?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() allowSignup?: boolean;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() requireApproval?: boolean;
  @ApiProperty({ required: false }) @IsOptional() @IsString() emailDomain?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() @Type(() => Number) maxStudents?: number;
}
