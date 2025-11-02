import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import path from 'node:path';
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
    origin: (origin, cb) => {
      // Accept localhost and 127.0.0.1 for port 8080 and 5173
      if (!origin) return cb(null, true);
      if (
        origin.startsWith('http://localhost:8080') ||
        origin.startsWith('https://localhost:8080') ||
        origin.startsWith('http://127.0.0.1:8080') ||
        origin.startsWith('https://127.0.0.1:8080') ||
        origin.startsWith('http://localhost:5173') ||
        origin.startsWith('https://localhost:5173') ||
        origin.startsWith('http://127.0.0.1:5173') ||
        origin.startsWith('https://127.0.0.1:5173')
      ) {
        return cb(null, true);
      }
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