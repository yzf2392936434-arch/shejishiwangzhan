import { IsString, IsNotEmpty, MinLength } from 'class-validator';

import type { ChangePasswordRequest } from '@shared/api.interface';

export class ChangePasswordDto implements ChangePasswordRequest {
  @IsString()
  @IsNotEmpty()
  oldPassword!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  newPassword!: string;
}
