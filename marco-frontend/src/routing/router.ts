// Router class for handling application routing
import { routes } from './routes.js';
import { translations } from '../config/translations.js';
import { API_BASE } from '../config/constants.js';
import { accessibilityTogglesUI, showStatus } from '../utils/dom-helpers.js';
import { LanguageManager } from '../features/language.js';
import { ProfileManager } from '../features/profile.js';
import { StorageService } from '../services/storage.js';
import { GameSettings, GameSettingsService } from '../services/game-settings.js';
import { MatchHistoryManager } from '../features/match-history.js';

export class Router {
  private static attachedListeners = new Set<string>();

  /**
   * Render the application content based on the current route
   */
  static render(route: string, 
    loggedInUser: string | null, 
    loggedInUserAvatar: string | null,
    currentOnlineFriendsCount: number,
    currentPendingRequestsCount: number): void {
    const lang = LanguageManager.getLang();
    const t = translations[lang];
    const app = document.getElementById('app');
    if (!app) return;
    
    let content = '';
    
    // Fix: ensure route is parsed correctly from hash
    if (!route && window.location.hash) {
      route = window.location.hash.replace('#', '');
    }
    
    if (routes[route]) {
      content = routes[route];
    } else if (route.startsWith('profile/')) {
      // Handle viewing other user's profile
      const username = route.split('/')[1];
      content = Router.generateViewProfilePage(username);
    } else if (route === 'multiplayer') {
      content = `<h2 class='text-2xl font-bold mb-4' tabindex='0' aria-label='${t.multiplayerTitle}'>${t.multiplayerTitle}</h2><p>${t.multiplayerDesc}</p>`;
    } else if (route === 'options') {
      content = `<h2 class='text-2xl font-bold mb-4' tabindex='0' aria-label='${t.optionsTitle}'>${t.optionsTitle}</h2><p>${t.optionsDesc}</p>`;
    } else if (route === 'leaderboard') {
      content = `<h2 class='text-2xl font-bold mb-4' tabindex='0' aria-label='${t.leaderboardTitle}'>${t.leaderboardTitle}</h2>
        <div id='leaderboard-content' class='mt-6 w-full max-w-6xl mx-auto'>
          <div class='text-center py-8'>
            <div class='inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white'></div>
            <p class='mt-2 text-gray-400'>Loading leaderboards...</p>
          </div>
        </div>`;
    } else {
      content = `<h1 class='text-4xl font-bold mb-4' tabindex='0' aria-label='${t.title}'>${t.title}</h1>
        <div class='flex flex-col items-center justify-center space-y-4 mt-8'>
          <button class='w-48 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded focus:outline-none focus:ring-4 focus:ring-green-400' id='start-game' aria-label='${t.startGame}' tabindex='0'>${t.startGame}</button>
          <button class='w-48 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded focus:outline-none focus:ring-4 focus:ring-yellow-400' id='multiplayer' aria-label='${t.multiplayer}' tabindex='0'>${t.multiplayer}</button>
          <button class='w-48 px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded focus:outline-none focus:ring-4 focus:ring-gray-400' id='options' aria-label='${t.options}' tabindex='0'>${t.options}</button>
          <button class='w-48 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded focus:outline-none focus:ring-4 focus:ring-purple-400' id='leaderboard' aria-label='${t.leaderboard}' tabindex='0'>${t.leaderboard}</button>
        </div>`;
    }
    
    let topRightUI = '';
    if (loggedInUser) {
      // Show avatar if available, else fallback to SVG icon
      let avatarImg = '';
      if (loggedInUserAvatar) {
        let avatarUrl = loggedInUserAvatar;
        if (avatarUrl.startsWith('/uploads') || avatarUrl.startsWith('/static')) {
          avatarUrl = API_BASE + avatarUrl;
        }
        // Add cache-busting for uploaded avatars only
        if (avatarUrl.includes('/uploads/')) {
          const cacheBuster = StorageService.getAvatarCacheBuster();
          avatarUrl += (avatarUrl.includes('?') ? '&' : '?') + 'v=' + cacheBuster;
        }
        avatarImg = `<img src='${avatarUrl}' alt='' class='inline-block w-8 h-8 rounded-full mr-2 border border-gray-600 bg-gray-700 object-cover' style='vertical-align:middle;' onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-block';" /><span class='inline-block w-8 h-8 rounded-full mr-2 bg-gray-700 border border-gray-600 flex items-center justify-center' style='vertical-align:middle; display:none;'><svg width='24' height='24' fill='none' viewBox='0 0 24 24'><circle cx='12' cy='8' r='4' fill='#bbb'/><ellipse cx='12' cy='18' rx='7' ry='4' fill='#bbb'/></svg></span>`;
      } else {
        // Show SVG icon only when no avatar URL is available
        avatarImg = `<span class='inline-block w-8 h-8 rounded-full mr-2 bg-gray-700 border border-gray-600 flex items-center justify-center' style='vertical-align:middle;'><svg width='24' height='24' fill='none' viewBox='0 0 24 24'><circle cx='12' cy='8' r='4' fill='#bbb'/><ellipse cx='12' cy='18' rx='7' ry='4' fill='#bbb'/></svg></span>`;
      }
      topRightUI = `<div class='fixed top-4 right-4 z-50 flex items-center space-x-2'>
        <button id='friends-btn' class='px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded border border-purple-500 focus:outline-none focus:ring-4 focus:ring-purple-400 flex items-center space-x-2' aria-label='Friends'>
          <div class='flex items-center space-x-1'>
            <img src='/public/static/icons/friends_online.svg' alt='Friends' class='w-6 h-6' />
            <span id='friends-online-count'>${currentOnlineFriendsCount}</span>
          </div>
          <div class='flex items-center space-x-1'>
            <img src='/public/static/icons/notification.svg' alt='Notifications' class='w-6 h-6' />
            <span id='pending-requests-count'>${currentPendingRequestsCount}</span>
          </div>
        </button>
        <div class='relative'>
          <button id='user-dropdown-btn' class='px-4 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:outline-none focus:ring-4 focus:ring-yellow-400 flex items-center' aria-haspopup='true' aria-expanded='false' aria-controls='user-dropdown-menu'>${avatarImg}<span>${loggedInUser}</span></button>
          <div id='user-dropdown-menu' class='absolute right-0 top-full mt-1 w-40 bg-gray-900 border border-gray-700 rounded shadow-lg hidden' role='menu' aria-label='User menu'>
            <button id='dropdown-my-profile' class='block w-full text-left px-4 py-2 hover:bg-gray-800 text-white rounded focus:outline-none' role='menuitem'>My Profile</button>
            <button id='dropdown-logout' class='block w-full text-left px-4 py-2 hover:bg-gray-800 text-white rounded focus:outline-none' role='menuitem'>Logout</button>
          </div>
        </div>
      </div>`;
    } else {
      topRightUI = `<div class='fixed top-4 right-4 z-50 flex space-x-2'>
        <button class='px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded focus:outline-none focus:ring-4 focus:ring-blue-400' aria-label='${t.login}' tabindex='0' id='login-btn'>${t.login}</button>
        <button class='px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded focus:outline-none focus:ring-4 focus:ring-green-400' aria-label='Register' tabindex='0' id='register-btn'>Register</button>
      </div>`;
    }
    
    app.innerHTML = LanguageManager.langSwitcherUI(lang) + accessibilityTogglesUI() + topRightUI + content;
    
    // Note: Event listeners will be attached by the calling code
    // This keeps the Router focused on rendering only
  }

