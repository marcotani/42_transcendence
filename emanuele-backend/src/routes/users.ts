import { FastifyPluginAsync } from 'fastify';

const usersRoute: FastifyPluginAsync = async (app) => {
  // ➕ Crea utente
  app.post('/users', async (req, reply) => {
    const body = req.body as { email: string; username: string; password?: string };

    if (!body?.email || !body?.username) {
      return reply.code(400).send({ error: 'Missing fields: email and username are required' });
    }

    const user = await app.prisma.user.create({
      data: {
        email: body.email,
        username: body.username,
        password: body.password ?? null, // opzionale
        profile: { create: {} },
        stats: { create: {} }
      }
    });

    return reply.code(201).send(user);
  });

  // 📋 Lista utenti
  app.get('/users', async () => {
    return app.prisma.user.findMany({
      include: { profile: true, stats: true }
    });
  });
};

export default usersRoute;

