import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EstadoReproduccion } from '../../../shared/enums/estado-reproduccion.enum';
import { TipoReproduccion } from '../../../shared/enums/tipo-reproduccion.enum';

@Entity('reproduccion')
export class Reproduccion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'finca_id', type: 'uuid' })
  fincaId: string;

  // NULL cuando la inseminación fue con pajilla externa (sin toro propio)
  @Column({ name: 'toro_id', type: 'uuid', nullable: true })
  toroId: string | null;

  @Column({ name: 'vaca_id', type: 'uuid' })
  vacaId: string;

  @Column({ type: 'enum', enum: TipoReproduccion, enumName: 'tipo_reproduccion' })
  tipo: TipoReproduccion;

  @Column({ type: 'date' })
  fecha: string;

  @Column({ name: 'fecha_probable_parto', type: 'date', nullable: true })
  fechaProbableParto: string | null;

  @Column({
    type: 'enum',
    enum: EstadoReproduccion,
    enumName: 'estado_reproduccion',
    default: EstadoReproduccion.EN_CURSO,
  })
  estado: EstadoReproduccion;

  @Column({ name: 'becerro_resultante_id', type: 'uuid', nullable: true })
  becerroResultanteId: string | null;

  @Column({ name: 'pajilla_proveedor', type: 'varchar', length: 200, nullable: true })
  pajillaProveedor: string | null;

  @Column({ name: 'pajilla_raza', type: 'varchar', length: 150, nullable: true })
  pajillaRaza: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
