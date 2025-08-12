import Fastify from 'fastify';
import cors from '@fastify/cors';
import prismaPlugin from './plugins/prisma';
import usersRoute from './routes/users';
import authRoutes from './routes/auth';

const app = Fastify({ logger: true });

async function buildServer() {
  await app.register(cors, {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  });

  await app.register(prismaPlugin);
  await app.register(usersRoute);
  await app.register(authRoutes);

  app.get('/health/db', async () => {
    await app.prisma.$queryRaw`SELECT 1`;
    return { ok: true };
  });

  await app.listen({ port: 3000, host: '0.0.0.0' }); // 👈 importante in Docker
}

buildServer();