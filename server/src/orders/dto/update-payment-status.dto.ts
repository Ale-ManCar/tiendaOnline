import { IsEnum } from 'class-validator';
import { PaymentStatus } from '../../generated/prisma/enums';

export class UpdatePaymentStatusDto {
  @IsEnum(PaymentStatus)
  status!: PaymentStatus;
}
