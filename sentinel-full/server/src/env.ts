import 'dotenv/config';
import { z } from 'zod';
export const env = z.object({
 NODE_ENV:z.enum(['development','test','production']).default('development'),
 PORT:z.coerce.number().default(5000), DATABASE_URL:z.string().min(1), SESSION_SECRET:z.string().min(32), CLIENT_URL:z.string().url().default('http://localhost:5173'), STORAGE_PATH:z.string().default('../storage'), COOKIE_SECURE:z.coerce.boolean().default(false)
}).parse(process.env);
