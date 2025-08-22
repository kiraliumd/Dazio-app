import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const client = postgres(process.env.DATABASE_URL, {
  max: 1,
  ssl: false, // AVISO: Apenas para desenvolvimento - Desabilita SSL completamente
});

export const db = drizzle(client);
