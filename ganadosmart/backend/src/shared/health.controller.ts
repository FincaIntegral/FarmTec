import { Controller, Get } from '@nestjs/common';
import { Public } from './decorators/public.decorator';

// Infraestructura, no API de negocio: es el health check que consulta
// Fly.io (fly.toml → http_service.checks → GET /api/v1/health).
@Controller('health')
export class HealthController {
  @Public()
  @Get()
  check() {
    return { status: 'ok' };
  }
}
