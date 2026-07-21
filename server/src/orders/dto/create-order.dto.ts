import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaymentMethod } from '../../generated/prisma/enums';

export class CreateOrderItemDto {
  @IsUUID()
  variantId!: string;

  @Type(() => Number)
  @Min(1)
  @Max(99)
  quantity!: number;
}

export class ShippingAddressDto {
  @IsString()
  @Length(2, 120)
  recipientName!: string;

  @IsString()
  @Matches(/^\d{7,10}$/, {
    message: 'Phone must contain only numbers and have a maximum of 10 digits.',
  })
  phone!: string;

  @IsString()
  @Length(2, 80)
  province!: string;

  @IsString()
  @Length(2, 80)
  city!: string;

  @IsString()
  @Length(5, 200)
  line1!: string;

  @IsOptional()
  @IsString()
  @Length(0, 250)
  reference?: string;
}

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];

  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shipping!: ShippingAddressDto;

  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @IsEmail()
  customerEmail!: string;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  notes?: string;
}
