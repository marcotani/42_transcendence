import Fastify from 'fastify';
import cors from '@fastify/cors';
//CORS significa Cross-Origin Resource Sharing
//Serve a decidere se approvare o bloccare la chiamata alle API

import dbPlugin from './plugins/db';
import pingRoutes from './routes/ping';

const app = Fastify({ logger: true });

async function buildServer() {
  await app.register(cors);           // Plugin CORS
  await app.register(dbPlugin);       // Plugin DB (mock)
  await app.register(pingRoutes);     // Rotte /ping

  app.listen({ port: 3000 }, (err, address) => {
    if (err) {
      app.log.error(err);
      process.exit(1);
    }
  });
}

buildServer();