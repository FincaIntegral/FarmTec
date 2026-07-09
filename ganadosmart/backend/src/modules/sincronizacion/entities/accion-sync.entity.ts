import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EstadoSync } from '../../../shared/enums/estado-sync.enum';
import { TipoAccionSync } from '../../../shared/enums/tipo-accion-sync.enum';

@Entity('accion_sync')
export class AccionSync {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'finca_id', type: 'uuid' })
  fincaId: string;

  @Column({ name: 'usuario_id', type: 'uuid' })
  usuarioId: string;

  @Column({
    name: 'tipo_accion',
    type: 'enum',
    enum: TipoAccionSync,
    enumName: 'tipo_accion_sync',
  })
  tipoAccion: TipoAccionSync;

  @Column({ name: 'timestamp_local', type: 'timestamptz' })
  timestampLocal: Date;

  @Column({ name: 'version_base', type: 'text', nullable: true })
  versionBase: string | null;

  @Column({ type: 'jsonb' })
  datos: Record<string, unknown>;

  @Column({
    name: 'estado_sync',
    type: 'enum',
    enum: EstadoSync,
    enumName: 'estado_sync',
    default: EstadoSync.PENDIENTE,
  })
  estadoSync: EstadoSync;

  @Column({ name: 'detalle_conflicto', type: 'jsonb', nullable: true })
  detalleConflicto: Record<string, unknown> | null;

  @Column({ name: 'procesado_en', type: 'timestamptz', nullable: true })
  procesadoEn: Date | null;
}
