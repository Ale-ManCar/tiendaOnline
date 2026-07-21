import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

export class UpsertCategoryDto {
  @IsString()
  @Length(2, 100)
  name!: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;

  @IsBoolean()
  active!: boolean;
}
