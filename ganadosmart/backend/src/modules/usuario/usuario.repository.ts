import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RolUsuario } from '../../shared/enums/rol-usuario.enum';
import { Usuario } from './entities/usuario.entity';

@Injectable()
export class UsuarioRepository {
  constructor(
    @InjectRepository(Usuario)
    private readonly repo: Repository<Usuario>,
  ) {}

  // Login recibe solo {correo, contrasena}, sin fincaId — el correo es único
  // por finca (UNIQUE(finca_id, correo)), no globalmente. Ver limitación
  // conocida registrada en historial-auditor.md.
  findByCorreo(correo: string): Promise<Usuario | null> {
    return this.repo.findOne({ where: { correo } });
  }

  findById(id: string, fincaId: string): Promise<Usuario | null> {
    return this.repo.findOne({ where: { id, fincaId } });
  }

  existsByCorreoInFinca(correo: string, fincaId: string): Promise<boolean> {
    return this.repo.exists({ where: { correo, fincaId } });
  }

  async findAllByFinca(
    fincaId: string,
    pagina: number,
    limite: number,
  ): Promise<[Usuario[], number]> {
    return this.repo.findAndCount({
      where: { fincaId },
      order: { createdAt: 'DESC' },
      skip: (pagina - 1) * limite,
      take: limite,
    });
  }

  create(data: Partial<Usuario>): Promise<Usuario> {
    const usuario = this.repo.create(data);
    return this.repo.save(usuario);
  }

  async actualizarUltimoAcceso(id: string): Promise<void> {
    await this.repo.update({ id }, { ultimoAcceso: new Date() });
  }

  async desactivar(id: string, fincaId: string): Promise<Usuario | null> {
    await this.repo.update(
      { id, fincaId },
      { activo: false },
    );
    return this.repo.findOne({ where: { id, fincaId } });
  }

  async reactivar(id: string, fincaId: string): Promise<Usuario | null> {
    await this.repo.update(
      { id, fincaId },
      { activo: true },
    );
    return this.repo.findOne({ where: { id, fincaId } });
  }

  async actualizarContrasena(
    id: string,
    fincaId: string,
    contrasenaHash: string,
  ): Promise<Usuario | null> {
    await this.repo.update(
      { id, fincaId },
      { contrasenaHash },
    );
    return this.repo.findOne({ where: { id, fincaId } });
  }

  countDueñosActivos(fincaId: string): Promise<number> {
    return this.repo.count({
      where: {
        fincaId,
        rol: RolUsuario.DUENO_FINCA,
        activo: true,
      },
    });
  }
}
