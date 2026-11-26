import express from 'express';
import http from 'http';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';

const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

// Ephemeral in-memory HMAC signing secret fallback if SESSION_SECRET is unset
const SIGNING_KEY = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

// Allowed admin identifiers (Gmail or BD phone numbers)
const ALLOWED_ADMIN_EMAILS = ['bd.lifecircle@gmail.com'];
const ALLOWED_ADMIN_PHONES = ['01754149749', '8801754149749', '01711480987', '8801711480987'];

function normalizeIdentifier(raw: string): { type: 'email' | 'phone' | 'invalid'; value: string } {
  const trimmed = raw.trim().toLowerCase();
  if (trimmed.includes('@')) {
    return ALLOWED_ADMIN_EMAILS.includes(trimmed)
      ? { type: 'email', value: trimmed }
      : { type: 'invalid', value: '' };
  }
  const digits = trimmed.replace(/[^\d]/g, '');
  if (ALLOWED_ADMIN_PHONES.includes(digits)) {
    return { type: 'phone', value: digits };
  }
  return { type: 'invalid', value: '' };
}

// First-run claimed secret hash stored strictly in memory as salted scrypt hash
let claimedSecretHash: { salt: string; hash: string } | null = null;

function hashSecret(secret: string, salt?: string): { salt: string; hash: string } {
  const s = salt || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(secret, s, 64).toString('hex');
  return { salt: s, hash: derived };
}

function timingSafeMatchString(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function verifySecretCode(input: string): boolean {
  const envSecret = process.env.ADMIN_SECRET_CODE?.trim();
  if (envSecret && envSecret.length > 0) {
    return timingSafeMatchString(input, envSecret);
  }
  if (!claimedSecretHash) return false;
  const candidate = hashSecret(input, claimedSecretHash.salt);
  return timingSafeMatchString(candidate.hash, claimedSecretHash.hash);
}

function createAdminToken(identifier: string): { token: string; expiresAt: number } {
  const expiresAt = Date.now() + 8 * 60 * 60 * 1000;
  const payload = Buffer.from(
    JSON.stringify({ role: 'admin', identifier, expiresAt }),
    'utf8'
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', SIGNING_KEY).update(payload).digest('base64url');
  return { token: `${payload}.${sig}`, expiresAt };
}

function verifyAdminToken(authHeader: string | undefined): { identifier: string } | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', SIGNING_KEY)
    .update(payload)
    .digest('base64url');
  if (!timingSafeMatchString(sig, expectedSig)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      role?: string;
      identifier?: string;
      expiresAt?: number;
    };
    if (
      parsed.role !== 'admin' ||
      !parsed.identifier ||
      !parsed.expiresAt ||
      parsed.expiresAt < Date.now()
    ) {
      return null;
    }
    return { identifier: parsed.identifier };
  } catch {
    return null;
  }
}

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  app.use(express.json({ limit: '1mb' }));

  // Check whether admin secret is configured via env or claimed in preview
  app.get('/api/admin/status', (_req, res) => {
    const envConfigured = !!(
      process.env.ADMIN_SECRET_CODE && process.env.ADMIN_SECRET_CODE.trim().length > 0
    );
    res.json({
      configured: envConfigured || !!claimedSecretHash,
      usingEnv: envConfigured,
    });
  });

  // One-time bootstrap claim when ADMIN_SECRET_CODE env is not yet configured
  app.post('/api/admin/bootstrap-secret', (req, res) => {
    const envConfigured = !!(
      process.env.ADMIN_SECRET_CODE && process.env.ADMIN_SECRET_CODE.trim().length > 0
    );
    if (envConfigured || claimedSecretHash) {
      res.status(409).json({
        error: 'Admin secret code is already configured. Please use normal sign-in.',
      });
      return;
    }

    const { identifier, secretCode } = (req.body || {}) as {
      identifier?: unknown;
      secretCode?: unknown;
    };

    if (typeof identifier !== 'string' || typeof secretCode !== 'string') {
      res.status(400).json({ error: 'Invalid identifier or secret code format.' });
      return;
    }

    const norm = normalizeIdentifier(identifier);
    if (norm.type === 'invalid') {
      res.status(403).json({ error: 'এই Gmail বা মোবাইল নম্বরটি অ্যাডমিন হিসেবে অনুমোদিত নয়।' });
      return;
    }

    const cleanSecret = secretCode.trim();
    if (cleanSecret.length < 6 || cleanSecret.length > 64) {
      res.status(400).json({ error: 'সিক্রেট কোড কমপক্ষে ৬ অক্ষরের হতে হবে।' });
      return;
    }

    claimedSecretHash = hashSecret(cleanSecret);
    const { token, expiresAt } = createAdminToken(norm.value);
    res.json({ token, identifier: norm.value, expiresAt });
  });

  // Verify Admin Gmail or Mobile Number + Secret Code
  app.post('/api/admin/verify-secret', (req, res) => {
    const { identifier, secretCode } = (req.body || {}) as {
      identifier?: unknown;
      secretCode?: unknown;
    };

    if (typeof identifier !== 'string' || typeof secretCode !== 'string') {
      res.status(400).json({ error: 'Gmail/নম্বর এবং সিক্রেট কোড দিন।' });
      return;
    }

    const norm = normalizeIdentifier(identifier);
    if (norm.type === 'invalid') {
      res.status(403).json({ error: 'অ্যাডমিন Gmail বা মোবাইল নম্বর সঠিক নয়।' });
      return;
    }

    if (!verifySecretCode(secretCode.trim())) {
      res.status(401).json({ error: 'ভুল সিক্রেট কোড। অনুগ্রহ করে সঠিক কোড দিন।' });
      return;
    }

    const { token, expiresAt } = createAdminToken(norm.value);
    res.json({ token, identifier: norm.value, expiresAt });
  });

  // Admin-only Ask AI endpoint (completely inaccessible to regular users)
  app.post('/api/admin/ask-ai', async (req, res) => {
    const admin = verifyAdminToken(req.headers.authorization);
    if (!admin) {
      res.status(401).json({ error: 'শুধুমাত্র অনুমোদিত অ্যাডমিন এই টুল ব্যবহার করতে পারবেন।' });
      return;
    }

    const { prompt } = (req.body || {}) as { prompt?: unknown };
    if (typeof prompt !== 'string' || prompt.trim().length < 2 || prompt.length > 2000) {
      res.status(400).json({ error: 'অনুগ্রহ করে ২ থেকে ২০০০ অক্ষরের মধ্যে প্রশ্ন লিখুন।' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      res.status(503).json({
        error: 'সার্ভারে GEMINI_API_KEY কনফিগার করা নেই। Settings > Secrets প্যানেল পরীক্ষা করুন।',
      });
      return;
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt.trim(),
        config: {
          systemInstruction:
            'You are a private administrative assistant for the lifecircle.bd medical equipment and sleep diagnostics center admin. Help draft Bengali product descriptions, FAQs, diabetes/health guides, or operational replies concisely and accurately.',
        },
      });

      res.json({ reply: response.text || '' });
    } catch (err) {
      console.error('Admin Ask AI error:', err);
      res.status(502).json({
        error: err instanceof Error ? err.message : 'AI কল সম্পন্ন করা যায়নি।',
      });
    }
  });

  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : { server: httpServer },
        ws: { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const localDist = path.resolve(import.meta.dirname, 'dist');
    const distDir = fs.existsSync(localDist) ? localDist : path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexHtml = path.join(distDir, 'index.html');
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send('Build output not found.');
      }
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`lifecircle.bd server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
