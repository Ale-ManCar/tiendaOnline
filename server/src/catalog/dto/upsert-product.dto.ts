import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString, IsUUID, Length, Min } from 'class-validator';

export class UpsertProductDto {
  @IsString()
  @Length(2, 160)
  name!: string;

  @IsString()
  @Length(5, 2000)
  description!: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsString()
  @Length(2, 100)
  category!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stock!: number;

  @IsString()
  @Length(1, 2048)
  image!: string;

  @IsBoolean()
  featured!: boolean;

  @IsString()
  @Length(2, 80)
  sku!: string;

  @IsBoolean()
  active!: boolean;
}
