// Profile Manager - Handles user profile viewing functionality
import { API_BASE } from '../config/constants.js';
import { MatchHistoryManager } from './match-history.js';

export class ProfileManager {
  /**
   * Generate initial profile page HTML with loading spinner
   */
  static generateViewProfilePage(username: string): string {
    return `<div class='max-w-md mx-auto mt-16 p-8 bg-gray-900 rounded-lg shadow-lg' id='view-profile-page'>
      <div class='flex flex-col items-center'>
        <div class='text-center py-8'>
          <div class='inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white'></div>
          <p class='mt-2 text-gray-400'>Loading profile...</p>
        </div>
        <button id='back-home-view-profile' class='mt-6 w-full px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded focus:outline-none focus:ring-4 focus:ring-gray-400'>Back to Home</button>
      </div>
    </div>`;
  }

  /**
   * Load and display user profile data
   */
  static async loadUserProfile(username: string): Promise<void> {
    try {
      // Fetch user profile, stats, and match history
      const [userResponse, statsResponse, matchHistoryResponse] = await Promise.all([
        fetch(`${API_BASE}/users/${username}`),
        fetch(`${API_BASE}/stats/${username}`),
        fetch(`${API_BASE}/matches/history/${username}`)
      ]);

      if (!userResponse.ok) {
        throw new Error('User not found');
      }

      const userData = await userResponse.json();
      const statsData = statsResponse.ok ? await statsResponse.json() : null;
      const matchHistoryData = matchHistoryResponse.ok ? await matchHistoryResponse.json() : null;

      // Update the profile page content
      const container = document.getElementById('view-profile-page');
      if (container) {
        // Avatar HTML - matching the exact format from "my profile"
        let avatarUrl = userData.profile?.avatarUrl || '';
        if (avatarUrl.startsWith('/uploads') || avatarUrl.startsWith('/static')) {
          avatarUrl = API_BASE + avatarUrl;
        }
        
        const avatarHtml = avatarUrl
          ? `<img src='${avatarUrl}' alt='avatar' class='w-32 h-32 rounded-full border-4 border-gray-600 bg-gray-700 object-cover mb-2' onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" /><span class='w-32 h-32 rounded-full bg-gray-700 border-4 border-gray-600 flex items-center justify-center mb-2' style='display:none;'><svg width='64' height='64' fill='none' viewBox='0 0 24 24'><circle cx='12' cy='8' r='4' fill='#bbb'/><ellipse cx='12' cy='18' rx='7' ry='4' fill='#bbb'/></svg></span>`
          : `<span class='w-32 h-32 rounded-full bg-gray-700 border-4 border-gray-600 flex items-center justify-center mb-2'><svg width='64' height='64' fill='none' viewBox='0 0 24 24'><circle cx='12' cy='8' r='4' fill='#bbb'/><ellipse cx='12' cy='18' rx='7' ry='4' fill='#bbb'/></svg></span>`;

        // Stats HTML - matching the exact format from "my profile"
        const statsHtml = statsData ? `
          <div class='w-full mb-6'>
            <div class='grid grid-cols-2 gap-4 mb-2'>
              <div class='bg-gray-800 rounded-lg p-4 flex flex-col items-center'>
                <div class='text-lg font-semibold text-green-400'>Bot</div>
                <div class='flex space-x-4 mt-2'>
                  <div class='text-center'>
                    <div class='text-2xl font-bold'>${statsData.botWins ?? 0}</div>
                    <div class='text-gray-400 text-sm'>Wins</div>
                  </div>
                  <div class='text-center'>
                    <div class='text-2xl font-bold'>${statsData.botLosses ?? 0}</div>
                    <div class='text-gray-400 text-sm'>Losses</div>
                  </div>
                </div>
              </div>
              <div class='bg-gray-800 rounded-lg p-4 flex flex-col items-center'>
                <div class='text-lg font-semibold text-blue-400'>Player</div>
                <div class='flex space-x-4 mt-2'>
                  <div class='text-center'>
                    <div class='text-2xl font-bold'>${statsData.playerWins ?? 0}</div>
                    <div class='text-gray-400 text-sm'>Wins</div>
                  </div>
                  <div class='text-center'>
                    <div class='text-2xl font-bold'>${statsData.playerLosses ?? 0}</div>
                    <div class='text-gray-400 text-sm'>Losses</div>
                  </div>
                </div>
              </div>
            </div>
            <div class='bg-gray-800 rounded-lg p-4 flex flex-col items-center'>
              <div class='text-lg font-semibold text-yellow-400'>Tournament Wins</div>
              <div class='text-3xl font-bold mt-2'>${statsData.tournamentWins ?? 0}</div>
            </div>
          </div>
        ` : '';

        // Match History HTML
        const matchHistoryHtml = matchHistoryData ? MatchHistoryManager.generateMatchHistoryHtml(matchHistoryData.matches || [], username) : '';

        container.innerHTML = `
          <div class='flex flex-col items-center'>
            <div class='mb-4'>${avatarHtml}</div>
            <div class='text-2xl font-bold mb-2'>${userData.profile?.alias || userData.username}</div>
            <div class='text-gray-400 mb-2'>@${userData.username}</div>
            ${userData.profile?.emailVisible && userData.email && userData.email !== '*************' ? `<div class='text-gray-400 mb-4'>${userData.email}</div>` : ''}
            ${userData.profile?.bio ? `<div class='text-base text-white mb-6'>${userData.profile.bio}</div>` : ''}
            ${statsHtml}
            ${matchHistoryHtml}
            <button id='back-home-view-profile' class='mt-2 w-full px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded focus:outline-none focus:ring-4 focus:ring-gray-400'>Back to Friends</button>
          </div>
        `;
        
        // Attach back button listener to go to friends page
        document.getElementById('back-home-view-profile')?.addEventListener('click', () => {
          window.location.hash = 'friends';
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      const container = document.getElementById('view-profile-page');
      if (container) {
        container.innerHTML = `
          <div class='flex flex-col items-center'>
            <div class='text-red-400 mb-4'>Failed to load profile</div>
            <p class='text-gray-400 mb-6 text-center'>User not found or an error occurred.</p>
            <button id='back-home-view-profile' class='w-full px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded focus:outline-none focus:ring-4 focus:ring-gray-400'>Back to Friends</button>
          </div>
        `;
        
        document.getElementById('back-home-view-profile')?.addEventListener('click', () => {
          window.location.hash = 'friends';
        });
      }
    }
  }
}