import { FastifyInstance } from 'fastify';
import { Prisma } from '@prisma/client';

export default async function friendsRoutes(app: FastifyInstance) {

  async function authByUsernameAndPassword(username: string, password: string) {
    if (!username || !password) return null;
    const user = await app.prisma.user.findUnique({
      where: { username },
      select: { id: true, username: true, password_hash: true, password_salt: true },
    });
    if (!user) return null;
    const { verifyPassword } = await import('../leonardo-security/plugins/password-hash');
    if (!verifyPassword(password, user.password_salt, user.password_hash)) return null;
    return user;
  }

  app.post('/friends/requests', async (req, reply) => {
    const { fromUsername, currentPassword, toUsername } = req.body as {
      fromUsername: string;
      currentPassword: string;
      toUsername: string;
    };

    if (!fromUsername || !currentPassword || !toUsername) {
      return reply.code(400).send({ error: 'Campi mancanti' });
    }
    if (fromUsername === toUsername) {
      return reply.code(400).send({ error: 'Non puoi aggiungere te stesso' });
    }

    const fromUser = await authByUsernameAndPassword(fromUsername, currentPassword);
    if (!fromUser) return reply.code(401).send({ error: 'Credenziali non valide' });

    const toUser = await app.prisma.user.findUnique({
      where: { username: toUsername },
      select: { id: true, username: true },
    });
    if (!toUser) return reply.code(404).send({ error: 'Utente destinatario non trovato' });

    const alreadyFriend = await app.prisma.friend.findFirst({
      where: { userId: fromUser.id, friendId: toUser.id },
    });
    if (alreadyFriend) {
      return reply.code(409).send({ error: 'Siete già amici' });
    }

    const existingReq = await app.prisma.friendRequest.findFirst({
      where: {
        OR: [
          { fromUserId: fromUser.id, toUserId: toUser.id },
          { fromUserId: toUser.id, toUserId: fromUser.id },
        ],
        status: 'PENDING',
      },
    });
    if (existingReq) {
      return reply.code(409).send({ error: 'Esiste già una richiesta pendente' });
    }

    const fr = await app.prisma.friendRequest.create({
      data: {
        fromUserId: fromUser.id,
        toUserId: toUser.id,
        status: 'PENDING',
      },
      include: {
        fromUser: { select: { id: true, username: true } },
        toUser: { select: { id: true, username: true } },
      },
    });

    return reply.code(201).send({ success: true, request: fr });
  });

   app.get('/friends/requests', async (req, reply) => {
    const { for: forUsername } = req.query as { for?: string };
    if (!forUsername) return reply.code(400).send({ error: 'Parametro "for" obbligatorio' });

    const user = await app.prisma.user.findUnique({
      where: { username: forUsername },
      select: { id: true },
    });
    if (!user) return reply.code(404).send({ error: 'Utente non trovato' });

    const incoming = await app.prisma.friendRequest.findMany({
      where: { toUserId: user.id, status: 'PENDING' },
      include: { fromUser: { select: { id: true, username: true } } },
    });

    const outgoing = await app.prisma.friendRequest.findMany({
      where: { fromUserId: user.id, status: 'PENDING' },
      include: { toUser: { select: { id: true, username: true } } },
    });

    return reply.send({ incoming, outgoing });
  });

  app.post('/friends/requests/:id/accept', async (req, reply) => {
    const { id } = req.params as { id: string };
    const { username, currentPassword } = req.body as { username: string; currentPassword: string };

    const me = await authByUsernameAndPassword(username, currentPassword);
    if (!me) return reply.code(401).send({ error: 'Credenziali non valide' });

    const request = await app.prisma.friendRequest.findUnique({
      where: { id: Number(id) },
    });
    if (!request) return reply.code(404).send({ error: 'Richiesta non trovata' });
    if (request.toUserId !== me.id) return reply.code(403).send({ error: 'Non sei il destinatario' });

    await app.prisma.$transaction([
      app.prisma.friend.create({ data: { userId: request.fromUserId, friendId: request.toUserId } }),
      app.prisma.friend.create({ data: { userId: request.toUserId, friendId: request.fromUserId } }),
      app.prisma.friendRequest.update({ where: { id: request.id }, data: { status: 'ACCEPTED' } }),
    ]);

    return reply.send({ success: true });
  });

  app.get('/friends/:username', async (req, reply) => {
    const { username } = req.params as { username: string };

    const user = await app.prisma.user.findUnique({ where: { username } });
    if (!user) return reply.code(404).send({ error: 'Utente non trovato' });

    const links = await app.prisma.friend.findMany({
      where: { userId: user.id },
      include: { friend: { select: { username: true, profile: true } } },
    });

    const friends = links.map((l) => ({
      username: l.friend.username,
      alias: l.friend.profile?.alias ?? null,
      avatarUrl: l.friend.profile?.avatarUrl ?? null,
    }));

    return reply.send({ friends });
  });

  app.delete('/friends/:usernameToRemove', async (req, reply) => {
    const { usernameToRemove } = req.params as { usernameToRemove: string };
    const { username, currentPassword } = req.body as { username: string; currentPassword: string };

    const me = await authByUsernameAndPassword(username, currentPassword);
    if (!me) return reply.code(401).send({ error: 'Credenziali non valide' });

    const other = await app.prisma.user.findUnique({ where: { username: usernameToRemove } });
    if (!other) return reply.code(404).send({ error: 'Utente non trovato' });

    await app.prisma.$transaction([
      app.prisma.friend.deleteMany({ where: { userId: me.id, friendId: other.id } }),
      app.prisma.friend.deleteMany({ where: { userId: other.id, friendId: me.id } }),
    ]);

    return reply.send({ success: true });
  });
}