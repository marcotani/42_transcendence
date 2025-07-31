import { FastifyInstance } from 'fastify';

export default async function dbPlugin(app: FastifyInstance) {
  app.decorate('db', {
    getUser: () => ({ id: 1, name: 'Mario Rossi' }),
    // Aggiungeremo funzioni reali quando collegheremo SQLite o PostgreSQL
  });
}