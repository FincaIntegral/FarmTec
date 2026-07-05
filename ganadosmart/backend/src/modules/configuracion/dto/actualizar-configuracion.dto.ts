import { IsBoolean, IsInt, IsNumber, IsOptional, Min } from 'class-validator';

export class ActualizarConfiguracionDto {
  // null = desactivar auto-aprobación por monto
  @IsOptional()
  @IsNumber()
  montoUmbralAuto?: number | null;

  // null = desactivar auto-aprobación por tiempo
  @IsOptional()
  @IsInt()
  @Min(1)
  diasEsperaAprobacion?: number | null;

  @IsOptional()
  @IsBoolean()
  aplicaAVentas?: boolean;

  @IsOptional()
  @IsBoolean()
  aplicaAGastos?: boolean;
}
