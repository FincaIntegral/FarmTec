import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { numericTransformer } from '../../../shared/utils/numeric.transformer';

@Entity('historial_peso')
export class HistorialPeso {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'animal_id', type: 'uuid' })
  animalId: string;

  @Column({ name: 'finca_id', type: 'uuid' })
  fincaId: string;

  @Column({
    name: 'peso_kg',
    type: 'numeric',
    precision: 8,
    scale: 2,
    transformer: numericTransformer,
  })
  pesoKg: number;

  @Column({ type: 'date' })
  fecha: string;

  @Column({ name: 'registrado_por', type: 'uuid', nullable: true })
  registradoPor: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
