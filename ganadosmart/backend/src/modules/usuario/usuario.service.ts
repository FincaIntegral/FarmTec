import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import {
  PaginacionMeta,
  PaginatedResponse,
} from '../../shared/dto/paginacion-meta.dto';
import { JwtPayload } from '../../shared/interfaces/jwt-payload.interface';
import { CambiarContrasenaDto } from './dto/cambiar-contrasena.dto';
import { CrearUsuarioDto } from './dto/create-usuario.dto';
import { LoginDto } from './dto/login.dto';
import { UsuarioResponse } from './dto/usuario-response.dto';
import { UsuarioRepository } from './usuario.repository';

const SALT_ROUNDS = 10;

@Injectable()
export class UsuarioService {
  constructor(
    private readonly usuarioRepository: UsuarioRepository,
    private readonly jwtService: JwtService,
  ) {}

  async login(
    dto: LoginDto,
  ): Promise<{ accessToken: string; usuario: UsuarioResponse }> {
    const usuario = await this.usuarioRepository.findByCorreo(dto.correo);

    const contrasenaValida =
      usuario && (await bcrypt.compare(dto.contrasena, usuario.contrasenaHash));

    if (!usuario || !usuario.activo || !contrasenaValida) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    await this.usuarioRepository.actualizarUltimoAcceso(usuario.id);

    const payload: JwtPayload = {
      sub: usuario.id,
      fincaId: usuario.fincaId,
      rol: usuario.rol,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      usuario: UsuarioResponse.fromEntity(usuario),
    };
  }

  async findAll(
    fincaId: string,
    pagina: number,
    limite: number,
  ): Promise<PaginatedResponse<UsuarioResponse>> {
    const [usuarios, total] = await this.usuarioRepository.findAllByFinca(
      fincaId,
      pagina,
      limite,
    );

    return {
      datos: usuarios.map((usuario) => UsuarioResponse.fromEntity(usuario)),
      meta: PaginacionMeta.build(total, pagina, limite),
    };
  }

  async create(
    dto: CrearUsuarioDto,
    fincaId: string,
  ): Promise<UsuarioResponse> {
    const yaExiste = await this.usuarioRepository.existsByCorreoInFinca(
      dto.correo,
      fincaId,
    );
    if (yaExiste) {
      throw new BadRequestException(
        'El correo ya está registrado en esta finca',
      );
    }

    const contrasenaHash = await bcrypt.hash(dto.contrasena, SALT_ROUNDS);

    const usuario = await this.usuarioRepository.create({
      fincaId,
      nombre: dto.nombre,
      correo: dto.correo,
      contrasenaHash,
      rol: dto.rol,
    });

    return UsuarioResponse.fromEntity(usuario);
  }

  async desactivar(
    usuarioId: string,
    usuarioActual: JwtPayload,
  ): Promise<UsuarioResponse> {
    if (usuarioId === usuarioActual.sub) {
      throw new BadRequestException(
        'No puedes desactivarte a ti mismo',
      );
    }

    const usuario = await this.usuarioRepository.findById(
      usuarioId,
      usuarioActual.fincaId,
    );
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (usuario.rol === 'dueno_finca' && usuario.activo) {
      const dueñosActivos = await this.usuarioRepository.countDueñosActivos(
        usuarioActual.fincaId,
      );
      if (dueñosActivos === 1) {
        throw new ConflictException(
          'La finca debe tener al menos un dueño activo',
        );
      }
    }

    const usuarioDesactivado = await this.usuarioRepository.desactivar(
      usuarioId,
      usuarioActual.fincaId,
    );

    if (!usuarioDesactivado) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return UsuarioResponse.fromEntity(usuarioDesactivado);
  }

  async reactivar(
    usuarioId: string,
    usuarioActual: JwtPayload,
  ): Promise<UsuarioResponse> {
    const usuario = await this.usuarioRepository.findById(
      usuarioId,
      usuarioActual.fincaId,
    );
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const usuarioReactivado = await this.usuarioRepository.reactivar(
      usuarioId,
      usuarioActual.fincaId,
    );

    if (!usuarioReactivado) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return UsuarioResponse.fromEntity(usuarioReactivado);
  }

  async cambiarContrasena(
    usuarioId: string,
    dto: CambiarContrasenaDto,
    usuarioActual: JwtPayload,
  ): Promise<UsuarioResponse> {
    const usuario = await this.usuarioRepository.findById(
      usuarioId,
      usuarioActual.fincaId,
    );
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const contrasenaHash = await bcrypt.hash(
      dto.nuevaContrasena,
      SALT_ROUNDS,
    );

    const usuarioActualizado = await this.usuarioRepository.actualizarContrasena(
      usuarioId,
      usuarioActual.fincaId,
      contrasenaHash,
    );

    if (!usuarioActualizado) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return UsuarioResponse.fromEntity(usuarioActualizado);
  }
}
