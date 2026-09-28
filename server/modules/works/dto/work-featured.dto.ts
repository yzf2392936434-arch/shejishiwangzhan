import { IsBoolean } from 'class-validator';

export class WorkFeaturedDto {
  @IsBoolean()
  featured!: boolean;
}
