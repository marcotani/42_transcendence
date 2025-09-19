import { FastifyPluginAsync } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const statsRoute: FastifyPluginAsync = async (app) => {
  // Statistiche di tutti gli utenti
  app.get('/stats', async (req, reply) => {
    try {
      const stats = await prisma.userStat.findMany({
        include: { user: { select: { username: true, email: true } } }
      });
      return reply.send(stats);
    } catch (err) {
      app.log.error(err);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Statistiche di un utente specifico
  app.get('/stats/:username', async (req, reply) => {
    const { username } = req.params as { username: string };
    try {
      const user = await prisma.user.findUnique({
        where: { username },
        include: { stats: true }
      });
      if (!user || !user.stats) {
        return reply.code(404).send({ error: 'User or stats not found' });
      }
      return reply.send(user.stats);
    } catch (err) {
      app.log.error(err);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Aggiorna statistiche utente
  app.post('/stats/update', async (req, reply) => {
    const body = req.body as {
      userId: number;
      result: 'win' | 'loss';
      type: 'bot' | 'player' | 'tournament';
    };

    if (!body || !body.userId || !body.result || !body.type) {
      return reply.code(400).send({ error: 'Missing fields' });
    }

    try {
      // Update statistiche in base al body
      let update: any = {};
      if (body.type === 'bot') {
        update = body.result === 'win' ? { botWins: { increment: 1 } } : { botLosses: { increment: 1 } };
      } else if (body.type === 'player') {
        update = body.result === 'win' ? { playerWins: { increment: 1 } } : { playerLosses: { increment: 1 } };
      } else if (body.type === 'tournament' && body.result === 'win') {
        update = { tournamentWins: { increment: 1 } };
      } else {
        return reply.code(400).send({ error: 'Invalid combination' });
      }

      await prisma.userStat.update({
        where: { userId: body.userId },
        data: update,
      });
      return reply.send({ success: true });
    } catch (err) {
      app.log.error(err);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });
};

export default statsRoute;
