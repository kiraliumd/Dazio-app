'use server';

import { db } from '@/lib/db';
import { rentals } from '@/lib/schema';
import { eq } from 'drizzle-orm';
