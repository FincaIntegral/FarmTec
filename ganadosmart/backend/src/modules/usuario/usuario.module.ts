import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from './entities/usuario.entity';
import { FincaTenantGuard } from './guards/finca-tenant.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsuarioController } from './usuario.controller';
import { UsuarioRepository } from './usuario.repository';
import { UsuarioService } from './usuario.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        // Segundos, no un string tipo "8h" — evita el tipo StringValue de 'ms'.
        signOptions: {
          expiresIn: Number(config.get<string>('JWT_EXPIRES_IN_SECONDS')),
        },
      }),
    }),
  ],
  controllers: [UsuarioController],
  providers: [
    UsuarioService,
    UsuarioRepository,
    JwtStrategy,
    // Guards globales — se aplican a TODO endpoint de la app, no solo a los
    // de este módulo. @Public() es el único escape hatch (usado en /auth/login).
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: FincaTenantGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  exports: [UsuarioService, UsuarioRepository],
})
export class UsuarioModule {}
