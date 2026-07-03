import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { Client } from 'pg';

const FINCA_CODIGO = 'FINCA-DEMO-001';
const USUARIO_CORREO = 'dueno@ganadosmart.test';
const USUARIO_CONTRASENA = 'Password123!';

async function seed() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    const fincaExistente = await client.query<{ id: string }>(
      'SELECT id FROM finca WHERE codigo = $1',
      [FINCA_CODIGO],
    );

    let fincaId: string;
    if (fincaExistente.rows.length > 0) {
      fincaId = fincaExistente.rows[0].id;
      console.log(`Finca ya existe: ${fincaId}`);
    } else {
      const fincaResult = await client.query<{ id: string }>(
        `INSERT INTO finca (codigo, nombre, municipio, departamento)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [FINCA_CODIGO, 'Finca Demo', 'Villavicencio', 'Meta'],
      );
      fincaId = fincaResult.rows[0].id;
      console.log(`Finca creada: ${fincaId}`);
    }

    const usuarioExistente = await client.query(
      'SELECT id FROM usuario WHERE correo = $1 AND finca_id = $2',
      [USUARIO_CORREO, fincaId],
    );

    if (usuarioExistente.rows.length > 0) {
      console.log('Usuario de prueba ya existe, no se crea de nuevo.');
    } else {
      const contrasenaHash = await bcrypt.hash(USUARIO_CONTRASENA, 10);
      await client.query(
        `INSERT INTO usuario (finca_id, nombre, correo, contrasena_hash, rol)
         VALUES ($1, $2, $3, $4, 'dueno_finca')`,
        [fincaId, 'Dueño Demo', USUARIO_CORREO, contrasenaHash],
      );
      console.log('Usuario de prueba creado.');
    }

    console.log('--- Credenciales de prueba ---');
    console.log(`correo:     ${USUARIO_CORREO}`);
    console.log(`contrasena: ${USUARIO_CONTRASENA}`);
  } finally {
    await client.end();
  }
}

seed().catch((err: unknown) => {
  console.error('Seed falló:', err);
  process.exit(1);
});
