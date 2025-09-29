import { FastifyPluginAsync } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { MatchService, MatchData } from '../services/matchService';

const prisma = new PrismaClient();

const matchesRoute: FastifyPluginAsync = async (app) => {
  // Recupera la cronologia delle partite di un utente
  app.get('/matches/history/:username', async (req, reply) => {
    const { username } = req.params as { username: string };
    
    try {
      const user = await prisma.user.findUnique({
        where: { username },
        select: { id: true }
      });

      if (!user) {
        return reply.code(404).send({ error: 'User not found' });
      }

      const matchHistory = await MatchService.getUserMatchHistory(user.id);
      return reply.send({ matches: matchHistory });
    } catch (err) {
      app.log.error(err);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Crea una nuova partita e aggiorna le statistiche utente
  app.post('/matches', async (req, reply) => {
    const body = req.body as {
      player1Id: number;
      player2Id?: number;
      player2BotName?: string;
      player1Score: number;
      player2Score: number;
      winnerId?: number;
      matchType: string;
    };

    if (!body || !body.player1Id || body.player1Score === undefined || body.player2Score === undefined || !body.matchType) {
      return reply.code(400).send({ error: 'Missing required fields' });
    }

    try {
      // Valida il matchType
      const validTypes = ['bot', 'player', 'tournament'];
      const matchType = body.matchType.toLowerCase();
      
      if (!validTypes.includes(matchType)) {
        return reply.code(400).send({ error: 'Invalid match type' });
      }

      const matchData: MatchData = {
        player1Id: body.player1Id,
        player2Id: body.player2Id,
        player2BotName: body.player2BotName,
        player1Score: body.player1Score,
        player2Score: body.player2Score,
        winnerId: body.winnerId,
        matchType: matchType
      };

      const match = await MatchService.createMatch(matchData);
      return reply.send({ success: true, match });
    } catch (err) {
      if (err instanceof Error && err.message.includes('Tournament matches')) {
        return reply.code(400).send({ error: err.message });
      }
      app.log.error(err);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Recupera tutte le partite di un utente
  app.get('/matches/all/:username', async (req, reply) => {
    const { username } = req.params as { username: string };
    
    try {
      const user = await prisma.user.findUnique({
        where: { username }
      });

      if (!user) {
        return reply.code(404).send({ error: 'User not found' });
      }

      const matches = await prisma.match.findMany({
        where: {
          OR: [
            { player1Id: user.id },
            { player2Id: user.id }
          ]
        },
        include: {
          player1: { select: { username: true } },
          player2: { select: { username: true } },
          winner: { select: { username: true } }
        },
        orderBy: {
          matchDate: 'desc'
        }
      });

      return reply.send({ matches });
    } catch (err) {
      app.log.error(err);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });
};

export default matchesRoute;