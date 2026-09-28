import { IsString } from 'class-validator';
import type { PasswordVerifyRequest } from '@shared/api.interface';

export class PasswordVerifyDto implements PasswordVerifyRequest {
  @IsString()
  password!: string;
}
