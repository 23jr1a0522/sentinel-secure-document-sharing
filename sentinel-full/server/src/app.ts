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
  max: 100
});

/* =========================
   HEALTH
========================= */

app.get('/api/health', (_, res) => {
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
        name: z.string().min(2).max(100),
        email: z.string().email(),
        password: z.string().min(12).max(128)
      })
      .safeParse(req.body);

    if (!p.success) {
      return res.status(400).json({
        error: 'Invalid input'
      });
    }

    const email = p.data.email.toLowerCase();

    if (
      await prisma.user.findUnique({
        where: { email }
      })
    ) {
      return res.status(409).json({
        error: 'Account already exists'
      });
    }

    const user = await prisma.user.create({
      data: {
        name: p.data.name,
        email,
        passwordHash: await argon2.hash(
          p.data.password
        ),
        role: 'EMPLOYEE'
      }
    });

    res.status(201).json({
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
        password: z.string().min(1)
      })
      .safeParse(req.body);

    if (!p.success) {
      return res.status(400).json({
        error: 'Invalid credentials'
      });
    }

    const email = p.data.email.toLowerCase();

    const u = await prisma.user.findUnique({
      where: { email }
    });

    if (
      !u ||
      !(await argon2.verify(
        u.passwordHash,
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
        userId: u.id,
        expiresAt: new Date(
          Date.now() + 8 * 60 * 60 * 1000
        )
      }
    });

    res.cookie('sentinel_session', sid, {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.COOKIE_SECURE,
      maxAge: 8 * 60 * 60 * 1000
    });

    await audit('LOGIN', {
      userId: u.id,
      success: true,
      ip: req.ip
    });

    res.json({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role
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
    const sid = req.cookies.sentinel_session;

    await prisma.session
      .delete({
        where: { id: sid }
      })
      .catch(() => {});

    res.clearCookie('sentinel_session');

    await audit('LOGOUT', {
      userId: req.user!.id,
      success: true,
      ip: req.ip
    });

    res.status(204).end();
  }
);

/* =========================
   CURRENT USER
========================= */

app.get(
  '/api/auth/me',
  requireAuth,
  (req: AuthRequest, res) => {
    res.json(req.user);
  }
);

