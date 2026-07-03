import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('mortalidad')
export class Mortalidad {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // UNIQUE(animal_id) en schema.sql — un animal solo puede morir una vez.
  @Column({ name: 'animal_id', type: 'uuid', unique: true })
  animalId: string;

  @Column({ name: 'finca_id', type: 'uuid' })
  fincaId: string;

  @Column({ type: 'date' })
  fecha: string;

  @Column({ type: 'text' })
  causa: string;

  @Column({ name: 'registrado_por', type: 'uuid', nullable: true })
  registradoPor: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
