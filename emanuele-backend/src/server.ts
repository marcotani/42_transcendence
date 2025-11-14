import dotenv from 'dotenv';
import path from 'node:path';
// Load .env from repository root (based on current working directory)
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import fs from 'node:fs';

// Plugins personalizzati
import prismaPlugin from './plugins/prisma';

// Rotte
import usersRoute from './routes/users';
import authRoutes from './routes/auth';
import friendsRoutes from './routes/friends';
import statsRoute from './routes/stats';
import heartbeatRoutes from './routes/heartbeat';
import matchesRoute from './routes/matches';

// Read TLS cert/key and initialize Fastify with HTTPS enabled.
// If the cert/key cannot be read the process will exit because HTTPS is mandatory.
let fastifyOptions: { logger: boolean; https?: { key: Buffer; cert: Buffer } } = { logger: false };
try {
  const keyPath = path.join(__dirname, 'services', 'TLS', 'server.key');
  const certPath = path.join(__dirname, 'services', 'TLS', 'server.crt');
  const key = fs.readFileSync(keyPath);
  const cert = fs.readFileSync(certPath);
  fastifyOptions.https = { key, cert };
} catch (err) {
  console.error('Failed to read TLS certificate or key from src/services/TLS. HTTPS is required.');
  console.error(err);
  process.exit(1);
}

const app = Fastify(fastifyOptions);

async function buildServer() {
  // Abilita CORS per il frontend
  await app.register(cors, {
    origin: (origin: string | undefined, cb: (err: Error | null, allow: boolean) => void) => {
      // Permettiamo il frontend servito da:
      // - localhost/127.0.0.1 alle porte 8080 e 5173
      // - qualsiasi hostname/IP locale alle porte 8080 e 5173 (per accesso via LAN)
      if (!origin) return cb(null, true);
      const allowList = [
        /^https?:\/\/localhost:(8080|5173)$/i,
        /^https?:\/\/127\.0\.0\.1:(8080|5173)$/i,
        // IP v4 privati (192.168.x.x, 10.x.x.x, 172.16-31.x.x) o hostname locale/generico, su 8080 o 5173
        /^https?:\/\/(?:\d{1,3}(?:\.\d{1,3}){3}|[a-z0-9.-]+):(8080|5173)$/i,
      ];
      const allowed = allowList.some((re) => re.test(origin));
      if (allowed) return cb(null, true);
      cb(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  await app.register(multipart, {
    limits: {
      fileSize: 5 * 1024 * 1024,
      files: 1,
    },
  });

  await app.register(fastifyStatic, {
    root: path.join(__dirname, '..', 'uploads'),
    prefix: '/uploads/',
    decorateReply: false,
  });

  await app.register(fastifyStatic, {
    root: path.join(__dirname, '..', 'static'),
    prefix: '/static/',
    decorateReply: false,
  });

  // Registra il plugin Prisma (aggiunge app.prisma)
  await app.register(prismaPlugin);

  // Registra le rotte
  await app.register(usersRoute);
  await app.register(authRoutes);
  await app.register(friendsRoutes);
  await app.register(statsRoute);
  await app.register(heartbeatRoutes);
  await app.register(matchesRoute);

  // Rotta di accesso a backend https per evitare che restituisca errore 404
  app.get('/', async () => {
    return { ok: true, service: 'transcendence-backend', message: 'Backend is running (HTTPS)' };
  });

  // Rotta di health check DB
  app.get('/health/db', async () => {
    await app.prisma.$queryRaw`SELECT 1`;
    return { ok: true };
  });

  // Avvia il server
  try {
  await app.listen({ port: 3000, host: '0.0.0.0' }); // 0.0.0.0 per Docker
  console.log(`Server HTTPS avviato su https://localhost:3000`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }

  // Gestione del graceful shutdown
  const gracefulShutdown = async (signal: string) => {
    console.log(`\nRicevuto segnale ${signal}. Arresto del server in corso...`);
    
    try {
      await app.close();
      console.log('Server successfully stopped.');
      process.exit(0);
    } catch (err) {
      console.error('Error while stopping the server:', err);
      process.exit(1);
    }
  };

  // Gestisce i segnali di terminazione
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

buildServer();