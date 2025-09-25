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
  static async createMatch(matchData: MatchData): Promise<any> {
    try {
      // Verifica che non sia un torneo, temporaneo
      if (matchData.matchType.toLowerCase() === 'tournament') {
        throw new Error('Tournament matches should not be added to history');
      }

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
      return matches.map(match => ({
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