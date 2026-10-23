import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import crypto from 'node:crypto';
import fs from 'node:fs';

import { prisma } from './db.js';
import { env } from './env.js';
import {
  requireAuth,
  type AuthRequest
} from './middleware/auth.js';
import { audit } from './services/audit.js';
import {
  getAuthorizedDocument,
  canShare
} from './services/authorization.js';
import {
  validateFile,
  newStorageName,
  saveTemp,
  storagePath,
  removeFile
} from './storage/files.js';

import argon2 from 'argon2';
import { z } from 'zod';

const app = express();

// Render runs the application behind a proxy.
app.set('trust proxy', 1);

app.use(helmet());

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true
  })
);

app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false
});

const sensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
});

/* =========================
   HEALTH
========================= */

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'sentinel-api'
  });
});

/* =========================
   REGISTER
========================= */

app.post(
  '/api/auth/register',
  authLimiter,
  async (req, res) => {
    const p = z
      .object({
        name: z.string().trim().min(2).max(100),
        email: z.string().email(),
        password: z.string().min(6).max(128)
      })
      .safeParse(req.body);

    if (!p.success) {
      return res.status(400).json({
        error: 'Enter valid details. Password must contain between 6 and 128 characters.'
      });
    }

    const email = p.data.email.toLowerCase();

    const existing = await prisma.user.findUnique({
      where: { email }
    });

    if (existing) {
      return res.status(409).json({
        error: 'Account already exists'
      });
    }

    const user = await prisma.user.create({
      data: {
        name: p.data.name,
        email,
        passwordHash: await argon2.hash(p.data.password),
        role: 'EMPLOYEE'
      }
    });

    return res.status(201).json({
      id: user.id,
      email: user.email,
      name: user.name
    });
  }
);

/* =========================
   LOGIN
========================= */

app.post(
  '/api/auth/login',
  authLimiter,
  async (req, res) => {
    const p = z
      .object({
        email: z.string().email(),
        password: z.string().min(1).max(128)
      })
      .safeParse(req.body);

    if (!p.success) {
      return res.status(400).json({
        error: 'Invalid credentials'
      });
    }

    const email = p.data.email.toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (
      !user ||
      !(await argon2.verify(
        user.passwordHash,
        p.data.password
      ))
    ) {
      await audit('LOGIN_FAILED', {
        success: false,
        ip: req.ip
      });

      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    const sid = crypto.randomBytes(32).toString('hex');

    await prisma.session.create({
      data: {
        id: sid,
        userId: user.id,
        expiresAt: new Date(
          Date.now() + 8 * 60 * 60 * 1000
        )
      }
    });

    
res.cookie('sentinel_session', sid, {
  httpOnly: true,
  sameSite: 'none',
  secure: true,
  maxAge: 8 * 60 * 60 * 1000,
  path: '/'
});


    await audit('LOGIN', {
      userId: user.id,
      success: true,
      ip: req.ip
    });

    return res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    });
  }
);

/* =========================
   LOGOUT
========================= */

app.post(
  '/api/auth/logout',
  requireAuth,
  async (req: AuthRequest, res) => {
    const sid = req.cookies?.sentinel_session;

    if (sid) {
      await prisma.session.deleteMany({
        where: {
          id: sid,
          userId: req.user!.id
        }
      });
    }

    
res.clearCookie('sentinel_session', {
  httpOnly: true,
  sameSite: 'none',
  secure: true,
  path: '/'
});


    await audit('LOGOUT', {
      userId: req.user!.id,
      success: true,
      ip: req.ip
    });

    return res.status(204).end();
  }
);

/* =========================
   PROFILE / CURRENT USER
========================= */

app.get(
  '/api/auth/me',
  requireAuth,
  async (req: AuthRequest, res) => {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user!.id
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    return res.json(user);
  }
);

/* =========================
   CHANGE PASSWORD
========================= */