  /**
   * Attach page-specific listeners based on current route
   */
  static attachPageSpecificListeners(route: string, 
    loadUserProfile?: (username: string) => void,
    loadLeaderboards?: () => void,
    initializeOptionsPageExternal?: () => void,
    initializeFriendsPageExternal?: () => void): void {
    
    // Attach page-specific listeners based on current route
    if (route === 'edit-profile' && !Router.attachedListeners.has('edit-profile')) {
      Router.attachedListeners.add('edit-profile');
      setTimeout(() => ProfileManager.attachEditProfilePageListeners(), 0);
    }
    if (route === 'profile' && !Router.attachedListeners.has('profile')) {
      Router.attachedListeners.add('profile');
      setTimeout(() => ProfileManager.attachProfilePageListeners(), 0);
    }
    if (route.startsWith('profile/') && !Router.attachedListeners.has(`view-${route}`)) {
      Router.attachedListeners.add(`view-${route}`);
      const username = route.split('/')[1];
      setTimeout(() => Router.loadUserProfile(username), 0);
    }
    if (route === 'leaderboard' && !Router.attachedListeners.has('leaderboard')) {
      Router.attachedListeners.add('leaderboard');
      setTimeout(() => Router.loadLeaderboards(), 0);
    }
    if (route === 'options' && !Router.attachedListeners.has('options')) {
      Router.attachedListeners.add('options');
      setTimeout(() => Router.initializeOptionsPage(), 0);
    }
    if (route === 'friends' && !Router.attachedListeners.has('friends')) {
      Router.attachedListeners.add('friends');
      setTimeout(() => Router.initializeFriendsPage(), 0);
    }
  }

