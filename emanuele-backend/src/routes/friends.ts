import { FastifyInstance } from 'fastify';
import { Prisma } from '@prisma/client';
import { authenticateJWT } from './auth';
import { sanitizeUsername } from '../utils/sanitizer';

export default async function friendsRoutes(app: FastifyInstance) {

  app.post('/friends/requests', { preHandler: authenticateJWT }, async (req, reply) => {
    const { fromUsername, toUsername } = req.body as {
      fromUsername: string;
      toUsername: string;
    };

    if (!fromUsername || !toUsername) {
      return reply.code(400).send({ errorCode: 'MISSING_FIELDS', error: 'Missing fields' });
    }

    // Sanitizzazione username
    const cleanFromUsername = sanitizeUsername(fromUsername);
    const cleanToUsername = sanitizeUsername(toUsername);
    
    if (!cleanFromUsername || !cleanToUsername) {
      return reply.code(400).send({ errorCode: 'INVALID_USERNAMES', error: 'Invalid usernames' });
    }

    if (cleanFromUsername === cleanToUsername) {
      return reply.code(400).send({ errorCode: 'CANNOT_ADD_SELF', error: 'Cannot add yourself' });
    }

    // Verify the authenticated user matches the fromUsername
    const authenticatedUser = (req as any).user;
    if (authenticatedUser.username !== fromUsername) {
      return reply.code(403).send({ errorCode: 'UNAUTHORIZED', error: 'Unauthorized' });
    }

    const fromUser = await app.prisma.user.findUnique({
      where: { username: fromUsername },
      select: { id: true, username: true }
    });
  if (!fromUser) return reply.code(404).send({ errorCode: 'USER_NOT_FOUND', error: 'User not found' });

    const toUser = await app.prisma.user.findUnique({
      where: { username: cleanToUsername },
      select: { id: true, username: true },
    });
  if (!toUser) return reply.code(404).send({ errorCode: 'RECIPIENT_NOT_FOUND', error: 'Recipient user not found' });

    const alreadyFriend = await app.prisma.friend.findFirst({
      where: { userId: fromUser.id, friendId: toUser.id },
    });
    if (alreadyFriend) {
      return reply.code(409).send({ errorCode: 'ALREADY_FRIENDS', error: 'Already friends' });
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
      return reply.code(409).send({ errorCode: 'FRIEND_REQUEST_PENDING', error: 'Friend request already pending' });
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

   app.get('/friends/requests', { preHandler: authenticateJWT }, async (req, reply) => {
    const { for: forUsername } = req.query as { for?: string };
  if (!forUsername) return reply.code(400).send({ errorCode: 'PARAM_FOR_REQUIRED', error: '"for" parameter is required' });

    // Ensure authenticated user matches query username
    const authenticatedUser = (req as any).user;
    const cleanFor = sanitizeUsername(forUsername);
    if (!cleanFor) return reply.code(400).send({ errorCode: 'INVALID_USERNAME', error: 'Invalid username' });
    if (!authenticatedUser || authenticatedUser.username !== cleanFor) {
      return reply.code(403).send({ errorCode: 'UNAUTHORIZED', error: 'Unauthorized' });
    }

    const user = await app.prisma.user.findUnique({
      where: { username: cleanFor },
      select: { id: true },
    });
  if (!user) return reply.code(404).send({ errorCode: 'USER_NOT_FOUND', error: 'User not found' });

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

  app.post('/friends/requests/:id/accept', { preHandler: authenticateJWT }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { username } = req.body as { username: string };

    // Verify the authenticated user matches the username
    const authenticatedUser = (req as any).user;
    if (authenticatedUser.username !== username) {
  return reply.code(403).send({ errorCode: 'UNAUTHORIZED', error: 'Unauthorized' });
    }

    const me = await app.prisma.user.findUnique({
      where: { username },
      select: { id: true, username: true }
    });
  if (!me) return reply.code(404).send({ errorCode: 'USER_NOT_FOUND', error: 'User not found' });

    const request = await app.prisma.friendRequest.findUnique({
      where: { id: Number(id) },
    });
  if (!request) return reply.code(404).send({ errorCode: 'REQUEST_NOT_FOUND', error: 'Request not found' });
  if (request.toUserId !== me.id) return reply.code(403).send({ errorCode: 'NOT_RECIPIENT', error: 'You are not the recipient' });

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
  return reply.code(500).send({ errorCode: 'INTERNAL_SERVER_ERROR', error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' });
    }

    return reply.send({ success: true });
  });

  app.delete('/friends/requests/:id', { preHandler: authenticateJWT }, async (req, reply) => {
    const { id } = req.params as { id: string };
    
    // Get username from JWT token
    const authenticatedUser = (req as any).user;
    const username = authenticatedUser.username;

    const me = await app.prisma.user.findUnique({
      where: { username },
      select: { id: true, username: true }
    });
  if (!me) return reply.code(404).send({ errorCode: 'USER_NOT_FOUND', error: 'User not found' });

    const request = await app.prisma.friendRequest.findUnique({
      where: { id: Number(id) },
    });
  if (!request) return reply.code(404).send({ errorCode: 'REQUEST_NOT_FOUND', error: 'Request not found' });
    
    // Allow both sender (cancel) and recipient (reject) to delete the request
    const isSender = request.fromUserId === me.id;
    const isRecipient = request.toUserId === me.id;
    
    if (!isSender && !isRecipient) {
      return reply.code(403).send({ errorCode: 'NOT_AUTHORIZED_TO_MANAGE_REQUEST', error: 'Not authorized to manage this request' });
    }
    
    if (request.status !== 'PENDING') {
      return reply.code(400).send({ errorCode: 'REQUEST_NOT_PENDING', error: 'Can only manage pending requests' });
    }

    await app.prisma.friendRequest.delete({ where: { id: Number(id) } });

  const message = isSender ? 'Friend request cancelled' : 'Friend request rejected';
    return reply.send({ success: true, message });
  });

  app.get('/friends/:username', async (req, reply) => {
    const { username } = req.params as { username: string };

  const user = await app.prisma.user.findUnique({ where: { username } });
  if (!user) return reply.code(404).send({ errorCode: 'USER_NOT_FOUND', error: 'User not found' });

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

  app.delete('/friends/:usernameToRemove', { preHandler: authenticateJWT }, async (req, reply) => {
    const { usernameToRemove } = req.params as { usernameToRemove: string };
    
    // Get username from JWT token
    const authenticatedUser = (req as any).user;
    const username = authenticatedUser.username;

    const me = await app.prisma.user.findUnique({
      where: { username },
      select: { id: true, username: true }
    });
  if (!me) return reply.code(404).send({ errorCode: 'USER_NOT_FOUND', error: 'User not found' });

  const other = await app.prisma.user.findUnique({ where: { username: usernameToRemove } });
  if (!other) return reply.code(404).send({ errorCode: 'USER_NOT_FOUND', error: 'User not found' });

    await app.prisma.$transaction([
      app.prisma.friend.deleteMany({ where: { userId: me.id, friendId: other.id } }),
      app.prisma.friend.deleteMany({ where: { userId: other.id, friendId: me.id } }),
    ]);

    return reply.send({ success: true });
  });
}