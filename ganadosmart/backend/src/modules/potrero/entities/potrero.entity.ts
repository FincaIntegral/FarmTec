import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EstadoPotrero } from '../../../shared/enums/estado-potrero.enum';
import { numericTransformer } from '../../../shared/utils/numeric.transformer';

@Entity('potrero')
export class Potrero {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'finca_id', type: 'uuid' })
  fincaId: string;

  @Column({ type: 'varchar', length: 150 })
  nombre: string;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: numericTransformer,
  })
  hectareas: number | null;

  @Column({ name: 'tipo_pasto', type: 'varchar', length: 150, nullable: true })
  tipoPasto: string | null;

  @Column({ name: 'capacidad_estimada', type: 'integer', nullable: true })
  capacidadEstimada: number | null;

  @Column({
    type: 'enum',
    enum: EstadoPotrero,
    enumName: 'estado_potrero',
    default: EstadoPotrero.DISPONIBLE,
  })
  estado: EstadoPotrero;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
