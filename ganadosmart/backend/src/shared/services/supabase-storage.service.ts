import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const BUCKET_ANIMAL_FOTOS = 'animal-fotos';

@Injectable()
export class SupabaseStorageService {
  private readonly client: SupabaseClient;

  constructor(config: ConfigService) {
  const url = config.get<string>('SUPABASE_URL');
  const key = config.get<string>('SUPABASE_SECRET_KEY');

  console.log('SUPABASE_URL =>', JSON.stringify(url));
  console.log('SUPABASE_SECRET_KEY existe =>', !!key);

  this.client = createClient(url!, key!);
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
