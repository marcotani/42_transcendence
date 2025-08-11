import Fastify from 'fastify';
import cors from '@fastify/cors';
import prismaPlugin from './plugins/prisma'; // Plugin Prisma
import pingRoutes from './routes/ping';

const app = Fastify({ logger: true });

async function buildServer() {
  await app.register(cors);           // Plugin CORS
  await app.register(prismaPlugin);   // Plugin Prisma
  await app.register(pingRoutes);     // Rotte /ping

  // Rotta per test DB
  app.get('/health/db', async () => {
    await app.prisma.$queryRaw`SELECT 1`;
    return { ok: true };
  });

  app.listen({ port: 3000 }, (err, address) => {
    if (err) {
      app.log.error(err);
      process.exit(1);
    }
  });
}

buildServer();