/* =========================
   FILE UPLOAD
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

    const ownedDocs =
      await prisma.document.findMany({
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

    const sharedDocs =
      await prisma.document.findMany({
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

    res.json([
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

    try {
      const p = z
        .object({
          title: z.string().min(1).max(150),
          category: z.string().min(1).max(80)
        })
        .parse(req.body);

      validateFile(
        req.file.originalname,
        req.file.mimetype,
        req.file.size
      );

      const storageName = newStorageName(
        req.file.originalname
      );

      await saveTemp(
        req.file,
        storageName
      );

      try {
        const d =
          await prisma.document.create({
            data: {
              ownerId: req.user!.id,
              title: p.title,
              category: p.category,
              originalName:
                req.file.originalname,
              storageName,
              mimeType: req.file.mimetype,
              size: req.file.size
            }
          });

        await audit('UPLOAD', {
          userId: req.user!.id,
          documentId: d.id,
          success: true,
          ip: req.ip
        });

        res.status(201).json(d);
      } catch (e) {
        await removeFile(storageName);
        throw e;
      }
    } catch (e) {
      await removeFile(
        req.file.filename
      ).catch(() => {});

      await audit('UPLOAD', {
        userId: req.user!.id,
        success: false,
        ip: req.ip,
        details: 'upload rejected'
      });

      return res.status(400).json({
        error:
          e instanceof Error
            ? e.message
            : 'Upload failed'
      });
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
    const documentId = String(
      req.params.id
    );

    const d =
      await getAuthorizedDocument(
        req.user!.id,
        documentId,
        'VIEW'
      );

    if (!d) {
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
      documentId: d.id,
      success: true,
      ip: req.ip
    });

    res.json({
      id: d.id,
      title: d.title,
      category: d.category,
      originalName: d.originalName,
      mimeType: d.mimeType,
      size: d.size,
      createdAt: d.createdAt,
      ownerId: d.ownerId
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
    const documentId = String(
      req.params.id
    );

    const d =
      await getAuthorizedDocument(
        req.user!.id,
        documentId,
        'DOWNLOAD'
      );

    if (!d) {
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

    if (
      !fs.existsSync(
        storagePath(d.storageName)
      )
    ) {
      return res.status(404).json({
        error: 'File unavailable'
      });
    }

    await audit('DOWNLOAD', {
      userId: req.user!.id,
      documentId: d.id,
      success: true,
      ip: req.ip
    });

    res.download(
      storagePath(d.storageName),
      d.originalName
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
    const documentId = String(
      req.params.id
    );

    if (
      !(await canShare(
        req.user!.id,
        documentId
      ))
    ) {
      return res.status(403).json({
        error:
          'Only the owner can share this document'
      });
    }

    const p = z
      .object({
        recipientEmail: z.string().email(),
        permission: z.enum([
          'VIEW',
          'DOWNLOAD'
        ])
      })
      .safeParse(req.body);

    if (!p.success) {
      return res.status(400).json({
        error: 'Invalid input'
      });
    }

    const recipient =
      await prisma.user.findUnique({
        where: {
          email:
            p.data.recipientEmail.toLowerCase()
        }
      });

    if (
      !recipient ||
      recipient.id === req.user!.id
    ) {
      return res.status(400).json({
        error: 'Invalid recipient'
      });
    }

    const d =
      await prisma.document.findUnique({
        where: {
          id: documentId
        }
      });

    if (!d) {
      return res.status(404).json({
        error: 'Document not found'
      });
    }

    const share =
      await prisma.documentShare.upsert({
        where: {
          documentId_recipientId: {
            documentId: d.id,
            recipientId: recipient.id
          }
        },

        update: {
          permission: p.data.permission,
          revokedAt: null
        },

        create: {
          documentId: d.id,
          recipientId: recipient.id,
          permission: p.data.permission
        }
      });

    await audit('SHARE', {
      userId: req.user!.id,
      documentId: d.id,
      success: true,
      ip: req.ip,
      details:
        `shared with ${recipient.id}`
    });

    res.status(201).json({
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
    const documentId = String(
      req.params.id
    );

    const shareId = String(
      req.params.shareId
    );

    if (
      !(await canShare(
        req.user!.id,
        documentId
      ))
    ) {
      return res.status(403).json({
        error:
          'Only the owner can revoke access'
      });
    }

    const share =
      await prisma.documentShare.findFirst({
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

    res.status(204).end();
  }
);

/* =========================
   DELETE DOCUMENT
========================= */

app.delete(
  '/api/documents/:id',
  requireAuth,
  async (req: AuthRequest, res) => {
    const documentId = String(
      req.params.id
    );

    const d =
      await getAuthorizedDocument(
        req.user!.id,
        documentId,
        'DELETE'
      );

    if (!d) {
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

    await prisma.$transaction(
      async tx => {
        await tx.auditLog.create({
          data: {
            userId: req.user!.id,
            action: 'DELETE',
            success: true,
            ip: req.ip,
            details:
              `document ${d.id} deleted`
          }
        });

        await tx.document.delete({
          where: {
            id: documentId
          }
        });
      }
    );

    await removeFile(
      d.storageName
    );

    res.status(204).end();
  }
);

/* =========================
   ERROR HANDLER
========================= */

app.use(
  (
    err: any,
    _req: any,
    res: any,
    _next: any
  ) => {
    console.error(
      'request error',
      err?.message
    );

    if (
      err instanceof multer.MulterError
    ) {
      return res.status(400).json({
        error: 'Upload rejected'
      });
    }

    res.status(500).json({
      error: 'Internal server error'
    });
  }
);

export default app;