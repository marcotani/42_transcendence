import Fastify from 'fastify';
import cors from '@fastify/cors';
import prismaPlugin from './plugins/prisma';
import usersRoute from './routes/users'; // <- import giusto, in alto

const app = Fastify({ logger: true });

async function buildServer() {
  await app.register(cors);         // CORS
  await app.register(prismaPlugin); // Prisma
  await app.register(usersRoute);   // Rotte /users

  // Healthcheck DB
  app.get('/health/db', async () => {
    await app.prisma.$queryRaw`SELECT 1`;
    return { ok: true };
  });

  app.listen({ port: 3000 }, (err) => {
    if (err) {
      app.log.error(err);
      process.exit(1);
    }
  });
}

buildServer();