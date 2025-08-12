import { FastifyInstance } from 'fastify';
import { Prisma } from '@prisma/client';

export default async function authRoutes(app: FastifyInstance) {
  // POST /api/register
  app.post('/api/register', async (request, reply) => {
    const { username, password, email } = request.body as {
      username: string; password: string; email?: string; //estrae le variabili dal body ricevuto
    };

    if (!username || !password) {
      return reply.code(400).send({ success: false, error: 'Username e password sono obbligatori' });
    } //se mancano username e password restituisce errore 400

    try {
      const newUser = await app.prisma.user.create({
        data: {
          username,
          email: email ?? null,
          password, //da eseguire ashing alla password
          profile: { create: { bio: '', avatarUrl: '' } },
          stats:   { create: { wins: 0, losses: 0, elo: 1000 } },
        },
        include: { profile: true, stats: true },
      });

      return reply.code(201).send({
        success: true,
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          createdAt: newUser.createdAt,
          profile: newUser.profile,
          stats: newUser.stats,
        },
      });
    } catch (err: any) {
      // Conflitto su unique (username o email)
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        return reply.code(409).send({ success: false, error: 'Username o email già in uso' });
      }
      app.log.error(err);
      return reply.code(500).send({ success: false, error: 'Errore interno' });
    }
  }); //errore nel caso lo username o la password esistano già

  // POST /api/login (senza hashing)
  app.post('/api/login', async (request, reply) => {
    const { username, password } = request.body as { username: string; password: string };

    if (!username || !password) {
      return reply.code(400).send({ success: false, error: 'Username e password sono obbligatori' });
    }

    const user = await app.prisma.user.findUnique({
      where: { username },
      select: { id: true, username: true, email: true, password: true, createdAt: true },
    }); //cerca un utente nel database

    if (!user || user.password !== password) {
      return reply.code(401).send({ success: false, error: 'Credenziali non valide' });
    }

    const { password: _omit, ...safeUser } = user as any;
    return reply.send({ success: true, user: safeUser });
  });

  // GET /api/users (utile per debug)
  app.get('/api/users', async () => {
    return app.prisma.user.findMany({
      select: { id: true, username: true, email: true, createdAt: true },
      orderBy: { id: 'asc' },
    });
  }); //restituisce tutti gli utenti in ordine alfabetico
}