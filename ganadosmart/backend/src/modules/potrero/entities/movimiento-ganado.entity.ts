import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('movimiento_ganado')
export class MovimientoGanado {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'finca_id', type: 'uuid' })
  fincaId: string;

  @Column({ name: 'animal_id', type: 'uuid' })
  animalId: string;

  @Column({ name: 'potrero_origen_id', type: 'uuid' })
  potreroOrigenId: string;

  @Column({ name: 'potrero_destino_id', type: 'uuid' })
  potreroDestinoId: string;

  @Column({ type: 'date' })
  fecha: string;

  @Column({ type: 'text', nullable: true })
  observacion: string | null;

  @Column({ name: 'registrado_por', type: 'uuid', nullable: true })
  registradoPor: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
