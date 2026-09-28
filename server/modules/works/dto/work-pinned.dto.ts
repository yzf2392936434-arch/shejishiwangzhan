import { IsBoolean } from 'class-validator';

export class WorkPinnedDto {
  @IsBoolean()
  pinned!: boolean;
}
