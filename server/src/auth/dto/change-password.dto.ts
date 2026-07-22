import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @MaxLength(128)
  currentPassword!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(128)
  @Matches(/[A-Z]/, { message: 'Password must contain an uppercase letter.' })
  @Matches(/[a-z]/, { message: 'Password must contain a lowercase letter.' })
  @Matches(/\d/, { message: 'Password must contain a number.' })
  @Matches(/[^\w\s]/, { message: 'Password must contain a special character.' })
  newPassword!: string;
}
