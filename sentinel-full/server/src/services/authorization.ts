import { prisma } from '../db.js';
export async function getAuthorizedDocument(userId:string, documentId:string, action:'VIEW'|'DOWNLOAD'|'SHARE'|'REVOKE'|'DELETE') {
 const doc=await prisma.document.findUnique({where:{id:documentId},include:{shares:true}}); if(!doc) return null;
 if(doc.ownerId===userId) return doc;
 if(action==='VIEW'||action==='DOWNLOAD'){
  const share=doc.shares.find(s =>
  s.recipientId===userId &&
  !s.revokedAt &&
  (s.permission==='DOWNLOAD' || (action==='VIEW' && s.permission==='VIEW'))
);
  if(share) return doc;
 }
 return null;
}
export async function canShare(userId:string, documentId:string){const d=await prisma.document.findUnique({where:{id:documentId},select:{ownerId:true}});return !!d&&d.ownerId===userId;}
