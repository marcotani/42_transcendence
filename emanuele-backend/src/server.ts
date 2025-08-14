import Fastify from 'fastify';
import cors from '@fastify/cors';

// Plugins personalizzati
import prismaPlugin from './plugins/prisma';

// Rotte
import usersRoute from './routes/users';
import authRoutes from './routes/auth';

const app = Fastify({ logger: false }); // Disattiva il logger automatico di Fastify, evita spam di messaggi

async function buildServer() {
  // Abilita CORS per il frontend
  await app.register(cors, {
    origin: [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ],
    credentials: true,
  });

  // Registra il plugin Prisma (aggiunge app.prisma)
  await app.register(prismaPlugin);

  // Registra le rotte
  await app.register(usersRoute);
  await app.register(authRoutes);

  // Rotta di health check DB
  app.get('/health/db', async () => {
    await app.prisma.$queryRaw`SELECT 1`;
    return { ok: true };
  });

  // Avvia il server
  try {
    await app.listen({ port: 3000, host: '0.0.0.0' }); // 0.0.0.0 per Docker
    console.log(`Server avviato su http://localhost:3000`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

buildServer();