import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RolUsuario } from '../../../shared/enums/rol-usuario.enum';

@Entity('usuario')
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'finca_id', type: 'uuid' })
  fincaId: string;

  @Column({ type: 'varchar', length: 200 })
  nombre: string;

  @Column({ type: 'varchar', length: 255 })
  correo: string;

  @Column({ name: 'contrasena_hash', type: 'text' })
  contrasenaHash: string;

  @Column({
    type: 'enum',
    enum: RolUsuario,
    enumName: 'rol_usuario',
  })
  rol: RolUsuario;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @Column({ name: 'ultimo_acceso', type: 'timestamptz', nullable: true })
  ultimoAcceso: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
