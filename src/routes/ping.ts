import { FastifyInstance } from 'fastify';

export default async function pingRoutes(app: FastifyInstance) {
  app.get('/ping', async (request, reply) => {
    return { pong: true };
  });
}