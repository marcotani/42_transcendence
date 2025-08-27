import { FastifyInstance } from 'fastify';
import { Prisma } from '@prisma/client';

export default async function authRoutes(app: FastifyInstance) {
  // POST /api/register
  app.post('/api/register', async (request, reply) => {
    const { username, password, email } = request.body as {
      username: string;
      password: string;
      email: string;
    };

    // Controlli di base
    if (!username || !password || !email) {
      return reply.code(400).send({
        success: false,
        error: 'Username, Email e password sono obbligatori'
      });
    }

    // Controllo formato email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return reply.code(400).send({
        success: false,
        error: 'Formato email non valido'
      });
    }

    try {
      const newUser = await app.prisma.user.create({
        data: {
          username,
          email,
          password, // TODO: eseguire hashing della password
          profile: { create: { bio: ''} },
          stats: { create: { wins: 0, losses: 0, elo: 1000 } },
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
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        return reply.code(409).send({
          success: false,
          error: 'Username o email già in uso'
        });
      }
      app.log.error(err);
      return reply.code(500).send({
        success: false,
        error: 'Errore interno'
      });
    }
  });

  // POST /api/login 
  app.post('/api/login', async (request, reply) => {
    const { username, password } = request.body as {
      username: string;
      password: string;
    };

    if (!username || !password) {
      return reply.code(400).send({
        success: false,
        error: 'Username e password sono obbligatori'
      });
    }

    const user = await app.prisma.user.findUnique({
      where: { username },
      select: { id: true, username: true, email: true, password: true, createdAt: true },
    });

    if (!user || user.password !== password) {
      return reply.code(401).send({
        success: false,
        error: 'Credenziali non valide'
      });
    }

    const { password: _omit, ...safeUser } = user as any;
    return reply.send({ success: true, user: safeUser });
  });

  // GET /api/users 
  app.get('/api/users', async () => {
    return app.prisma.user.findMany({
      select: { id: true, username: true, email: true, createdAt: true },
      orderBy: { id: 'asc' },
    });
  });

  // DELETE /api/users
  app.delete('/api/users', async (req, reply) => {
    try {
      await app.prisma.user.deleteMany({});
      return reply.send({
        success: true,
        message: 'Tutti gli utenti sono stati eliminati'
      });
    } catch (err) {
      app.log.error(err);
      return reply.code(500).send({
        success: false,
        error: 'Errore durante l\'eliminazione degli utenti'
      });
    }
  });

  // DELETE /api/users/:username
  app.delete('/api/users/:username', async (req, reply) => {
    const { username } = req.params as { username: string };
    const { password } = req.body as { password: string };

    if (!password) {
      return reply.code(400).send({
        success: false,
        error: 'Password obbligatoria'
      });
    }

    const user = await app.prisma.user.findUnique({
      where: { username },
      select: { id: true, password: true },
    });

    if (!user || user.password !== password) {
      return reply.code(401).send({
        success: false,
        error: 'Credenziali non valide'
      });
    }

    try {
      await app.prisma.user.delete({ where: { username } });
      return reply.send({
        success: true,
        message: `Utente ${username} eliminato`
      });
    } catch (err) {
      app.log.error(err);
      return reply.code(500).send({
        success: false,
        error: 'Errore durante l\'eliminazione dell\'utente'
      });
    }
  });
}