import { FastifyInstance } from 'fastify';
import { Prisma } from '@prisma/client';
import { hashPassword, verifyPassword } from '../leonardo-security/plugins/password-hash';

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

    // Controllo formato email (RFC 5322 compliant)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return reply.code(400).send({
        success: false,
        error: 'Formato email non valido'
      });
    }

    try {
      const { hash, salt } = hashPassword(password);
      const newUser = await app.prisma.user.create({
        data: {
          username,
          email,
          password_hash: hash,
          password_salt: salt,
          online: false,
          profile: { create: { bio: '', gdpr: false, alias: username } },
          stats: { create: {
            botWins: 0,
            botLosses: 0,
            playerWins: 0,
            playerLosses: 0,
            tournamentWins: 0
          } },
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
          profile: newUser.profile ?? null,
          stats: newUser.stats ?? null,
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
      select: { id: true, username: true, email: true, password_hash: true, password_salt: true, createdAt: true },
    });

    if (!user || !verifyPassword(password, user.password_salt, user.password_hash)) {
      return reply.code(401).send({
        success: false,
        error: 'Credenziali non valide'
      });
    }

    // Set online a true dopo login
    await app.prisma.user.update({
      where: { id: user.id },
      data: { online: true }
    });

    const { password_hash: _omit, ...safeUser } = user as any;
    return reply.send({ success: true, user: { ...safeUser, online: true } });
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
      select: { id: true, password_hash: true, password_salt: true },
    });

    if (!user || !verifyPassword(password, user.password_salt, user.password_hash)) {
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