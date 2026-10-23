import { AuditAction } from '@prisma/client';
import { prisma } from '../db.js';
export async function audit(action: AuditAction, data: {userId?:string; documentId?:string; success:boolean; ip?:string; details?:string}) {
  const safe = data.details?.slice(0,500);
  await prisma.auditLog.create({data:{action, userId:data.userId, documentId:data.documentId, success:data.success, ip:data.ip?.slice(0,64), details:safe}});
}
