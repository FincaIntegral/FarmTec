import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { PaginacionQueryDto } from '../../../shared/dto/paginacion-query.dto';
import { TipoOrigenAlerta } from '../../../shared/enums/tipo-origen-alerta.enum';

export class ListarAlertasQueryDto extends PaginacionQueryDto {
  @IsOptional()
  @IsEnum(TipoOrigenAlerta)
  tipoOrigen?: TipoOrigenAlerta;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  leida?: boolean;
}