  /**
   * Clear page-specific listeners
   */
  static clearPageSpecificListeners(): void {
    Router.attachedListeners.clear();
  }

  // Page-specific initialization functions

  /**
   * Initialize the options page with game settings
   */
  private static initializeOptionsPage(): void {
    const settings = GameSettingsService.load();
    
    const ballSpeedSlider = document.getElementById('ball-speed') as HTMLInputElement;
    const ballSpeedValue = document.getElementById('ball-speed-value') as HTMLSpanElement;
    const paddleSpeedSlider = document.getElementById('paddle-speed') as HTMLInputElement;
    const paddleSpeedValue = document.getElementById('paddle-speed-value') as HTMLSpanElement;
    const pointsSelect = document.getElementById('points-to-win') as HTMLSelectElement;
    const saveButton = document.getElementById('save-options') as HTMLButtonElement;
    const saveStatus = document.getElementById('save-status') as HTMLDivElement;
    
    if (ballSpeedSlider && ballSpeedValue) {
      ballSpeedSlider.value = settings.ballSpeed.toString();
      ballSpeedValue.textContent = settings.ballSpeed.toString();
      ballSpeedSlider.addEventListener('input', () => {
        ballSpeedValue.textContent = ballSpeedSlider.value;
      });
    }
    
    if (paddleSpeedSlider && paddleSpeedValue) {
      paddleSpeedSlider.value = settings.paddleSpeed.toString();
      paddleSpeedValue.textContent = settings.paddleSpeed.toString();
      paddleSpeedSlider.addEventListener('input', () => {
        paddleSpeedValue.textContent = paddleSpeedSlider.value;
      });
    }
    
    if (pointsSelect) {
      pointsSelect.value = settings.pointsToWin.toString();
    }
    
    if (saveButton) {
      saveButton.addEventListener('click', () => {
        const newSettings: GameSettings = {
          ballSpeed: parseInt(ballSpeedSlider?.value || '3'),
          paddleSpeed: parseInt(paddleSpeedSlider?.value || '5'),
          pointsToWin: parseInt(pointsSelect?.value || '11')
        };
        
        GameSettingsService.save(newSettings);
        
        if (saveStatus) {
          saveStatus.textContent = 'Settings saved successfully!';
          setTimeout(() => {
            saveStatus.textContent = '';
          }, 3000);
        }
      });
    }
  }

  /**
   * Generate the view profile page HTML
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
          ${Router.createLeaderboardTable('🤖 Bot Wins', botWinsData, 'No bot matches played yet')}
          ${Router.createLeaderboardTable('👥 Player Wins', playerWinsData, 'No player matches played yet')}
          ${Router.createLeaderboardTable('🏆 Tournament Wins', tournamentWinsData, 'No tournaments won yet')}
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

  /**
   * Initialize the friends page
   */
  private static async initializeFriendsPage(): Promise<void> {
    const loggedInUser = (window as any).loggedInUser;
    if (!loggedInUser) return;

    // Load initial data
    Router.loadPendingRequests();
    Router.loadFriendsList();
    Router.updateFriendsCount();

    // Set up form listeners
    const sendRequestForm = document.getElementById('send-friend-request-form') as HTMLFormElement;
    const backButton = document.getElementById('back-home-friends') as HTMLButtonElement;

    if (sendRequestForm) {
      sendRequestForm.addEventListener('submit', Router.handleSendFriendRequest);
    }

    if (backButton) {
      backButton.addEventListener('click', () => {
        window.location.hash = '';
      });
    }
  }

