import { FastifyPluginAsync } from 'fastify';
import { Prisma } from '@prisma/client';

const usersRoute: FastifyPluginAsync = async (app) => {
  // ➕ Crea utente
  app.post('/users', async (req, reply) => {
    const body = req.body as { email: string; username: string; password?: string };

    // 1️ Controllo presenza campi
    if (!body?.email || !body?.username) {
      return reply.code(400).send({ error: 'Missing fields: email and username are required' });
    }

    // 2️ Controllo formato email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return reply.code(400).send({ error: 'Invalid email format' });
    }

    try {
      // 3️ Creazione utente
      const user = await app.prisma.user.create({
        data: {
          email: body.email,
          username: body.username,
          password: body.password ?? null,
          profile: { create: {} },
          stats: { create: {} }
        }
      });

      return reply.code(201).send(user);

    } catch (err: any) {
      // 4️ Gestione duplicati
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        return reply.code(409).send({ error: 'Email or username already in use' });
      }
      app.log.error(err);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // 📋 Lista utenti
  app.get('/users', async () => {
    return app.prisma.user.findMany({
      include: { profile: true, stats: true }
    });
  });

  // 🗑 Elimina tutti gli utenti
  app.delete('/users', async (_, reply) => {
    await app.prisma.user.deleteMany({});
    return reply.send({ message: 'All users deleted successfully' });
  });

  // 🗑 Elimina un utente specifico (username + password)
  app.delete('/users/:username', async (req, reply) => {
    const { username } = req.params as { username: string };
    const { password } = req.body as { password?: string };

    if (!password) {
      return reply.code(400).send({ error: 'Password is required' });
    }

    const user = await app.prisma.user.findUnique({ where: { username } });
    if (!user) {
      return reply.code(404).send({ error: 'User not found' });
    }

    if (user.password !== password) {
      return reply.code(401).send({ error: 'Invalid password' });
    }

    await app.prisma.user.delete({ where: { username } });
    return reply.send({ message: `User '${username}' deleted successfully` });
  });
};

export default usersRoute;
