import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface MatchData {
  player1Id: number;
  player2Id?: number;
  player2BotName?: string;
  player1Score: number;
  player2Score: number;
  winnerId?: number;
  matchType: string;
}

export class MatchService {
  static async updateUserStats(matchData: MatchData): Promise<void> {
    try {
      // Update stats for player1
      const player1IsWinner = matchData.winnerId === matchData.player1Id;
      
      // Check if user stats exist, create if not
      const player1Stats = await prisma.userStat.findUnique({
        where: { userId: matchData.player1Id }
      });
      
      if (!player1Stats) {
        // Create initial stats record
        const initialStats = {
          userId: matchData.player1Id,
          botWins: 0,
          botLosses: 0,
          playerWins: 0,
          playerLosses: 0,
          tournamentWins: 0
        };
        
        // Apply the update for this match
        const player1Update = this.getStatsUpdate(matchData.matchType, player1IsWinner);
        Object.assign(initialStats, player1Update);
        
        await prisma.userStat.create({ data: initialStats });
      } else {
        // Update existing stats
        const player1Update = this.getStatsUpdateIncrement(matchData.matchType, player1IsWinner);
        await prisma.userStat.update({
          where: { userId: matchData.player1Id },
          data: player1Update
        });
      }

      // Update stats for player2 if it's not a bot
      if (matchData.player2Id) {
        const player2IsWinner = matchData.winnerId === matchData.player2Id;
        
        const player2Stats = await prisma.userStat.findUnique({
          where: { userId: matchData.player2Id }
        });
        
        if (!player2Stats) {
          // Create initial stats record
          const initialStats = {
            userId: matchData.player2Id,
            botWins: 0,
            botLosses: 0,
            playerWins: 0,
            playerLosses: 0,
            tournamentWins: 0
          };
          
          // Apply the update for this match
          const player2Update = this.getStatsUpdate(matchData.matchType, player2IsWinner);
          Object.assign(initialStats, player2Update);
          
          await prisma.userStat.create({ data: initialStats });
        } else {
          // Update existing stats
          const player2Update = this.getStatsUpdateIncrement(matchData.matchType, player2IsWinner);
          await prisma.userStat.update({
            where: { userId: matchData.player2Id },
            data: player2Update
          });
        }
      }
    } catch (error) {
      console.error('Error updating user stats:', error);
      throw error;
    }
  }

  static getStatsUpdate(matchType: string, isWinner: boolean): any {
    if (matchType === 'bot') {
      if (isWinner) {
        return { botWins: 1 };
      } else {
        return { botLosses: 1 };
      }
    } else if (matchType === 'player') {
      if (isWinner) {
        return { playerWins: 1 };
      } else {
        return { playerLosses: 1 };
      }
    } else if (matchType === 'tournament' && isWinner) {
      return { tournamentWins: 1 };
    }
    
    return {}; // No stats update for tournament losses
  }

  static getStatsUpdateIncrement(matchType: string, isWinner: boolean): any {
    if (matchType === 'bot') {
      if (isWinner) {
        return { botWins: { increment: 1 } };
      } else {
        return { botLosses: { increment: 1 } };
      }
    } else if (matchType === 'player') {
      if (isWinner) {
        return { playerWins: { increment: 1 } };
      } else {
        return { playerLosses: { increment: 1 } };
      }
    } else if (matchType === 'tournament' && isWinner) {
      return { tournamentWins: { increment: 1 } };
    }
    
    return {}; // No stats update for tournament losses
  }

  static async createMatch(matchData: MatchData): Promise<any> {
    try {
      // Verifica che non sia un torneo, temporaneo
      if (matchData.matchType.toLowerCase() === 'tournament') {
        throw new Error('Tournament matches should not be added to history');
      }

      // Update user statistics first
      await this.updateUserStats(matchData);

      // Controllo delle partite salvate
      const player1MatchCount = await prisma.match.count({
        where: {
          OR: [
            { player1Id: matchData.player1Id },
            { player2Id: matchData.player1Id }
          ]
        }
      });

      // Rimozione della più vecchia in caso siano più di 10
      if (player1MatchCount >= 10) {
        await this.removeOldestMatchForUser(matchData.player1Id);
      }

      // Se il player2 non è un bot controlla anche per lui
      if (matchData.player2Id) {
        const player2MatchCount = await prisma.match.count({
          where: {
            OR: [
              { player1Id: matchData.player2Id },
              { player2Id: matchData.player2Id }
            ]
          }
        });

        if (player2MatchCount >= 10) {
          await this.removeOldestMatchForUser(matchData.player2Id);
        }
      }

      // Crea il nuovo match
      const match = await prisma.match.create({
        data: matchData,
        include: {
          player1: { select: { username: true } },
          player2: { select: { username: true } },
          winner: { select: { username: true } }
        }
      });

      return match;
    } catch (error) {
      console.error('Error creating match:', error);
      throw error;
    }
  }

  static async removeOldestMatchForUser(userId: number): Promise<void> {
    try {
      // Trova la partita più vecchia dell'utente
      const oldestMatch = await prisma.match.findFirst({
        where: {
          OR: [
            { player1Id: userId },
            { player2Id: userId }
          ]
        },
        orderBy: {
          matchDate: 'asc'
        }
      });

      if (oldestMatch) {
        await prisma.match.delete({
          where: { id: oldestMatch.id }
        });
      }
    } catch (error) {
      console.error('Error removing oldest match:', error);
      throw error;
    }
  }

  static async getUserMatchHistory(userId: number): Promise<any[]> {
    try {
      const matches = await prisma.match.findMany({
        where: {
          OR: [
            { player1Id: userId },
            { player2Id: userId }
          ]
        },
        include: {
          player1: { select: { username: true } },
          player2: { select: { username: true } },
          winner: { select: { username: true } }
        },
        orderBy: {
          matchDate: 'desc'
        },
        take: 10
      });

      // Formatta i risultati per migliore leggibilità
      return matches.map((match: any) => ({
        id: match.id,
        participants: {
          player1: match.player1.username,
          player2: match.player2?.username || match.player2BotName || 'BOT'
        },
        scores: {
          player1Score: match.player1Score,
          player2Score: match.player2Score
        },
        winner: match.winner?.username || (match.winnerId === match.player1Id ? match.player1.username : (match.player2?.username || 'BOT')),
        matchDate: match.matchDate,
        matchType: match.matchType,
        userResult: userId === match.winnerId ? 'WIN' : 'LOSS'
      }));
    } catch (error) {
      console.error('Error fetching user match history:', error);
      throw error;
    }
  }
}