import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CategoriaAnimal } from '../../../shared/enums/categoria-animal.enum';
import { EstadoAnimal } from '../../../shared/enums/estado-animal.enum';
import { SexoAnimal } from '../../../shared/enums/sexo-animal.enum';
import { numericTransformer } from '../../../shared/utils/numeric.transformer';

@Entity('animal')
export class Animal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'finca_id', type: 'uuid' })
  fincaId: string;

  @Column({ type: 'varchar', length: 100 })
  codigo: string;

  @Column({ name: 'madre_id', type: 'uuid', nullable: true })
  madreId: string | null;

  @Column({ name: 'padre_id', type: 'uuid', nullable: true })
  padreId: string | null;

  @Column({ type: 'enum', enum: CategoriaAnimal, enumName: 'categoria_animal' })
  categoria: CategoriaAnimal;

  @Column({ type: 'enum', enum: SexoAnimal, enumName: 'sexo_animal' })
  sexo: SexoAnimal;

  @Column({ name: 'fecha_nacimiento', type: 'date', nullable: true })
  fechaNacimiento: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  raza: string | null;

  @Column({
    name: 'valor_comercial_estimado',
    type: 'numeric',
    precision: 15,
    scale: 2,
    nullable: true,
    transformer: numericTransformer,
  })
  valorComercialEstimado: number | null;

  @Column({
    name: 'valor_comercial_ajustado',
    type: 'numeric',
    precision: 15,
    scale: 2,
    nullable: true,
    transformer: numericTransformer,
  })
  valorComercialAjustado: number | null;

  @Column({ name: 'foto_url', type: 'text', nullable: true })
  fotoUrl: string | null;

  @Column({
    type: 'enum',
    enum: EstadoAnimal,
    enumName: 'estado_animal',
    default: EstadoAnimal.ACTIVO,
  })
  estado: EstadoAnimal;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
