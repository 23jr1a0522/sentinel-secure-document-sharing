import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../db.js';
export type AuthRequest = Request & { user?: { id:string; email:string; name:string; role:'ADMIN'|'MANAGER'|'EMPLOYEE'; department:string|null } };
export async function requireAuth(req:AuthRequest,res:Response,next:NextFunction){
 const sid=req.cookies?.sentinel_session; if(!sid) return res.status(401).json({error:'Authentication required'});
 const s=await prisma.session.findUnique({where:{id:sid},include:{user:true}});
 if(!s || s.expiresAt<=new Date()){ if(s) await prisma.session.delete({where:{id:s.id}}).catch(()=>{}); return res.status(401).json({error:'Session expired or invalid'}); }
 req.user={id:s.user.id,email:s.user.email,name:s.user.name,role:s.user.role,department:s.user.department}; next();
}
export function requireRole(...roles:Array<'ADMIN'|'MANAGER'|'EMPLOYEE'>){return (req:AuthRequest,res:Response,next:NextFunction)=>{if(!req.user||!roles.includes(req.user.role)) return res.status(403).json({error:'Forbidden'}); next();}}
