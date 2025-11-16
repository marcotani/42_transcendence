import { FastifyPluginAsync } from 'fastify';
import { MatchService, setPrisma } from '../services/matchService';
import { authenticateJWT } from './auth';

const statsRoute: FastifyPluginAsync = async (app) => {
  // Inietta il PrismaClient condiviso nel MatchService
  setPrisma(app.prisma);
  // Statistiche di tutti gli utenti
  app.get('/stats', async (req, reply) => {
    try {
      const stats = await app.prisma.userStat.findMany({
        include: { user: { select: { username: true } } }
      });
      return reply.send(stats);
    } catch (err) {
      app.log.error(err);
      return reply.code(500).send({ errorCode: 'INTERNAL_SERVER_ERROR', error: 'Internal server error' });
    }
  });

  // Statistiche di un utente specifico
  app.get('/stats/:username', async (req, reply) => {
    const { username } = req.params as { username: string };
    try {
      const user = await app.prisma.user.findUnique({
        where: { username },
        include: { stats: true }
      });
      if (!user || !user.stats) {
        return reply.code(404).send({ errorCode: 'USER_NOT_FOUND', error: 'User or stats not found' });
      }
      return reply.send(user.stats);
    } catch (err) {
      app.log.error(err);
      return reply.code(500).send({ errorCode: 'INTERNAL_SERVER_ERROR', error: 'Internal server error' });
    }
  });

  // Aggiorna statistiche utente e registra il match
  app.post('/stats/update', { preHandler: authenticateJWT, config: { rateLimit: { max: 60, timeWindow: '1 minute' } } }, async (req, reply) => {
    const body = req.body as {
      userId: number;
      result: 'win' | 'loss';
      type: 'bot' | 'player' | 'tournament';
      opponent?: { id?: number; botName?: string };
      scores?: { userScore: number; opponentScore: number };
    };

    // Verifica autenticazione utente corrispondente
    const authUser = (req as any).user;
    if (!authUser || authUser.userId !== body.userId) {
      return reply.code(403).send({ errorCode: 'UNAUTHORIZED', error: 'Access denied' });
    }

    if (!body || !body.userId || !body.result || !body.type) {
      return reply.code(400).send({ errorCode: 'MISSING_FIELDS', error: 'Missing fields' });
    }

    try {
      // Tornei: solo incremento statistiche, nessun match in history
      if (body.type === 'tournament') {
        if (body.result !== 'win') {
          return reply.code(400).send({ errorCode: 'INVALID_COMBINATION', error: 'Invalid combination' });
        }
        await app.prisma.userStat.update({
          where: { userId: body.userId },
          data: { tournamentWins: { increment: 1 } },
        });
        return reply.send({ success: true });
      }

      // Bot/Player: delega completamente a MatchService (transazione: stats + match)
      if (body.opponent && body.scores) {
        const winnerId = body.result === 'win' ? body.userId : body.opponent.id;
        await MatchService.createMatch({
          player1Id: body.userId,
          player2Id: body.opponent.id,
          player2BotName: body.opponent.botName,
          player1Score: body.scores.userScore,
          player2Score: body.scores.opponentScore,
          winnerId,
          matchType: body.type
        });
        return reply.send({ success: true });
      }

      // Fallback: se mancano dettagli, aggiorna solo stats minime
      const update = body.type === 'bot'
        ? (body.result === 'win' ? { botWins: { increment: 1 } } : { botLosses: { increment: 1 } })
        : (body.result === 'win' ? { playerWins: { increment: 1 } } : { playerLosses: { increment: 1 } });
      await app.prisma.userStat.update({ where: { userId: body.userId }, data: update });
      return reply.send({ success: true });
    } catch (err) {
      app.log.error(err);
      return reply.code(500).send({ errorCode: 'INTERNAL_SERVER_ERROR', error: 'Internal server error' });
    }
  });

  // Tournament win endpoint - accepts username and updates tournament statistics
  app.post('/stats/tournament-win', { preHandler: authenticateJWT, config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, async (req, reply) => {
    const body = req.body as { username: string };
    const authUser = (req as any).user;
    if (!authUser || authUser.username !== body.username) {
      return reply.code(403).send({ errorCode: 'UNAUTHORIZED', error: 'Access denied' });
    }

    if (!body || !body.username) {
      return reply.code(400).send({ errorCode: 'MISSING_FIELDS', error: 'Username is required' });
    }

    try {
      // Find user by username
      const user = await app.prisma.user.findUnique({
        where: { username: body.username },
        select: { id: true }
      });

      if (!user) {
        return reply.code(404).send({ errorCode: 'USER_NOT_FOUND', error: 'User not found' });
      }

      // Update tournament wins
      await app.prisma.userStat.update({
        where: { userId: user.id },
        data: { tournamentWins: { increment: 1 } },
      });

      app.log.info(`Tournament win recorded for user: ${body.username}`);
      return reply.send({ success: true });
    } catch (err) {
      app.log.error(err);
      return reply.code(500).send({ errorCode: 'INTERNAL_SERVER_ERROR', error: 'Internal server error' });
    }
  });

  // Leaderboard per Bot Wins
  app.get('/stats/leaderboard/bot-wins', async (req, reply) => {
    try {
      const topUsers = await app.prisma.userStat.findMany({
        orderBy: { botWins: 'desc' },
        take: 10,
        include: {
          user: {
            select: {
              username: true,
              profile: {
                select: {
                  alias: true
                }
              }
            }
          }
        }
      });

      const leaderboard = topUsers.map((userStat: any, index: number) => ({
        rank: index + 1,
        username: userStat.user.username,
        displayName: userStat.user.profile?.alias || userStat.user.username,
        wins: userStat.botWins
      }));

      return reply.send(leaderboard);
    } catch (err) {
      app.log.error(err);
      return reply.code(500).send({ errorCode: 'INTERNAL_SERVER_ERROR', error: 'Internal server error' });
    }
  });

  // Leaderboard per Player Wins
  app.get('/stats/leaderboard/player-wins', async (req, reply) => {
    try {
      const topUsers = await app.prisma.userStat.findMany({
        orderBy: { playerWins: 'desc' },
        take: 10,
        include: {
          user: {
            select: {
              username: true,
              profile: {
                select: {
                  alias: true
                }
              }
            }
          }
        }
      });

      const leaderboard = topUsers.map((userStat: any, index: number) => ({
        rank: index + 1,
        username: userStat.user.username,
        displayName: userStat.user.profile?.alias || userStat.user.username,
        wins: userStat.playerWins
      }));

      return reply.send(leaderboard);
    } catch (err) {
      app.log.error(err);
      return reply.code(500).send({ errorCode: 'INTERNAL_SERVER_ERROR', error: 'Internal server error' });
    }
  });

  // Leaderboard per Tournament Wins
  app.get('/stats/leaderboard/tournament-wins', async (req, reply) => {
    try {
      const topUsers = await app.prisma.userStat.findMany({
        orderBy: { tournamentWins: 'desc' },
        take: 10,
        include: {
          user: {
            select: {
              username: true,
              profile: {
                select: {
                  alias: true
                }
              }
            }
          }
        }
      });

      const leaderboard = topUsers.map((userStat: any, index: number) => ({
        rank: index + 1,
        username: userStat.user.username,
        displayName: userStat.user.profile?.alias || userStat.user.username,
        wins: userStat.tournamentWins
      }));

      return reply.send(leaderboard);
    } catch (err) {
      app.log.error(err);
      return reply.code(500).send({ errorCode: 'INTERNAL_SERVER_ERROR', error: 'Internal server error' });
    }
  });
};

export default statsRoute;
