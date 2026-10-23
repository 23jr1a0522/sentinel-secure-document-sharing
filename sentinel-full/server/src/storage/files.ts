import fs from 'node:fs/promises'; import path from 'node:path'; import crypto from 'node:crypto'; import { env } from '../env.js';
const allowed = new Map([['pdf','application/pdf'],['txt','text/plain'],['png','image/png'],['jpg','image/jpeg'],['jpeg','image/jpeg'],['docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document']]);
export async function ensureStorage(){await fs.mkdir(path.resolve(env.STORAGE_PATH),{recursive:true});}
export function validateFile(name:string,mime:string,size:number){if(size>10*1024*1024) throw new Error('File exceeds 10 MB limit'); const ext=path.extname(name).slice(1).toLowerCase(); if(!allowed.has(ext)||allowed.get(ext)!==mime) throw new Error('Unsupported file type or MIME type');}
export function newStorageName(name:string){return `${crypto.randomUUID()}${path.extname(name).toLowerCase()}`;}
export function storagePath(name:string){return path.join(path.resolve(env.STORAGE_PATH),name);}
export async function saveTemp(file:Express.Multer.File, storageName:string){await ensureStorage(); await fs.rename(file.path,storagePath(storageName));}
export async function removeFile(name:string){await fs.unlink(storagePath(name)).catch(()=>{});}
