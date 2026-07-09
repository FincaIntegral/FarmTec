import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { TipoAccionSync } from '../../../shared/enums/tipo-accion-sync.enum';

export class AccionSincronizacionDto {
  @IsEnum(TipoAccionSync)
  tipo: TipoAccionSync;

  @IsDateString()
  timestampLocal: string;

  @IsOptional()
  @IsString()
  versionBase?: string;

  // Payload variable según tipo — se valida campo a campo en el service
  // (registrar_peso → animalId/pesoKg/fecha, etc.)
  @IsObject()
  @IsNotEmpty()
  datos: Record<string, unknown>;
}

export class LoteDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AccionSincronizacionDto)
  acciones: AccionSincronizacionDto[];
}

export class ResolverConflictoDto {
  @IsUUID()
  accionId: string;

  @IsIn(['usar_local', 'usar_servidor'])
  decision: 'usar_local' | 'usar_servidor';
}
