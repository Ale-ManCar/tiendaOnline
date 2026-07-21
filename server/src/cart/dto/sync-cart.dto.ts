import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsUUID, Max, Min, ValidateNested } from 'class-validator';

export class SyncCartItemDto {
  @IsUUID()
  variantId!: string;

  @Type(() => Number)
  @Min(1)
  @Max(99)
  quantity!: number;
}

export class SyncCartDto {
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => SyncCartItemDto)
  items!: SyncCartItemDto[];
}
