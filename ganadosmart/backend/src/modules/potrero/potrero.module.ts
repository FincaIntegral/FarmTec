import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Animal } from '../animal/entities/animal.entity';
import { MovimientoGanado } from './entities/movimiento-ganado.entity';
import { Potrero } from './entities/potrero.entity';
import { PotreroController } from './potrero.controller';
import { PotreroRepository } from './potrero.repository';
import { PotreroService } from './potrero.service';

@Module({
  // Animal solo para validar que el animal del movimiento sea de la finca.
  imports: [TypeOrmModule.forFeature([Potrero, MovimientoGanado, Animal])],
  controllers: [PotreroController],
  providers: [PotreroService, PotreroRepository],
  exports: [PotreroRepository],
})
export class PotreroModule {}
