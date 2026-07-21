import { Type } from 'class-transformer';
import { IsEmail, IsNumber, IsString, Length, Min } from 'class-validator';

export class StoreSettingsDto {
  @IsString() @Length(1, 80) name!: string;
  @IsString() @Length(1, 120) legalName!: string;
  @IsString() @Length(1, 16) shortName!: string;
  @IsString() @Length(1, 2) logoLetter!: string;
  @IsString() @Length(1, 180) announcement!: string;
  @IsString() @Length(1, 240) tagline!: string;
  @IsEmail() supportEmail!: string;
  @IsString() @Length(1, 40) supportPhone!: string;
  @IsString() @Length(1, 120) location!: string;
  @IsString() @Length(1, 80) businessHours!: string;
  @IsString() @Length(1, 120) footerNote!: string;
  @IsString() @Length(1, 80) defaultCheckoutCity!: string;
  @Type(() => Number) @IsNumber() @Min(0) shippingFlatRate!: number;
  @Type(() => Number) @IsNumber() @Min(0) freeShippingThreshold!: number;
  @IsString() @Length(1, 240) shippingCoverageNote!: string;
  @IsString() @Length(1, 180) bankAccountLabel!: string;
  @IsString() @Length(1, 400) bankTransferInstructions!: string;
  @IsString() @Length(1, 400) cashOnDeliveryInstructions!: string;
}
