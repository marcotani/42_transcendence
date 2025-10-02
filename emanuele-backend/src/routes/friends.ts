import { FastifyInstance } from 'fastify';
import { Prisma } from '@prisma/client';
import { sanitizeUsername } from '../utils/sanitizer';

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

    // Sanitizzazione username
    const cleanFromUsername = sanitizeUsername(fromUsername);
    const cleanToUsername = sanitizeUsername(toUsername);
    
    if (!cleanFromUsername || !cleanToUsername) {
      return reply.code(400).send({ error: 'Username non validi' });
    }

    if (cleanFromUsername === cleanToUsername) {
      return reply.code(400).send({ error: 'Non puoi aggiungere te stesso' });
    }

    const fromUser = await authByUsernameAndPassword(cleanFromUsername, currentPassword);
    if (!fromUser) return reply.code(401).send({ error: 'Credenziali non valide' });

    const toUser = await app.prisma.user.findUnique({
      where: { username: cleanToUsername },
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

    try {
      // First, clean up any existing ACCEPTED friend requests between these users
      await app.prisma.friendRequest.deleteMany({
        where: {
          OR: [
            { fromUserId: request.fromUserId, toUserId: request.toUserId, status: 'ACCEPTED' },
            { fromUserId: request.toUserId, toUserId: request.fromUserId, status: 'ACCEPTED' }
          ]
        }
      });

      // Check if friendship already exists to avoid duplicates
      const existingFriend1 = await app.prisma.friend.findUnique({
        where: { userId_friendId: { userId: request.fromUserId, friendId: request.toUserId } }
      });
      const existingFriend2 = await app.prisma.friend.findUnique({
        where: { userId_friendId: { userId: request.toUserId, friendId: request.fromUserId } }
      });

      const operations = [];
      
      if (!existingFriend1) {
        operations.push(app.prisma.friend.create({ data: { userId: request.fromUserId, friendId: request.toUserId } }));
      }
      if (!existingFriend2) {
        operations.push(app.prisma.friend.create({ data: { userId: request.toUserId, friendId: request.fromUserId } }));
      }
      
      operations.push(app.prisma.friendRequest.update({ where: { id: request.id }, data: { status: 'ACCEPTED' } }));

      await app.prisma.$transaction(operations);
    } catch (error) {
      console.error('Error accepting friend request:', error);
      console.error('Request details:', { fromUserId: request.fromUserId, toUserId: request.toUserId, requestId: request.id });
      return reply.code(500).send({ error: 'Errore interno del server', details: error instanceof Error ? error.message : 'Unknown error' });
    }

    return reply.send({ success: true });
  });

  app.delete('/friends/requests/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const { username, currentPassword } = req.body as { username: string; currentPassword: string };

    const me = await authByUsernameAndPassword(username, currentPassword);
    if (!me) return reply.code(401).send({ error: 'Credenziali non valide' });

    const request = await app.prisma.friendRequest.findUnique({
      where: { id: Number(id) },
    });
    if (!request) return reply.code(404).send({ error: 'Richiesta non trovata' });
    
    // Allow both sender (cancel) and recipient (reject) to delete the request
    const isSender = request.fromUserId === me.id;
    const isRecipient = request.toUserId === me.id;
    
    if (!isSender && !isRecipient) {
      return reply.code(403).send({ error: 'Non sei autorizzato a gestire questa richiesta' });
    }
    
    if (request.status !== 'PENDING') {
      return reply.code(400).send({ error: 'Puoi gestire solo richieste in attesa' });
    }

    await app.prisma.friendRequest.delete({ where: { id: Number(id) } });

    const message = isSender ? 'Richiesta di amicizia annullata' : 'Richiesta di amicizia rifiutata';
    return reply.send({ success: true, message });
  });

  app.get('/friends/:username', async (req, reply) => {
    const { username } = req.params as { username: string };

    const user = await app.prisma.user.findUnique({ where: { username } });
    if (!user) return reply.code(404).send({ error: 'Utente non trovato' });

    const links = await app.prisma.friend.findMany({
      where: { userId: user.id },
      include: { friend: { select: { username: true, profile: true, lastHeartbeat: true, online: true } } },
    });

    const friends = links.map((l) => ({
      username: l.friend.username,
      alias: l.friend.profile?.alias ?? null,
      avatarUrl: l.friend.profile?.avatarUrl ?? null,
      heartbeat: l.friend.lastHeartbeat ?? null,
      online: l.friend.online ? 'online' : 'offline',
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