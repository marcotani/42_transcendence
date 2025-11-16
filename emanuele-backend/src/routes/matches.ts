import { FastifyPluginAsync } from 'fastify';
import { MatchService, MatchData } from '../services/matchService';
import { authenticateJWT } from './auth';

import { setPrisma } from '../services/matchService';

const matchesRoute: FastifyPluginAsync = async (app) => {
  // Inietta il PrismaClient condiviso nel MatchService una sola volta
  setPrisma(app.prisma);

  // Recupera la cronologia delle partite di un utente
  app.get('/matches/history/:username', async (req, reply) => {
    const { username } = req.params as { username: string };
    
    try {
      const user = await app.prisma.user.findUnique({
        where: { username },
        select: { id: true }
      });

      if (!user) {
        return reply.code(404).send({ errorCode: 'USER_NOT_FOUND', error: 'User not found' });
      }

      const matchHistory = await MatchService.getUserMatchHistory(user.id);
      return reply.send({ matches: matchHistory });
    } catch (err) {
      app.log.error(err);
      return reply.code(500).send({ errorCode: 'INTERNAL_SERVER_ERROR', error: 'Internal server error' });
    }
  });

  // Crea una nuova partita e aggiorna le statistiche utente
  app.post('/matches', { preHandler: authenticateJWT, config: { rateLimit: { max: 30, timeWindow: '1 minute' } } }, async (req, reply) => {
    console.log('=== POST /matches endpoint called ===');
    console.log('Request body:', req.body);
    const body = req.body as {
      player1Id: number;
      player2Id?: number;
      player2BotName?: string;
      player1Score: number;
      player2Score: number;
      winnerId?: number;
      matchType: string;
    };

    const authUser = (req as any).user;
    if (!authUser || authUser.userId !== body.player1Id) {
      return reply.code(403).send({ errorCode: 'UNAUTHORIZED', error: 'Access denied' });
    }

    if (!body || !body.player1Id || body.player1Score === undefined || body.player2Score === undefined || !body.matchType) {
      console.log('Missing required fields in request body');
      return reply.code(400).send({ errorCode: 'MISSING_FIELDS', error: 'Missing required fields' });
    }

    try {
      // Valida il matchType
      const validTypes = ['bot', 'player', 'tournament'];
      const matchType = body.matchType.toLowerCase();
      
      if (!validTypes.includes(matchType)) {
        console.log('Invalid match type:', matchType);
        return reply.code(400).send({ errorCode: 'INVALID_MATCH_TYPE', error: 'Invalid match type' });
      }

      console.log('Creating match with type:', matchType);
      const matchData: MatchData = {
        player1Id: body.player1Id,
        player2Id: body.player2Id,
        player2BotName: body.player2BotName,
        player1Score: body.player1Score,
        player2Score: body.player2Score,
        winnerId: body.winnerId,
        matchType: matchType
      };

      console.log('Match data being passed to service:', matchData);
      const match = await MatchService.createMatch(matchData);
      console.log('Match created successfully, returning response');
      return reply.send({ success: true, match });
    } catch (err) {
      if (err instanceof Error && err.message.includes('Tournament matches')) {
        console.log('Tournament match error:', err.message);
        return reply.code(400).send({ errorCode: 'TOURNAMENT_MATCH_ERROR', error: err.message });
      }
      console.error('Error creating match:', err);
      app.log.error(err);
      return reply.code(500).send({ errorCode: 'INTERNAL_SERVER_ERROR', error: 'Internal server error' });
    }
  });

  // Recupera tutte le partite di un utente
  app.get('/matches/all/:username', async (req, reply) => {
    const { username } = req.params as { username: string };
    
    try {
      const user = await app.prisma.user.findUnique({
        where: { username }
      });

      if (!user) {
        return reply.code(404).send({ errorCode: 'USER_NOT_FOUND', error: 'User not found' });
      }

      const matches = await app.prisma.match.findMany({
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
      return reply.code(500).send({ errorCode: 'INTERNAL_SERVER_ERROR', error: 'Internal server error' });
    }
  });
};

export default matchesRoute;