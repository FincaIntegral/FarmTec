import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CategoriaGasto } from '../../../shared/enums/categoria-gasto.enum';
import { EstadoAprobacion } from '../../../shared/enums/estado-aprobacion.enum';
import { TipoAprobacion } from '../../../shared/enums/tipo-aprobacion.enum';
import { numericTransformer } from '../../../shared/utils/numeric.transformer';

@Entity('gasto')
export class Gasto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'finca_id', type: 'uuid' })
  fincaId: string;

  @Column({ type: 'enum', enum: CategoriaGasto, enumName: 'categoria_gasto' })
  categoria: CategoriaGasto;

  @Column({
    type: 'numeric',
    precision: 15,
    scale: 2,
    transformer: numericTransformer,
  })
  monto: number;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @Column({ type: 'date' })
  fecha: string;

  @Column({
    name: 'estado_aprobacion',
    type: 'enum',
    enum: EstadoAprobacion,
    enumName: 'estado_aprobacion',
    default: EstadoAprobacion.PENDIENTE,
  })
  estadoAprobacion: EstadoAprobacion;

  @Column({
    name: 'tipo_aprobacion',
    type: 'enum',
    enum: TipoAprobacion,
    enumName: 'tipo_aprobacion',
    default: TipoAprobacion.PENDIENTE,
  })
  tipoAprobacion: TipoAprobacion;

  // Marca PERMANENTE — nunca se revierte (regla de negocio + CHECK en BD)
  @Column({ name: 'auto_aprobado', type: 'boolean', default: false })
  autoAprobado: boolean;

  @Column({ name: 'creado_por', type: 'uuid' })
  creadoPor: string;

  @Column({ name: 'aprobado_por', type: 'uuid', nullable: true })
  aprobadoPor: string | null;

  @Column({ name: 'motivo_rechazo', type: 'text', nullable: true })
  motivoRechazo: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
