import { Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { numericTransformer } from '../../../shared/utils/numeric.transformer';

@Entity('configuracion_aprobacion')
export class ConfiguracionAprobacion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'finca_id', type: 'uuid' })
  fincaId: string;

  @Column({
    name: 'monto_umbral_auto',
    type: 'numeric',
    precision: 15,
    scale: 2,
    nullable: true,
    transformer: numericTransformer,
  })
  montoUmbralAuto: number | null;

  @Column({ name: 'dias_espera_aprobacion', type: 'integer', nullable: true })
  diasEsperaAprobacion: number | null;

  @Column({ name: 'aplica_a_ventas', type: 'boolean', default: true })
  aplicaAVentas: boolean;

  @Column({ name: 'aplica_a_gastos', type: 'boolean', default: true })
  aplicaAGastos: boolean;

  @Column({ name: 'configurado_por', type: 'uuid', nullable: true })
  configuradoPor: string | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
