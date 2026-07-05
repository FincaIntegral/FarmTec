import { Injectable } from '@nestjs/common';
import { ConfiguracionRepository } from './configuracion.repository';
import { ActualizarConfiguracionDto } from './dto/actualizar-configuracion.dto';
import { ConfiguracionAprobacion } from './entities/configuracion-aprobacion.entity';

@Injectable()
export class ConfiguracionService {
  constructor(private readonly configuracionRepository: ConfiguracionRepository) {}

  // Si la finca aún no tiene fila (finca recién creada), se crea con los
  // defaults del schema: umbrales NULL (sin auto-aprobación), aplica a ambos.
  async obtenerOCrear(fincaId: string): Promise<ConfiguracionAprobacion> {
    const existente = await this.configuracionRepository.findByFinca(fincaId);
    if (existente) {
      return existente;
    }
    return this.configuracionRepository.create({ fincaId });
  }

  async actualizar(
    fincaId: string,
    dto: ActualizarConfiguracionDto,
    configuradoPor: string,
  ): Promise<ConfiguracionAprobacion> {
    await this.obtenerOCrear(fincaId);

    const actualizada = await this.configuracionRepository.update(fincaId, {
      ...(dto.montoUmbralAuto !== undefined && { montoUmbralAuto: dto.montoUmbralAuto }),
      ...(dto.diasEsperaAprobacion !== undefined && {
        diasEsperaAprobacion: dto.diasEsperaAprobacion,
      }),
      ...(dto.aplicaAVentas !== undefined && { aplicaAVentas: dto.aplicaAVentas }),
      ...(dto.aplicaAGastos !== undefined && { aplicaAGastos: dto.aplicaAGastos }),
      configuradoPor,
    });
    return actualizada!;
  }
}
