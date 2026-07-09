import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { SeveridadAlerta } from '../../../shared/enums/severidad-alerta.enum';
import { TipoOrigenAlerta } from '../../../shared/enums/tipo-origen-alerta.enum';

@Entity('alerta')
export class Alerta {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'finca_id', type: 'uuid' })
  fincaId: string;

  // Polimórfico (venta/gasto/animal) — sin FK formal, integridad en servicio
  @Column({ name: 'referencia_id', type: 'uuid' })
  referenciaId: string;

  @Column({
    name: 'tipo_origen',
    type: 'enum',
    enum: TipoOrigenAlerta,
    enumName: 'tipo_origen_alerta',
  })
  tipoOrigen: TipoOrigenAlerta;

  @Column({ type: 'text' })
  mensaje: string;

  @Column({
    type: 'enum',
    enum: SeveridadAlerta,
    enumName: 'severidad_alerta',
    default: SeveridadAlerta.INFO,
  })
  severidad: SeveridadAlerta;

  @Column({ type: 'boolean', default: false })
  leida: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  fecha: Date;
}
