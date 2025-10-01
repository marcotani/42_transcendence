export class MatchHistoryManager {
  /**
   * Generate HTML for match history display
   */
  static generateMatchHistoryHtml(matches: any[], username?: string): string {
    if (!matches || matches.length === 0) {
      return `
        <div class='bg-gray-800 rounded-lg p-4'>
          <h3 class='text-lg font-semibold mb-4 text-white'>Match History</h3>
          <div class='text-gray-400 text-center py-4'>No matches played yet</div>
        </div>
      `;
    }

    // Use provided username or fall back to loggedInUser for backward compatibility
    const targetUser = username || (window as any).loggedInUser;

    const matchesHtml = matches.map(match => {
      const matchDate = new Date(match.matchDate).toLocaleDateString();
      const isWin = match.userResult === 'WIN';
      const resultColor = isWin ? 'text-green-400' : 'text-red-400';
      const resultBg = isWin ? 'bg-green-900' : 'bg-red-900';
      
      // Determine opponent name
      let opponent;
      if (match.matchType === 'bot') {
        // For bot matches, show the bot name or "AI"
        opponent = match.participants.player2BotName || 'AI';
      } else {
        // For player matches, show the other player
        opponent = match.participants.player1 === targetUser 
          ? match.participants.player2 
          : match.participants.player1;
      }
      
      // Format match type
      const typeColor = match.matchType === 'bot' ? 'text-orange-400' : 
                       match.matchType === 'player' ? 'text-blue-400' : 'text-yellow-400';
      
      return `
        <div class='${resultBg} border-l-4 ${isWin ? 'border-green-400' : 'border-red-400'} rounded-r-lg p-3 mb-2'>
          <div class='flex justify-between items-center'>
            <div class='flex-1'>
              <div class='flex items-center space-x-2'>
                <span class='${resultColor} font-bold text-sm'>${match.userResult}</span>
                <span class='${typeColor} text-xs uppercase'>${match.matchType}</span>
              </div>
              <div class='text-white font-medium'>vs ${opponent}</div>
              <div class='text-gray-300 text-sm'>${matchDate}</div>
            </div>
            <div class='text-right'>
              <div class='text-white font-bold text-lg'>
                ${match.scores.player1Score}-${match.scores.player2Score}
              </div>
              <div class='text-gray-400 text-xs'>
                Winner: ${match.winner}
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class='bg-gray-800 rounded-lg p-4'>
        <h3 class='text-lg font-semibold mb-4 text-white'>Match History</h3>
        <div class='max-h-64 overflow-y-auto'>
          ${matchesHtml}
        </div>
        <div class='text-center mt-3'>
          <small class='text-gray-400'>Last ${matches.length} matches</small>
        </div>
      </div>
    `;
  }
}