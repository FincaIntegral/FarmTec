import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnimalModule } from './modules/animal/animal.module';
import { ConfiguracionModule } from './modules/configuracion/configuracion.module';
import { UsuarioModule } from './modules/usuario/usuario.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        autoLoadEntities: true,
        // El schema se gestiona con schema.sql / migraciones de TypeORM,
        // nunca con sincronización automática desde las entities.
        synchronize: false,
      }),
    }),
    UsuarioModule,
    AnimalModule,
    ConfiguracionModule,
  ],
})
export class AppModule {}
