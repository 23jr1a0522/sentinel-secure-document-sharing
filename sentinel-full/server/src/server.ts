import app from './app.js'; import { env } from './env.js'; import { ensureStorage } from './storage/files.js';
await ensureStorage(); app.listen(env.PORT,()=>console.log(`Sentinel API listening on http://localhost:${env.PORT}`));