  private static async handleSendFriendRequest(e: Event): Promise<void> {
    e.preventDefault();
    const loggedInUser = (window as any).loggedInUser;
    if (!loggedInUser) return;

    const form = e.target as HTMLFormElement;
    const usernameInput = document.getElementById('friend-username') as HTMLInputElement;
    const statusDiv = document.getElementById('send-request-status') as HTMLDivElement;
    const toUsername = usernameInput.value.trim();

    if (!toUsername) {
      showStatus(statusDiv, 'Please enter a username', 'error');
      return;
    }

    try {
      // Get current user's password (we'll need a simpler auth method in the future)
      const password = prompt('Enter your password to send friend request:');
      if (!password) return;

      const response = await fetch(`${API_BASE}/friends/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUsername: loggedInUser,
          currentPassword: password,
          toUsername: toUsername
        })
      });

      const result = await response.json();

      if (response.ok) {
        showStatus(statusDiv, 'Friend request sent successfully!', 'success');
        usernameInput.value = '';
        Router.loadPendingRequests(); // Refresh pending requests
      } else {
        showStatus(statusDiv, result.error || 'Failed to send friend request', 'error');
      }
    } catch (error) {
      showStatus(statusDiv, 'Error sending friend request', 'error');
      console.error('Error:', error);
    }
  }

  private static async loadPendingRequests(): Promise<void> {
    const loggedInUser = (window as any).loggedInUser;
    if (!loggedInUser) return;

    const container = document.getElementById('pending-requests');
    if (!container) return;

    try {
      const response = await fetch(`${API_BASE}/friends/requests?for=${loggedInUser}`);
      const data = await response.json();

      if (response.ok) {
        const { incoming, outgoing } = data;
        let html = '';

        if (incoming.length === 0 && outgoing.length === 0) {
          html = '<p class="text-gray-400 text-center">No pending requests</p>';
        } else {
          if (incoming.length > 0) {
            html += '<h4 class="font-semibold mb-2">Incoming Requests</h4>';
            incoming.forEach((req: any) => {
              html += `
                <div class="flex items-center justify-between p-3 bg-gray-700 rounded mb-2">
                  <span>${req.fromUser.username}</span>
                  <div class="space-x-2">
                    <button class="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm" onclick="acceptFriendRequest(${req.id})">Accept</button>
                    <button class="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm" onclick="rejectFriendRequest(${req.id})">Reject</button>
                  </div>
                </div>
              `;
            });
          }

          if (outgoing.length > 0) {
            html += '<h4 class="font-semibold mb-2 mt-4">Outgoing Requests</h4>';
            outgoing.forEach((req: any) => {
              html += `
                <div class="flex items-center justify-between p-3 bg-gray-700 rounded mb-2">
                  <span>${req.toUser.username}</span>
                  <div class="flex items-center space-x-2">
                    <span class="text-gray-400 text-sm">Pending...</span>
                    <button class="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm" onclick="cancelFriendRequest(${req.id})">Cancel</button>
                  </div>
                </div>
              `;
            });
          }
        }

        container.innerHTML = html;
      }
    } catch (error) {
      console.error('Error loading pending requests:', error);
      container.innerHTML = '<p class="text-red-400 text-center">Error loading requests</p>';
    }
  }

  private static async loadFriendsList(): Promise<void> {
    const loggedInUser = (window as any).loggedInUser;
    if (!loggedInUser) return;

    const container = document.getElementById('friends-list');
    if (!container) return;

    try {
      const response = await fetch(`${API_BASE}/friends/${loggedInUser}`);
      const data = await response.json();

      if (response.ok) {
        const { friends } = data;
        let html = '';

        if (friends.length === 0) {
          html = '<p class="text-gray-400 text-center">No friends yet</p>';
        } else {
          // Sort friends to prioritize online users first
          const sortedFriends = friends.sort((a: any, b: any) => {
            const isAOnline = a.online === 'online' && a.heartbeat && 
                             new Date(a.heartbeat) > new Date(Date.now() - 2 * 60 * 1000);
            const isBOnline = b.online === 'online' && b.heartbeat && 
                             new Date(b.heartbeat) > new Date(Date.now() - 2 * 60 * 1000);
            
            // Online friends first, then offline friends
            if (isAOnline && !isBOnline) return -1;
            if (!isAOnline && isBOnline) return 1;
            
            // If both have same online status, sort alphabetically by username
            return a.username.localeCompare(b.username);
          });

          sortedFriends.forEach((friend: any) => {
            const avatarUrl = friend.avatarUrl 
              ? (friend.avatarUrl.startsWith('/') ? API_BASE + friend.avatarUrl : friend.avatarUrl)
              : `${API_BASE}/static/default_avatar.png`;
            
            // Determine online status with proper logic
            const isOnline = friend.online === 'online' && friend.heartbeat && 
                            new Date(friend.heartbeat) > new Date(Date.now() - 2 * 60 * 1000);
            
            const onlineIndicator = isOnline 
              ? '<span class="w-2 h-2 bg-green-500 rounded-full" title="Online"></span>'
              : '<span class="w-2 h-2 bg-gray-500 rounded-full" title="Offline"></span>';
            
            const onlineText = isOnline ? 'Online' : 'Offline';
            
            html += `
              <div class="flex items-center justify-between p-3 bg-gray-700 rounded mb-2">
                <div class="flex items-center space-x-3">
                  <img src="${avatarUrl}" alt="Avatar" class="w-8 h-8 rounded-full object-cover bg-gray-600" />
                  <div>
                    <button class="text-blue-400 hover:text-blue-300 font-medium" onclick="viewProfile('${friend.username}')">${friend.username}</button>
                    ${friend.alias ? `<p class="text-gray-400 text-sm">${friend.alias}</p>` : ''}
                  </div>
                </div>
                <div class="flex items-center space-x-2">
                  <div class="flex items-center space-x-1">
                    ${onlineIndicator}
                    <span class="text-xs text-gray-400">${onlineText}</span>
                  </div>
                  <button class="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm" onclick="removeFriend('${friend.username}')">Remove</button>
                </div>
              </div>
            `;
          });
        }

        container.innerHTML = html;
      }
    } catch (error) {
      console.error('Error loading friends list:', error);
      container.innerHTML = '<p class="text-red-400 text-center">Error loading friends</p>';
    }
  }

  static async acceptFriendRequest(requestId: number): Promise<void> {
    const loggedInUser = (window as any).loggedInUser;
    if (!loggedInUser) return;

    try {
      const password = prompt('Enter your password to accept friend request:');
      if (!password) return;

      const response = await fetch(`${API_BASE}/friends/requests/${requestId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loggedInUser,
          currentPassword: password
        })
      });

