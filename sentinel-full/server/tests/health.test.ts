import request from 'supertest'; import { describe,it,expect } from 'vitest'; import app from '../src/app.js';
describe('health',()=>{it('returns ok',async()=>{const r=await request(app).get('/api/health');expect(r.status).toBe(200);expect(r.body.ok).toBe(true);});it('protects documents',async()=>{const r=await request(app).get('/api/documents');expect(r.status).toBe(401);});});
