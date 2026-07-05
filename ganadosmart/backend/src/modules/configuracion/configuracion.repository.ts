import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfiguracionAprobacion } from './entities/configuracion-aprobacion.entity';

@Injectable()
export class ConfiguracionRepository {
  constructor(
    @InjectRepository(ConfiguracionAprobacion)
    private readonly configRepo: Repository<ConfiguracionAprobacion>,
  ) {}

  findByFinca(fincaId: string): Promise<ConfiguracionAprobacion | null> {
    return this.configRepo.findOne({ where: { fincaId } });
  }

  create(data: Partial<ConfiguracionAprobacion>): Promise<ConfiguracionAprobacion> {
    return this.configRepo.save(this.configRepo.create(data));
  }

  async update(
    fincaId: string,
    data: Partial<ConfiguracionAprobacion>,
  ): Promise<ConfiguracionAprobacion | null> {
    await this.configRepo.update({ fincaId }, data);
    return this.findByFinca(fincaId);
  }
}
