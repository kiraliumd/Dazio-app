// Arquivo temporariamente desabilitado - Drizzle ORM não configurado
// import { drizzle } from 'drizzle-orm/postgres-js';
// import postgres from 'postgres';
// import * as dotenv from 'dotenv';

// Arquivo temporariamente desabilitado
// dotenv.config({ path: '.env.local' });

// if (!process.env.DATABASE_URL) {
//   throw new Error('DATABASE_URL is not set');
// }

// const client = postgres(process.env.DATABASE_URL, {
//   max: 1,
//   ssl: false, // AVISO: Apenas para desenvolvimento - Desabilita SSL completamente
// });

// export const db = drizzle(client);

// Placeholder para evitar erros de build
export const db = {} as any;
