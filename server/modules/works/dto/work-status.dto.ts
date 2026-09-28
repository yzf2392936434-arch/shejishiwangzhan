import { IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import type { WorkStatus } from '@shared/api.interface';

export class WorkStatusDto {
  @Type(() => String)
  @IsString()
  @IsIn(['draft', 'published', 'hidden', 'password'])
  status!: WorkStatus;
}
