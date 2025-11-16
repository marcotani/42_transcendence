import { PrismaClient, Prisma } from '@prisma/client';
import { sanitizeHtml } from '../utils/sanitizer';

// The PrismaClient instance is now injected to avoid multiple SQLite connections.
let prisma: PrismaClient;
export function setPrisma(client: PrismaClient) { prisma = client; }

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
  static async updateUserStats(
    matchData: MatchData,
    client: PrismaClient | Prisma.TransactionClient = prisma
  ): Promise<void> {
    try {
      console.log('updateUserStats called with:', matchData);
      
      // Update stats for player1
      const player1IsWinner = matchData.winnerId === matchData.player1Id;
      console.log(`Player 1 (ID: ${matchData.player1Id}) is winner: ${player1IsWinner}`);
      
      // Check if user stats exist, create if not
      // Upsert player1 stats (atomic against races)
      const player1Initial = this.getStatsUpdate(matchData.matchType, player1IsWinner);
      const player1Increment = this.getStatsUpdateIncrement(matchData.matchType, player1IsWinner);
      await client.userStat.upsert({
        where: { userId: matchData.player1Id },
        create: {
          userId: matchData.player1Id,
          botWins: player1Initial.botWins ?? 0,
          botLosses: player1Initial.botLosses ?? 0,
          playerWins: player1Initial.playerWins ?? 0,
          playerLosses: player1Initial.playerLosses ?? 0,
          tournamentWins: player1Initial.tournamentWins ?? 0
        },
        update: player1Increment
      });

      // Update stats for player2 if it's not a bot
      if (matchData.player2Id) {
        console.log(`Processing stats for player 2 (ID: ${matchData.player2Id})`);
        const player2IsWinner = matchData.winnerId === matchData.player2Id;
        console.log(`Player 2 is winner: ${player2IsWinner}`);
        
        const player2Initial = this.getStatsUpdate(matchData.matchType, player2IsWinner);
        const player2Increment = this.getStatsUpdateIncrement(matchData.matchType, player2IsWinner);
        await client.userStat.upsert({
          where: { userId: matchData.player2Id },
          create: {
            userId: matchData.player2Id,
            botWins: player2Initial.botWins ?? 0,
            botLosses: player2Initial.botLosses ?? 0,
            playerWins: player2Initial.playerWins ?? 0,
            playerLosses: player2Initial.playerLosses ?? 0,
            tournamentWins: player2Initial.tournamentWins ?? 0
          },
          update: player2Increment
        });
      } else {
        console.log('No player 2 ID provided, skipping player 2 stats update');
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
      console.log('Creating match with data:', matchData);
      // Sanitize any user-supplied textual fields to avoid XSS via history rendering
      const safeMatchData: MatchData = {
        ...matchData,
        player2BotName: matchData.player2BotName
          ? sanitizeHtml(String(matchData.player2BotName)).slice(0, 32)
          : undefined
      };
      
      // Verifica che non sia un torneo, temporaneo
      if (safeMatchData.matchType.toLowerCase() === 'tournament') {
        throw new Error('Tournament matches should not be added to history');
      }

      // Wrap all operations in a transaction to avoid race conditions.
      const match = await prisma.$transaction(async (tx) => {
        // Update user statistics (atomic)
        console.log('Updating user statistics (transaction)...');
        await this.updateUserStats(safeMatchData, tx);

        // Prune player1 history if needed
        const player1MatchCount = await tx.match.count({
          where: { OR: [ { player1Id: safeMatchData.player1Id }, { player2Id: safeMatchData.player1Id } ] }
        });
        if (player1MatchCount >= 10) {
          await this.removeOldestMatchForUser(safeMatchData.player1Id, tx);
        }

        // Prune player2 history if needed
        if (safeMatchData.player2Id) {
          const player2MatchCount = await tx.match.count({
            where: { OR: [ { player1Id: safeMatchData.player2Id }, { player2Id: safeMatchData.player2Id } ] }
          });
            if (player2MatchCount >= 10) {
            await this.removeOldestMatchForUser(safeMatchData.player2Id, tx);
          }
        }

        // Create match
        console.log('Creating match (transaction)...');
        return tx.match.create({
          data: safeMatchData,
          include: {
            player1: { select: { username: true } },
            player2: { select: { username: true } },
            winner: { select: { username: true } }
          }
        });
      });
      
      console.log('Match created successfully:', {
        id: match.id,
        player1: match.player1?.username,
        player2: match.player2?.username,
        player1Id: match.player1Id,
        player2Id: match.player2Id,
        player2BotName: match.player2BotName,
        matchType: match.matchType
      });

      return match;
    } catch (error) {
      console.error('Error creating match:', error);
      throw error;
    }
  }

  static async removeOldestMatchForUser(
    userId: number,
    client: PrismaClient | Prisma.TransactionClient = prisma
  ): Promise<void> {
    try {
      // Trova la partita più vecchia dell'utente
      const oldestMatch = await client.match.findFirst({
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
        await client.match.delete({
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
      console.log(`Getting match history for user ID: ${userId}`);
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

      console.log(`Found ${matches.length} matches for user ${userId}`);
      matches.forEach((match: any, index: number) => {
        console.log(`Match ${index + 1}:`, {
          id: match.id,
          player1Id: match.player1Id,
          player2Id: match.player2Id,
          player1Username: match.player1?.username,
          player2Username: match.player2?.username,
          player2BotName: match.player2BotName,
          matchType: match.matchType,
          winnerId: match.winnerId
        });
      });

      // Formatta i risultati per migliore leggibilità, sanificando nomi liberi
      return matches.map((match: any) => ({
        id: match.id,
        participants: {
          player1: match.player1.username,
          player2: match.player2?.username || (match.player2BotName ? sanitizeHtml(match.player2BotName) : 'BOT')
        },
        scores: {
          player1Score: match.player1Score,
          player2Score: match.player2Score
        },
        winner: match.winner?.username || (match.winnerId === match.player1Id ? match.player1.username : (match.player2?.username || match.player2BotName || 'BOT')),
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