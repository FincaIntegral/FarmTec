import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { RolUsuario } from '../../shared/enums/rol-usuario.enum';
import type { JwtPayload } from '../../shared/interfaces/jwt-payload.interface';
import { AnimalService } from './animal.service';
import { ActualizarFotoDto } from './dto/actualizar-foto.dto';
import { CrearAnimalDto } from './dto/create-animal.dto';
import { ListarAnimalesQueryDto } from './dto/listar-animales-query.dto';
import { RegistrarMortalidadDto } from './dto/registrar-mortalidad.dto';
import { RegistrarPesoDto } from './dto/registrar-peso.dto';

const ROLES_ESCRITURA = [
  RolUsuario.DUENO_FINCA,
  RolUsuario.ADMINISTRADOR_FINCA,
];
const ROLES_CAMPO = [
  RolUsuario.DUENO_FINCA,
  RolUsuario.ADMINISTRADOR_FINCA,
  RolUsuario.VETERINARIO,
];

@Controller('animales')
export class AnimalController {
  constructor(private readonly animalService: AnimalService) {}

  @Get()
  findAll(
    @Query()
    {
      pagina,
      limite,
      estado,
      sexo,
      categoria,
      buscar,
      potreroId,
    }: ListarAnimalesQueryDto,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.animalService.findAll(
      usuario.fincaId,
      { estado, sexo, categoria, buscar, potreroId },
      pagina,
      limite,
    );
  }

  @Roles(...ROLES_ESCRITURA)
  @Post()
  create(@Body() dto: CrearAnimalDto, @CurrentUser() usuario: JwtPayload) {
    return this.animalService.create(dto, usuario.fincaId);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.animalService.findOne(id, usuario.fincaId);
  }

  @Roles(...ROLES_ESCRITURA)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CrearAnimalDto,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.animalService.update(id, usuario.fincaId, dto);
  }

  @Roles(...ROLES_CAMPO)
  @Post(':id/peso')
  registrarPeso(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RegistrarPesoDto,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.animalService.registrarPeso(
      id,
      usuario.fincaId,
      dto,
      usuario.sub,
    );
  }

  @Roles(...ROLES_CAMPO)
  @Post(':id/mortalidad')
  @HttpCode(200)
  registrarMortalidad(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RegistrarMortalidadDto,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.animalService.registrarMortalidad(
      id,
      usuario.fincaId,
      dto,
      usuario.sub,
    );
  }

  @Roles(...ROLES_CAMPO)
  @Patch(':id/foto')
  actualizarFoto(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarFotoDto,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.animalService.actualizarFoto(id, usuario.fincaId, dto);
  }
}
