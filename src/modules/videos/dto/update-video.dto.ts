import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateVideoDto {
  @IsString()
  @IsOptional()
  @MaxLength(500)
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  resolution?: string[];

  @IsString()
  @IsOptional()
  @MaxLength(20)
  orientation?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  camera?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  headquarters?: string;

  @IsInt()
  @IsOptional()
  fps?: number;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  audiovisual?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  colorProfile?: string;
}
