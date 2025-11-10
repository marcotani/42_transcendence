import { FastifyInstance } from 'fastify';

export default async function heartbeatRoutes(app: FastifyInstance) {
  // POST /api/heartbeat
  app.post('/api/heartbeat', async (request, reply) => {
    const { userId } = request.body as {
      userId: number;
    };

    // Controllo di base
    if (!userId) {
      return reply.code(400).send({
        success: false,
        errorCode: 'USERID_REQUIRED',
        error: 'userId is required'
      });
    }

    try {
      // Aggiorna il timestamp del heartbeat e imposta l'utente come online
      const updatedUser = await app.prisma.user.update({
        where: { id: userId },
        data: { 
          lastHeartbeat: new Date(),
          online: true
        }
      });

      return reply.send({
        success: true,
        message: 'Heartbeat updated',
        timestamp: new Date()
      });

    } catch (error) {
  console.error('Error updating heartbeat:', error);
      
      if (error instanceof Error && error.message.includes('Record to update not found')) {
        return reply.code(404).send({
          success: false,
          errorCode: 'USER_NOT_FOUND',
          error: 'User not found'
        });
      }

      return reply.code(500).send({
        success: false,
        errorCode: 'INTERNAL_SERVER_ERROR',
        error: 'Internal server error'
      });
    }
  });

  // GET /api/heartbeat/status/:userId - Get user online status
  app.get('/api/heartbeat/status/:userId', async (request, reply) => {
    const { userId } = request.params as { userId: string };
    const userIdNumber = parseInt(userId, 10);

    if (isNaN(userIdNumber)) {
      return reply.code(400).send({
        success: false,
        errorCode: 'INVALID_USERID',
        error: 'Invalid userId'
      });
    }

    try {
      const user = await app.prisma.user.findUnique({
        where: { id: userIdNumber },
        select: {
          id: true,
          username: true,
          online: true,
          lastHeartbeat: true
        }
      });

      if (!user) {
        return reply.code(404).send({
          success: false,
          errorCode: 'USER_NOT_FOUND',
          error: 'User not found'
        });
      }

      // Consider a user offline if their last heartbeat was more than 2 minutes ago
      const now = new Date();
      const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);
      const isOnline = user.online && user.lastHeartbeat && user.lastHeartbeat > twoMinutesAgo;

      return reply.send({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          online: isOnline,
          lastHeartbeat: user.lastHeartbeat
        }
      });

    } catch (error) {
      console.error('Error checking user status:', error);
      return reply.code(500).send({
        success: false,
        errorCode: 'INTERNAL_SERVER_ERROR',
        error: 'Internal server error'
      });
    }
  });
}