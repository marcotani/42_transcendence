// Leaderboards Manager - Handles leaderboard functionality
import { API_BASE } from '../config/constants.js';

export class LeaderboardsManager {
  /**
   * Create a leaderboard table HTML
   */
  private static createLeaderboardTable(title: string, data: any[], emptyMessage: string): string {
    const rows = data.length > 0 
      ? data.map(item => `
          <tr class='hover:bg-gray-700 transition-colors'>
            <td class='px-4 py-3 text-yellow-400 font-semibold'>#${item.rank}</td>
            <td class='px-4 py-3'>${item.displayName}</td>
            <td class='px-4 py-3 text-green-400 font-semibold'>${item.wins}</td>
          </tr>
        `).join('')
      : `<tr><td colspan='3' class='px-4 py-6 text-center text-gray-400'>${emptyMessage}</td></tr>`;

    return `
      <div class='bg-gray-800 rounded-lg overflow-hidden'>
        <h3 class='text-xl font-semibold p-4 bg-gray-700 text-center'>${title}</h3>
        <table class='w-full text-left'>
          <thead class='bg-gray-600'>
            <tr>
              <th class='px-4 py-3 text-yellow-400'>Rank</th>
              <th class='px-4 py-3'>Player</th>
              <th class='px-4 py-3 text-green-400'>Wins</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }

  /**
   * Load and display leaderboards
   */
  static async loadLeaderboards(): Promise<void> {
    const contentDiv = document.getElementById('leaderboard-content');
    if (!contentDiv) return;

    try {
      // Fetch all three leaderboards in parallel
      const [botWinsRes, playerWinsRes, tournamentWinsRes] = await Promise.all([
        fetch(`${API_BASE}/stats/leaderboard/bot-wins`),
        fetch(`${API_BASE}/stats/leaderboard/player-wins`),
        fetch(`${API_BASE}/stats/leaderboard/tournament-wins`)
      ]);

      const [botWinsData, playerWinsData, tournamentWinsData] = await Promise.all([
        botWinsRes.json(),
        playerWinsRes.json(),
        tournamentWinsRes.json()
      ]);

      // Create the three-column layout
      const leaderboardHtml = `
        <div class='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          ${LeaderboardsManager.createLeaderboardTable('🤖 Bot Wins', botWinsData, 'No bot matches played yet')}
          ${LeaderboardsManager.createLeaderboardTable('👥 Player Wins', playerWinsData, 'No player matches played yet')}
          ${LeaderboardsManager.createLeaderboardTable('🏆 Tournament Wins', tournamentWinsData, 'No tournaments won yet')}
        </div>
      `;

      contentDiv.innerHTML = leaderboardHtml;
    } catch (error) {
      console.error('Failed to load leaderboards:', error);
      contentDiv.innerHTML = `
        <div class='text-center py-8'>
          <p class='text-red-400 mb-2'>Failed to load leaderboards</p>
          <button onclick='window.loadLeaderboards()' class='px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-purple-400'>
            Try Again
          </button>
        </div>
      `;
    }
  }
}