app.post(
  '/api/auth/change-password',
  requireAuth,
  authLimiter,
  async (req: AuthRequest, res) => {
    const p = z
      .object({
        currentPassword: z.string().min(1).max(128),
        newPassword: z.string().min(6).max(128),
        confirmPassword: z.string().min(1).max(128)
      })
      .safeParse(req.body);

    if (!p.success) {
      return res.status(400).json({
        error:
          'Enter your current password and a new password between 6 and 128 characters.'
      });
    }

    if (p.data.newPassword !== p.data.confirmPassword) {
      return res.status(400).json({
        error: 'New passwords do not match.'
      });
    }

    if (p.data.currentPassword === p.data.newPassword) {
      return res.status(400).json({
        error: 'Your new password must be different from your current password.'
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: req.user!.id
      }
    });

    if (
      !user ||
      !(await argon2.verify(
        user.passwordHash,
        p.data.currentPassword
      ))
    ) {
      await audit('LOGIN_FAILED', {
        userId: req.user!.id,
        success: false,
        ip: req.ip,
        details: 'Password change failed'
      });

      return res.status(400).json({
        error: 'Current password is incorrect.'
      });
    }

    // Hash the new password before saving it.
    const passwordHash = await argon2.hash(
      p.data.newPassword
    );

    // Save the new password and invalidate existing sessions.
    await prisma.$transaction([
      prisma.user.update({
        where: {
          id: user.id
        },
        data: {
          passwordHash
        }
      }),
      prisma.session.deleteMany({
        where: {
          userId: user.id
        }
      }),
      prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'LOGIN',
          success: true,
          ip: req.ip,
          details: 'Password changed successfully'
        }
      })
    ]);

    res.clearCookie('sentinel_session', {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.COOKIE_SECURE,
      path: '/'
    });

    return res.json({
      message:
        'Password changed successfully. Please log in again.'
    });
  }
);

/* =========================
   FILE UPLOAD CONFIGURATION
========================= */

