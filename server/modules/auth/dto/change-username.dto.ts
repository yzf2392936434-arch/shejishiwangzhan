import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

import type { ChangeUsernameRequest } from '@shared/api.interface';

export class ChangeUsernameDto implements ChangeUsernameRequest {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  newUsername!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}
