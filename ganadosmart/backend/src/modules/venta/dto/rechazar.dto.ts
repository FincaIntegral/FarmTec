import { IsOptional, IsString } from 'class-validator';

export class RechazarDto {
  @IsOptional()
  @IsString()
  motivo?: string;
}