const upload = multer({
  dest: './.upload-tmp',
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

/* =========================
   LIST DOCUMENTS
========================= */

app.get(
  '/api/documents',
  requireAuth,
  async (req: AuthRequest, res) => {
    const uid = req.user!.id;

    const ownedDocs = await prisma.document.findMany({
      where: {
        ownerId: uid
      },
      select: {
        id: true,
        title: true,
        category: true,
        originalName: true,
        mimeType: true,
        size: true,
        createdAt: true,
        ownerId: true,
        owner: {
          select: {
            name: true,
            email: true
          }
        },
        shares: {
          where: {
            revokedAt: null
          },
          select: {
            id: true,
            permission: true,
            recipient: {
              select: {
                email: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const sharedDocs = await prisma.document.findMany({
      where: {
        shares: {
          some: {
            recipientId: uid,
            revokedAt: null
          }
        }
      },
      select: {
        id: true,
        title: true,
        category: true,
        originalName: true,
        mimeType: true,
        size: true,
        createdAt: true,
        ownerId: true,
        owner: {
          select: {
            name: true,
            email: true
          }
        },
        shares: {
          where: {
            recipientId: uid,
            revokedAt: null
          },
          select: {
            id: true,
            permission: true,
            recipient: {
              select: {
                email: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.json([
      ...ownedDocs,
      ...sharedDocs
    ]);
  }
);

/* =========================
   UPLOAD DOCUMENT
========================= */

app.post(
  '/api/documents',
  requireAuth,
  upload.single('file'),
  async (req: AuthRequest, res) => {
    if (!req.file) {
      return res.status(400).json({
        error: 'File is required'
      });
    }

    let storageName: string | undefined;

    try {
      const p = z
        .object({
          title: z.string().trim().min(1).max(150),
          category: z.string().trim().min(1).max(80)
        })
        .parse(req.body);

      validateFile(
        req.file.originalname,
        req.file.mimetype,
        req.file.size
      );

      storageName = newStorageName(
        req.file.originalname
      );

      await saveTemp(req.file, storageName);

      const document = await prisma.document.create({
        data: {
          ownerId: req.user!.id,
          title: p.title,
          category: p.category,
          originalName: req.file.originalname,
          storageName,
          mimeType: req.file.mimetype,
          size: req.file.size
        }
      });

      await audit('UPLOAD', {
        userId: req.user!.id,
        documentId: document.id,
        success: true,
        ip: req.ip
      });

      return res.status(201).json(document);
    } catch (error) {
      if (storageName) {
        await removeFile(storageName).catch(() => {});
      }

      await audit('UPLOAD', {
        userId: req.user!.id,
        success: false,
        ip: req.ip,
        details: 'upload rejected'
      });

      return res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : 'Upload failed'
      });
    } finally {
      await fs.promises
        .unlink(req.file.path)
        .catch(() => {});
    }
  }
);

/* =========================
   VIEW DOCUMENT
========================= */

app.get(
  '/api/documents/:id',
  requireAuth,
  async (req: AuthRequest, res) => {
    const documentId = String(req.params.id);

    const document = await getAuthorizedDocument(
      req.user!.id,
      documentId,
      'VIEW'
    );

    if (!document) {
      await audit('ACCESS_DENIED', {
        userId: req.user!.id,
        documentId,
        success: false,
        ip: req.ip
      });

      return res.status(403).json({
        error: 'Forbidden'
      });
    }

    await audit('VIEW', {
      userId: req.user!.id,
      documentId: document.id,
      success: true,
      ip: req.ip
    });

    return res.json({
      id: document.id,
      title: document.title,
      category: document.category,
      originalName: document.originalName,
      mimeType: document.mimeType,
      size: document.size,
      createdAt: document.createdAt,
      ownerId: document.ownerId
    });
  }
);

/* =========================
   DOWNLOAD DOCUMENT
========================= */

app.get(
  '/api/documents/:id/download',
  requireAuth,
  sensitiveLimiter,
  async (req: AuthRequest, res) => {
    const documentId = String(req.params.id);

    const document = await getAuthorizedDocument(
      req.user!.id,
      documentId,
      'DOWNLOAD'
    );

    if (!document) {
      await audit('ACCESS_DENIED', {
        userId: req.user!.id,
        documentId,
        success: false,
        ip: req.ip
      });

      return res.status(403).json({
        error: 'Forbidden'
      });
    }

    const filePath = storagePath(document.storageName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: 'File unavailable'
      });
    }

    await audit('DOWNLOAD', {
      userId: req.user!.id,
      documentId: document.id,
      success: true,
      ip: req.ip
    });

    return res.download(
      filePath,
      document.originalName
    );
  }
);

/* =========================
   SHARE DOCUMENT
========================= */

app.post(
  '/api/documents/:id/share',
  requireAuth,
  async (req: AuthRequest, res) => {
    const documentId = String(req.params.id);

    if (
      !(await canShare(
        req.user!.id,
        documentId
      ))
    ) {
      return res.status(403).json({
        error: 'Only the owner can share this document'
      });
    }

    const p = z
      .object({
        recipientEmail: z.string().email(),
        permission: z.enum(['VIEW', 'DOWNLOAD'])
      })
      .safeParse(req.body);

    if (!p.success) {
      return res.status(400).json({
        error: 'Invalid input'
      });
    }

    const recipient = await prisma.user.findUnique({
      where: {
        email: p.data.recipientEmail.toLowerCase()
      }
    });

    if (!recipient || recipient.id === req.user!.id) {
      return res.status(400).json({
        error: 'Invalid recipient'
      });
    }

    const document = await prisma.document.findUnique({
      where: {
        id: documentId
      }
    });

    if (!document) {
      return res.status(404).json({
        error: 'Document not found'
      });
    }

    const share = await prisma.documentShare.upsert({
      where: {
        documentId_recipientId: {
          documentId: document.id,
          recipientId: recipient.id
        }
      },
      update: {
        permission: p.data.permission,
        revokedAt: null
      },
      create: {
        documentId: document.id,
        recipientId: recipient.id,
        permission: p.data.permission
      }
    });

    await audit('SHARE', {
      userId: req.user!.id,
      documentId: document.id,
      success: true,
      ip: req.ip,
      details: `shared with ${recipient.id}`
    });

    return res.status(201).json({
      id: share.id,
      permission: share.permission,
      recipient: recipient.email
    });
  }
);

/* =========================
   REVOKE SHARE
========================= */

app.post(
  '/api/documents/:id/revoke/:shareId',
  requireAuth,
  async (req: AuthRequest, res) => {
    const documentId = String(req.params.id);
    const shareId = String(req.params.shareId);

    if (
      !(await canShare(
        req.user!.id,
        documentId
      ))
    ) {
      return res.status(403).json({
        error: 'Only the owner can revoke access'
      });
    }

    const share = await prisma.documentShare.findFirst({
      where: {
        id: shareId,
        documentId
      }
    });

    if (!share) {
      return res.status(404).json({
        error: 'Share not found'
      });
    }

    await prisma.documentShare.update({
      where: {
        id: share.id
      },
      data: {
        revokedAt: new Date()
      }
    });

    await audit('REVOKE', {
      userId: req.user!.id,
      documentId,
      success: true,
      ip: req.ip
    });

    return res.status(204).end();
  }
);

/* =========================
   DELETE DOCUMENT
========================= */

app.delete(
  '/api/documents/:id',
  requireAuth,
  async (req: AuthRequest, res) => {
    const documentId = String(req.params.id);

    const document = await getAuthorizedDocument(
      req.user!.id,
      documentId,
      'DELETE'
    );

    if (!document) {
      await audit('ACCESS_DENIED', {
        userId: req.user!.id,
        documentId,
        success: false,
        ip: req.ip
      });

      return res.status(403).json({
        error: 'Forbidden'
      });
    }

    await prisma.$transaction(async tx => {
      await tx.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'DELETE',
          success: true,
          ip: req.ip,
          details: `document ${document.id} deleted`
        }
      });

      await tx.document.delete({
        where: {
          id: documentId
        }
      });
    });

    await removeFile(document.storageName);

    return res.status(204).end();
  }
);

/* =========================
   ERROR HANDLER
========================= */

app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error('Request error:', err?.message);

    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        error: 'Upload rejected'
      });
    }

    return res.status(500).json({
      error: 'Internal server error'
    });
  }
);

export default app;
