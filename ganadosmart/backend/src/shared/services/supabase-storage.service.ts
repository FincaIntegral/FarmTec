import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

const BUCKET_ANIMAL_FOTOS = 'animal-fotos';

@Injectable()
export class SupabaseStorageService {
  private readonly client: SupabaseClient;

  constructor(config: ConfigService) {
    const url = config.get<string>('supabaseUrl');
    const key = config.get<string>('SUPABASE_SECRET_KEY');

    // El proyecto usa Supabase solo para Storage; Realtime no se usa. Pero
    // supabase-js 2.110 inicializa Realtime sí o sí, y Node 20 no trae
    // WebSocket global. Proveemos `ws` vía `transport` para que el cliente
    // pueda construirse en el servidor (sin suscripciones no hay conexión).
    this.client = createClient(url!, key!, {
      realtime: {
        transport: WebSocket as unknown as import('@supabase/realtime-js').WebSocketLikeConstructor,
      },
    });
  }

  async subirFotoAnimal(
    fincaId: string,
    animalId: string,
    archivo: Express.Multer.File,
  ): Promise<string> {
    const extension = archivo.originalname.split('.').pop() ?? 'jpg';
    const ruta = `${fincaId}/${animalId}-${Date.now()}.${extension}`;

    const { error } = await this.client.storage
      .from(BUCKET_ANIMAL_FOTOS)
      .upload(ruta, archivo.buffer, {
        contentType: archivo.mimetype,
        upsert: false,
      });
    if (error) {
      throw new Error(`No se pudo subir la foto: ${error.message}`);
    }

    const { data } = this.client.storage.from(BUCKET_ANIMAL_FOTOS).getPublicUrl(ruta);
    return data.publicUrl;
  }
}
