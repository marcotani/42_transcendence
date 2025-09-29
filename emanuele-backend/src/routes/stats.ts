import { FastifyPluginAsync } from 'fastify';
import { MatchService } from '../services/matchService';

const statsRoute: FastifyPluginAsync = async (app) => {
  // Statistiche di tutti gli utenti
  app.get('/stats', async (req, reply) => {
    try {
      const stats = await app.prisma.userStat.findMany({
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
      const user = await app.prisma.user.findUnique({
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

  // Aggiorna statistiche utente e registra il match
  app.post('/stats/update', async (req, reply) => {
    const body = req.body as {
      userId: number;
      result: 'win' | 'loss';
      type: 'bot' | 'player' | 'tournament';

      opponent?: {
        id?: number;
        botName?: string;
      };
      scores?: {
        userScore: number;
        opponentScore: number;
      };
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

      await app.prisma.userStat.update({
        where: { userId: body.userId },
        data: update,
      });

      // Registrazione match 
      if (body.type !== 'tournament' && body.opponent && body.scores) {
        try {
          const winnerId = body.result === 'win' ? body.userId : body.opponent.id;
          
          await MatchService.createMatch({
            player1Id: body.userId,
            player2Id: body.opponent.id,
            player2BotName: body.opponent.botName,
            player1Score: body.scores.userScore,
            player2Score: body.scores.opponentScore,
            winnerId: winnerId,
            matchType: body.type
          });
        } catch (matchError) {
          app.log.warn('Failed to create match record:', matchError);
        }
      }

      return reply.send({ success: true });
    } catch (err) {
      app.log.error(err);
      return reply.code(500).send({ error: 'Internal server error' });
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
      return reply.code(500).send({ error: 'Internal server error' });
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
      return reply.code(500).send({ error: 'Internal server error' });
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
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });
};

export default statsRoute;