      if (response.ok) {
        Router.loadPendingRequests(); // Refresh pending requests
        Router.loadFriendsList(); // Refresh friends list
        Router.updateFriendsCount(); // Update friends count
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to accept friend request');
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
      alert('Error accepting friend request');
    }
  }

  static async rejectFriendRequest(requestId: number): Promise<void> {
    const loggedInUser = (window as any).loggedInUser;
    if (!loggedInUser) return;

    const confirmed = confirm('Are you sure you want to reject this friend request?');
    if (!confirmed) return;

    try {
      const password = prompt('Enter your password to reject friend request:');
      if (!password) return;

      const response = await fetch(`${API_BASE}/friends/requests/${requestId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loggedInUser,
          currentPassword: password
        })
      });

      if (response.ok) {
        Router.loadPendingRequests(); // Refresh pending requests
        Router.updateFriendsCount(); // Update friends count
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to reject friend request');
      }
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      alert('Error rejecting friend request');
    }
  }

  static async cancelFriendRequest(requestId: number): Promise<void> {
    const loggedInUser = (window as any).loggedInUser;
    if (!loggedInUser) return;

    const confirmed = confirm('Are you sure you want to cancel this friend request?');
    if (!confirmed) return;

    try {
      const password = prompt('Enter your password to cancel friend request:');
      if (!password) return;

      const response = await fetch(`${API_BASE}/friends/requests/${requestId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loggedInUser,
          currentPassword: password
        })
      });

      if (response.ok) {
        Router.loadPendingRequests(); // Refresh pending requests
        Router.updateFriendsCount(); // Update friends count
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to cancel friend request');
      }
    } catch (error) {
      console.error('Error canceling friend request:', error);
      alert('Error canceling friend request');
    }
  }

  static async removeFriend(friendUsername: string): Promise<void> {
    const loggedInUser = (window as any).loggedInUser;
    if (!loggedInUser) return;

    const confirmed = confirm(`Are you sure you want to remove ${friendUsername} from your friends?`);
    if (!confirmed) return;

    try {
      const password = prompt('Enter your password to remove friend:');
      if (!password) return;

      const response = await fetch(`${API_BASE}/friends/${friendUsername}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loggedInUser,
          currentPassword: password
        })
      });

      if (response.ok) {
        Router.loadFriendsList(); // Refresh friends list
        Router.updateFriendsCount(); // Update friends count
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to remove friend');
      }
    } catch (error) {
      console.error('Error removing friend:', error);
      alert('Error removing friend');
    }
  }

  static viewProfile(username: string): void {
    window.location.hash = `#profile/${username}`;
  }

  static async updateFriendsCount(): Promise<void> {
    const loggedInUser = (window as any).loggedInUser;
    if (!loggedInUser) return;

    try {
      // Get pending requests count
      const requestsResponse = await fetch(`${API_BASE}/friends/requests?for=${loggedInUser}`);
      const requestsData = await requestsResponse.json();
      
      // Get friends list with online status
      const friendsResponse = await fetch(`${API_BASE}/friends/${loggedInUser}`);
      const friendsData = await friendsResponse.json();
      
      if (requestsResponse.ok && friendsResponse.ok) {
        const pendingCount = requestsData.incoming.length;
        const friends = friendsData.friends || [];
        
        // Count online friends (those with recent heartbeat)
        const onlineFriendsCount = friends.filter((friend: any) => {
          return friend.online === 'online' && friend.heartbeat && 
                 new Date(friend.heartbeat) > new Date(Date.now() - 2 * 60 * 1000);
        }).length;
        
        // Store the counts in localStorage and update global variables via window
        StorageService.setCurrentOnlineFriendsCount(onlineFriendsCount);
        StorageService.setCurrentPendingRequestsCount(pendingCount);
        (window as any).currentOnlineFriendsCount = onlineFriendsCount;
        (window as any).currentPendingRequestsCount = pendingCount;
        
        // Update both counts
        const pendingElement = document.getElementById('pending-requests-count');
        const onlineElement = document.getElementById('friends-online-count');
        
        if (pendingElement) {
          pendingElement.textContent = pendingCount.toString();
        }
        
        if (onlineElement) {
          onlineElement.textContent = onlineFriendsCount.toString();
        }
        
        // Change button color if there are pending requests
        const friendsBtn = document.getElementById('friends-btn');
        if (friendsBtn) {
          if (pendingCount > 0) {
            friendsBtn.className = friendsBtn.className.replace('bg-purple-600 hover:bg-purple-700', 'bg-orange-600 hover:bg-orange-700');
          } else {
            friendsBtn.className = friendsBtn.className.replace('bg-orange-600 hover:bg-orange-700', 'bg-purple-600 hover:bg-purple-700');
          }
        }
      }
    } catch (error) {
      console.error('Error updating friends count:', error);
    }
  }
}

// Make Router functions globally available for onclick handlers
(window as any).acceptFriendRequest = Router.acceptFriendRequest;
(window as any).rejectFriendRequest = Router.rejectFriendRequest;
(window as any).cancelFriendRequest = Router.cancelFriendRequest;
(window as any).removeFriend = Router.removeFriend;
(window as any).viewProfile = Router.viewProfile;
