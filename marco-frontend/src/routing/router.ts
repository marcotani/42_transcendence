// Router class for handling application routing
import { routes } from './routes.js';
import { translations, getT } from '../config/translations.js';
import { API_BASE } from '../config/constants.js';
import { accessibilityTogglesUI, showStatus } from '../utils/dom-helpers.js';
import { LanguageManager } from '../features/language.js';
import { ProfileManager } from '../features/profile.js';
import { StorageService } from '../services/storage.js';
import { FriendsManager } from '../features/friends-manager.js';
import { LeaderboardsManager } from '../features/leaderboards-manager.js';
import { ProfileManager as UserProfileManager } from '../features/profile-manager.js';
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
  const t = getT(lang);
    const app = document.getElementById('app');
    if (!app) return;
    // Clear the record of attached page-specific listeners on every render.
    // When render replaces `app.innerHTML`, previously attached DOM listeners are lost,
    // so we must allow page-specific initialization to run again. This avoids a class
    // of bugs where buttons become non-interactive after a re-render (e.g. language change).
    Router.attachedListeners.clear();
    
    let content = '';
    
    // Fix: ensure route is parsed correctly from hash
    if (!route && window.location.hash) {
      route = window.location.hash.replace('#', '');
    }
    
    if (routes[route]) {
      const routeDef = routes[route];
      content = (typeof routeDef === 'function') ? routeDef(t) : (routeDef as any);
    } else if (route.startsWith('profile/')) {
      // Handle viewing other user's profile
      const username = route.split('/')[1];
      content = Router.generateViewProfilePage(username);
    } else if (route === 'tournament') {
      const rd = routes['tournament'];
      content = (typeof rd === 'function') ? rd(t) : (rd as any);
    } else if (route === 'options') {
      content = `<h2 class='text-2xl font-bold mb-4' tabindex='0' aria-label='${t.optionsTitle}'>${t.optionsTitle}</h2><p>${t.optionsDesc}</p>`;
    } else if (route === 'leaderboard') {
      content = `<h2 class='text-2xl font-bold mb-4' tabindex='0' aria-label='${t.leaderboardTitle}'>${t.leaderboardTitle}</h2>
        <div id='leaderboard-content' class='mt-6 w-full max-w-6xl mx-auto'>
          <div class='text-center py-8'>
            <div class='inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white'></div>
            <p class='mt-2 text-gray-400'>${t.loadingLeaderboards}</p>
          </div>
        </div>
        <div class='w-full max-w-6xl mx-auto mt-6 text-center'>
          <button id='back-home-leaderboard' class='mt-6 px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded focus:outline-none focus:ring-4 focus:ring-gray-400' aria-label='${t.backToHome}'>${t.backToHome}</button>
        </div>`;
    } else {
      content = `<h1 class='text-4xl font-bold mb-4' tabindex='0' aria-label='${t.title}'>${t.title}</h1>
        <div class='flex flex-col items-center justify-center space-y-4 mt-8'>
          <button class='w-48 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded focus:outline-none focus:ring-4 focus:ring-green-400' id='start-game' aria-label='${t.startGame}' tabindex='0'>${t.startGame}</button>
          <button class='w-48 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded focus:outline-none focus:ring-4 focus:ring-orange-400' id='tournament' aria-label='${t.tournament}' tabindex='0'>${t.tournament}</button>
          <button class='w-48 px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded focus:outline-none focus:ring-4 focus:ring-gray-400' id='options' data-i18n='options' data-i18n-attr="aria-label:options" tabindex='0'>${t.options}</button>
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
            <button id='dropdown-my-profile' class='block w-full text-left px-4 py-2 hover:bg-gray-800 text-white rounded focus:outline-none' role='menuitem' aria-label='${t.myProfile}'>${t.myProfile}</button>
            <button id='dropdown-logout' class='block w-full text-left px-4 py-2 hover:bg-gray-800 text-white rounded focus:outline-none' role='menuitem' aria-label='${t.logout}'>${t.logout}</button>
          </div>
        </div>
      </div>`;
    } else {
      topRightUI = `<div class='fixed top-4 right-4 z-50 flex space-x-2'>
        <button class='px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded focus:outline-none focus:ring-4 focus:ring-blue-400' aria-label='${t.login}' tabindex='0' id='login-btn'>${t.login}</button>
        <button class='px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded focus:outline-none focus:ring-4 focus:ring-green-400' aria-label='${t.register}' tabindex='0' id='register-btn'>${t.register}</button>
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
      setTimeout(() => {
        Router.loadLeaderboards();
        // Attach Back-to-Home button listener (button rendered at bottom of leaderboard page)
        try {
          const btn = document.getElementById('back-home-leaderboard');
          if (btn) btn.addEventListener('click', () => { window.location.hash = ''; });
        } catch (e) {
          // ignore listener attachment failures
        }
      }, 0);
    }
    if (route === 'options' && !Router.attachedListeners.has('options')) {
      Router.attachedListeners.add('options');
      setTimeout(() => Router.initializeOptionsPage(), 0);
    }
    if (route === 'friends' && !Router.attachedListeners.has('friends')) {
      Router.attachedListeners.add('friends');
      setTimeout(() => Router.initializeFriendsPage(), 0);
    }
    if (route === 'tournament' && !Router.attachedListeners.has('tournament')) {
      Router.attachedListeners.add('tournament');
      setTimeout(() => Router.initializeTournamentPage(), 0);
    }
    if (route === 'pong' && !Router.attachedListeners.has('pong')) {
      Router.attachedListeners.add('pong');
      setTimeout(() => Router.initializeGamePage(), 0);
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
    const powerUpsCheckbox = document.getElementById('power-ups-enabled') as HTMLInputElement;
    const powerUpIntervalSlider = document.getElementById('power-up-interval') as HTMLInputElement;
    const powerUpIntervalValue = document.getElementById('power-up-interval-value') as HTMLSpanElement;
    const powerUpSettings = document.getElementById('power-up-settings') as HTMLDivElement;
    const saveButton = document.getElementById('save-options') as HTMLButtonElement;
    const saveStatus = document.getElementById('save-status') as HTMLDivElement;
  const t = translations[LanguageManager.getLang()];
    
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
    
    // Power-up settings
    if (powerUpsCheckbox && powerUpSettings) {
      powerUpsCheckbox.checked = settings.powerUpsEnabled;
      powerUpSettings.style.display = settings.powerUpsEnabled ? 'block' : 'none';
      
      powerUpsCheckbox.addEventListener('change', () => {
        powerUpSettings.style.display = powerUpsCheckbox.checked ? 'block' : 'none';
      });
    }
    
    if (powerUpIntervalSlider && powerUpIntervalValue) {
      powerUpIntervalSlider.value = settings.powerUpSpawnInterval.toString();
      powerUpIntervalValue.textContent = settings.powerUpSpawnInterval.toString();
      powerUpIntervalSlider.addEventListener('input', () => {
        powerUpIntervalValue.textContent = powerUpIntervalSlider.value;
      });
    }
    
    if (saveButton) {
      saveButton.addEventListener('click', () => {
        const newSettings: GameSettings = {
          ballSpeed: parseInt(ballSpeedSlider?.value || '3'),
          paddleSpeed: parseInt(paddleSpeedSlider?.value || '5'),
          pointsToWin: parseInt(pointsSelect?.value || '3'),
          powerUpsEnabled: powerUpsCheckbox?.checked || false,
          powerUpSpawnInterval: parseInt(powerUpIntervalSlider?.value || '15')
        };
        
        GameSettingsService.save(newSettings);
        
        if (saveStatus) {
          saveStatus.textContent = t.settingsSavedSuccess;
          setTimeout(() => {
            saveStatus.textContent = '';
          }, 3000);
        }
      });
    }
    
    // Reset to defaults button
    const resetButton = document.getElementById('reset-defaults') as HTMLButtonElement;
    if (resetButton) {
      resetButton.addEventListener('click', () => {
        const defaultSettings = GameSettingsService.getDefault();
        
        // Update UI elements with default values
        if (ballSpeedSlider && ballSpeedValue) {
          ballSpeedSlider.value = defaultSettings.ballSpeed.toString();
          ballSpeedValue.textContent = defaultSettings.ballSpeed.toString();
        }
        if (paddleSpeedSlider && paddleSpeedValue) {
          paddleSpeedSlider.value = defaultSettings.paddleSpeed.toString();
          paddleSpeedValue.textContent = defaultSettings.paddleSpeed.toString();
        }
        if (pointsSelect) {
          pointsSelect.value = defaultSettings.pointsToWin.toString();
        }
        if (powerUpsCheckbox && powerUpSettings) {
          powerUpsCheckbox.checked = defaultSettings.powerUpsEnabled;
          powerUpSettings.style.display = defaultSettings.powerUpsEnabled ? 'block' : 'none';
        }
        if (powerUpIntervalSlider && powerUpIntervalValue) {
          powerUpIntervalSlider.value = defaultSettings.powerUpSpawnInterval.toString();
          powerUpIntervalValue.textContent = defaultSettings.powerUpSpawnInterval.toString();
        }
        
        // Save the default settings
        GameSettingsService.save(defaultSettings);
        
        if (saveStatus) {
          saveStatus.textContent = t.settingsResetSuccess;
          setTimeout(() => {
            saveStatus.textContent = '';
          }, 3000);
        }
      });
    }
    
    // Back to main button
    const backButton = document.getElementById('back-to-main') as HTMLButtonElement;
    if (backButton) {
      backButton.addEventListener('click', () => {
        window.location.hash = '';
      });
    }
  }

  /**
   * Generate a view profile page with loading spinner
   */
  static generateViewProfilePage(username: string): string {
    return UserProfileManager.generateViewProfilePage(username);
  }

  /**
   * Load and display user profile data
   */
  static async loadUserProfile(username: string): Promise<void> {
    return UserProfileManager.loadUserProfile(username);
  }

  /**
   * Load and display leaderboards
   */
  static async loadLeaderboards(): Promise<void> {
    return LeaderboardsManager.loadLeaderboards();
  }

  /**
   * Initialize the friends page
   */
  private static async initializeFriendsPage(): Promise<void> {
    const loggedInUser = (window as any).loggedInUser;
    if (!loggedInUser) return;

    // Load initial data
    FriendsManager.loadPendingRequests();
    FriendsManager.loadFriendsList();
    FriendsManager.updateFriendsCount();

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
    await FriendsManager.handleSendFriendRequest(e, () => FriendsManager.loadPendingRequests());
  }

  private static async loadPendingRequests(): Promise<void> {
    return FriendsManager.loadPendingRequests();
  }

  private static async loadFriendsList(): Promise<void> {
    return FriendsManager.loadFriendsList();
  }

  static async acceptFriendRequest(requestId: number): Promise<void> {
    await FriendsManager.acceptFriendRequest(requestId.toString(), {
      loadPendingRequests: () => FriendsManager.loadPendingRequests(),
      loadFriendsList: () => FriendsManager.loadFriendsList(),
      updateFriendsCount: () => FriendsManager.updateFriendsCount()
    });
  }

  static async rejectFriendRequest(requestId: number): Promise<void> {
    await FriendsManager.rejectFriendRequest(requestId, {
      loadPendingRequests: () => FriendsManager.loadPendingRequests(),
      updateFriendsCount: () => FriendsManager.updateFriendsCount()
    });
  }

  static async cancelFriendRequest(requestId: number): Promise<void> {
    await FriendsManager.cancelFriendRequest(requestId, {
      loadPendingRequests: () => FriendsManager.loadPendingRequests(),
      updateFriendsCount: () => FriendsManager.updateFriendsCount()
    });
  }

  static async removeFriend(friendUsername: string): Promise<void> {
    await FriendsManager.removeFriend(friendUsername, {
      loadFriendsList: () => FriendsManager.loadFriendsList(),
      updateFriendsCount: () => FriendsManager.updateFriendsCount()
    });
  }

  static viewProfile(username: string): void {
    return FriendsManager.viewProfile(username);
  }

  /**
   * Initialize tournament page with event handlers
   */
  private static initializeTournamentPage(): void {
    const t = translations[LanguageManager.getLang()];
    // Tournament state
    let tournamentPlayers: Array<{username: string, password: string}> = [];
    let tournamentSize = 0;
    let currentTournament: any = null;
    let currentMatchIndex = 0;

    // Player count selection
    document.getElementById('players-4')?.addEventListener('click', () => {
      tournamentSize = 4;
      Router.showPlayerRegistration(4);
    });

    document.getElementById('players-6')?.addEventListener('click', () => {
      tournamentSize = 6;
      Router.showPlayerRegistration(6);
    });

    document.getElementById('players-8')?.addEventListener('click', () => {
      tournamentSize = 8;
      Router.showPlayerRegistration(8);
    });

    // Start tournament button
    document.getElementById('start-tournament')?.addEventListener('click', async () => {
      const loggedInUser = (window as any).loggedInUser;
      if (!loggedInUser) {
        alert(t.pleaseLogInToStartTournament);
        return;
      }

      // Build players array with logged-in user first
      tournamentPlayers = [{ username: loggedInUser, password: '' }]; // No password needed for logged-in user
      
      // Add other players (starting from player 2)
      for (let i = 2; i <= tournamentSize; i++) {
        const username = (document.getElementById(`player${i}-username`) as HTMLInputElement)?.value;
        const password = (document.getElementById(`player${i}-password`) as HTMLInputElement)?.value;
        
        if (username && password) {
          tournamentPlayers.push({ username, password });
        }
      }

      if (tournamentPlayers.length === tournamentSize) {
        const success = await Router.validateAllPlayers(tournamentPlayers);
        if (success) {
          currentTournament = Router.generateTournamentBracket(tournamentPlayers);
          Router.showTournamentBracket(currentTournament);
          Router.startNextMatch(currentTournament, currentMatchIndex);
        }
      }
    });

    // Start match button
    document.getElementById('start-match')?.addEventListener('click', () => {
      // Get the current match index from session storage (updated by startNextMatch)
      const actualMatchIndex = parseInt(sessionStorage.getItem('currentMatchIndex') || '0');
      console.log('Start match button clicked - using matchIndex:', actualMatchIndex);
      
      // Get the current match from tournament data
      const currentRound = currentTournament.rounds[currentTournament.currentRound];
      const currentMatch = currentRound[actualMatchIndex];
      
      if (currentMatch && currentMatch.player1 && currentMatch.player2) {
        Router.startTournamentGame(currentMatch.player1, currentMatch.player2, currentTournament, actualMatchIndex);
      }
    });

    // Back to home button
    document.getElementById('back-home-tournament')?.addEventListener('click', () => {
      window.location.hash = '#';
    });

    // Return to bracket button
    document.getElementById('return-to-bracket')?.addEventListener('click', (ev) => {
      try { ev.preventDefault(); ev.stopPropagation(); } catch (e) { /* ignore */ }
      // Try to exit fullscreen first; do not await to avoid race where the button DOM is removed before handler finishes
      try {
        if (document.fullscreenElement) {
          if (typeof (document as any).exitFullscreen === 'function') (document as any).exitFullscreen();
          else if (typeof (document as any).webkitExitFullscreen === 'function') (document as any).webkitExitFullscreen();
        }
      } catch (e) { /* ignore */ }

      // Call endTournamentGame after a short delay to give fullscreenchange handlers time to restore DOM
      setTimeout(() => {
        const actualMatchIndex = parseInt(sessionStorage.getItem('currentMatchIndex') || '0');
        Router.endTournamentGame(currentTournament, actualMatchIndex);
      }, 150);
    });

    // Start tournament game button
    document.getElementById('start-tournament-game')?.addEventListener('click', () => {
      Router.actuallyStartTournamentGame();
    });

    // Expose continue tournament function globally
    (window as any).continueTournament = () => {
      Router.continueTournamentFromGame();
    };
  }

  /**
   * Show player registration form
   */
  private static showPlayerRegistration(playerCount: number): void {
    const t = translations[LanguageManager.getLang()];
    document.getElementById('tournament-setup')?.classList.add('hidden');
    document.getElementById('player-registration')?.classList.remove('hidden');
    
    const formsContainer = document.getElementById('player-forms');
    if (!formsContainer) return;

    const loggedInUser = (window as any).loggedInUser;
    if (!loggedInUser) {
      alert(t.pleaseLogInToStartTournament);
      window.location.hash = '#';
      return;
    }

    formsContainer.innerHTML = '';
    
    // Add logged-in user as Player 1 (read-only)
    const player1Form = document.createElement('div');
    player1Form.className = 'bg-green-800 p-4 rounded-lg';
    player1Form.innerHTML = `
      <h4 class="text-lg font-bold mb-3">${t.player1} (${t.youLabel})</h4>
      <div class="space-y-3">
        <input 
          type="text" 
          value="${loggedInUser}" 
          class="w-full px-3 py-2 bg-gray-600 text-white rounded border border-gray-500"
          readonly
        />
        <div class="text-green-400 text-sm">✓ ${t.alreadyLoggedIn}</div>
      </div>
    `;
    formsContainer.appendChild(player1Form);

    // Add forms for remaining players
    for (let i = 2; i <= playerCount; i++) {
      const playerForm = document.createElement('div');
      playerForm.className = 'bg-gray-800 p-4 rounded-lg';
      playerForm.innerHTML = `
        <h4 class="text-lg font-bold mb-3">${t.playerLabel} ${i}</h4>
        <div class="space-y-3">
          <input 
            type="text" 
            id="player${i}-username" 
            placeholder="${t.enterUsernamePlaceholder}"
            class="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500"
            required
          />
          <input 
            type="password" 
            id="player${i}-password" 
            placeholder="${t.passwordLabel}"
            class="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500"
            required
          />
          <div id="player${i}-error" class="text-red-400 text-sm h-5"></div>
        </div>
      `;
      formsContainer.appendChild(playerForm);

      // Add validation listeners
      const usernameInput = playerForm.querySelector(`#player${i}-username`) as HTMLInputElement;
      const passwordInput = playerForm.querySelector(`#player${i}-password`) as HTMLInputElement;
      
      [usernameInput, passwordInput].forEach(input => {
        input?.addEventListener('input', () => Router.checkTournamentFormValidity(playerCount));
      });
    }
  }

  /**
   * Check if tournament form is valid and enable/disable start button
   */
  private static checkTournamentFormValidity(playerCount: number): void {
    const startButton = document.getElementById('start-tournament') as HTMLButtonElement;
    if (!startButton) return;

    let allValid = true;
    // Start from player 2 since player 1 is the logged-in user
    for (let i = 2; i <= playerCount; i++) {
      const username = (document.getElementById(`player${i}-username`) as HTMLInputElement)?.value;
      const password = (document.getElementById(`player${i}-password`) as HTMLInputElement)?.value;
      
      if (!username || !password) {
        allValid = false;
        break;
      }
    }

    startButton.disabled = !allValid;
  }

  /**
   * Validate all player credentials and fetch profile data
   */
  private static async validateAllPlayers(players: Array<{username: string, password: string}>): Promise<boolean> {
    const t = translations[LanguageManager.getLang()];
    const usernames = new Set();
    
    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      // For players 2 and beyond, the error div is at player{i+1}-error
      // For player 1 (logged-in user), skip validation
      const errorDiv = i === 0 ? null : document.getElementById(`player${i+1}-error`);
      
      // Check for duplicate usernames
      if (usernames.has(player.username)) {
        if (errorDiv) errorDiv.textContent = t.usernameAlreadyUsedTournament;
        return false;
      }
      usernames.add(player.username);

      // Skip credential validation for the logged-in user (first player)
      if (i === 0) {
        // For logged-in user, fetch their profile data
        try {
          const response = await fetch(`${API_BASE}/users/${player.username}`);
          if (response.ok) {
            const userData = await response.json();
            // Store profile data with the player
            (player as any).profile = userData.profile;
            (player as any).id = userData.id;
          }
        } catch (error) {
          console.warn('Failed to fetch profile for logged-in user:', error);
        }
        continue;
      }

      // Validate credentials for other players
      try {
        const response = await fetch(`${API_BASE}/api/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: player.username, password: player.password })
        });

        if (!response.ok) {
         if (errorDiv) errorDiv.textContent = t.invalidUsernameOrPassword;
          return false;
        } else {
          if (errorDiv) errorDiv.textContent = '';
          
          // After successful login, fetch user profile data
          try {
            const profileResponse = await fetch(`${API_BASE}/users/${player.username}`);
            if (profileResponse.ok) {
              const userData = await profileResponse.json();
              // Store profile data with the player
              (player as any).profile = userData.profile;
              (player as any).id = userData.id;
            }
          } catch (profileError) {
            console.warn('Failed to fetch profile for player:', player.username, profileError);
          }
        }
      } catch (error) {
        if (errorDiv) errorDiv.textContent = t.networkErrorGeneric;
        return false;
      }
    }

    return true;
  }

  /**
   * Generate tournament bracket
   */
  private static generateTournamentBracket(players: Array<{username: string, password: string}>): any {
    // Shuffle players for random matchups
    const shuffled = [...players].sort(() => Math.random() - 0.5);
    
    return {
      players: shuffled,
      rounds: Router.createRounds(shuffled),
      currentRound: 0,
      winners: []
    };
  }

  /**
   * Create tournament rounds structure
   */
  private static createRounds(players: Array<{username: string, password: string}>): any[] {
    const rounds = [];
    
    // Only create the first round initially
    const matches = [];
    for (let i = 0; i < players.length; i += 2) {
      matches.push({
        player1: players[i],
        player2: players[i + 1] || null, // Handle odd numbers (bye)
        winner: null
      });
    }
    rounds.push(matches);
    
    return rounds;
  }

  /**
   * Generate bracket tree visualization
   */
  private static generateBracketVisualization(tournament: any, currentMatchIndex: number): void {
    const bracketTree = document.getElementById('bracket-tree');
    if (!bracketTree) return;

    const rounds = tournament.rounds;
    const currentRound = tournament.currentRound;
    
    let html = `<div class="bracket-container flex justify-center items-center space-x-8 overflow-x-auto min-h-[300px]">`;

    // Generate each round
    for (let roundIndex = 0; roundIndex < rounds.length; roundIndex++) {
      const matches = rounds[roundIndex];
      const isCurrentRound = roundIndex === currentRound;
      
      html += `<div class="round-column flex flex-col justify-center space-y-4">`;
      html += `<div class="text-center text-sm font-bold text-gray-400 mb-2">
        ${roundIndex === rounds.length - 1 ? 'Finals' : `Round ${roundIndex + 1}`}
      </div>`;

      matches.forEach((match: any, matchIndex: number) => {
        const isCurrentMatch = isCurrentRound && matchIndex === currentMatchIndex;
        const isCompleted = match.winner;
        
        let matchClass = 'bg-gray-700 border-2 border-gray-500';
        if (isCurrentMatch) {
          matchClass = 'bg-orange-600 border-2 border-orange-400 animate-pulse';
        } else if (isCompleted) {
          matchClass = 'bg-green-700 border-2 border-green-500';
        }

        html += `
          <div class="${matchClass} rounded-lg p-3 min-w-[140px] relative">
            <div class="text-sm font-bold ${match.winner?.username === match.player1.username ? 'text-green-300' : ''} mb-1">
              ${match.player1.username}
            </div>
            <div class="text-xs text-gray-300 text-center mb-1">vs</div>
            <div class="text-sm font-bold ${match.winner?.username === match.player2?.username ? 'text-green-300' : ''} mb-1">
              ${match.player2?.username || 'BYE'}
            </div>
            ${isCurrentMatch ? '<div class="absolute -top-2 -right-2 text-orange-300 text-xl">👑</div>' : ''}
            ${isCompleted ? `<div class="text-xs text-center text-green-300 mt-1">Winner: ${match.winner.username}</div>` : ''}
          </div>
        `;
      });

      html += `</div>`;

      // Add connecting lines (simplified version)
      if (roundIndex < rounds.length - 1) {
        html += `<div class="connector flex flex-col justify-center space-y-8">`;
        const nextRoundMatches = rounds[roundIndex + 1]?.length || 0;
        for (let i = 0; i < nextRoundMatches; i++) {
          html += `<div class="w-8 h-px bg-gray-500"></div>`;
        }
        html += `</div>`;
      }
    }

    html += `</div>`;
    
    // Add legend
    html += `
      <div class="flex justify-center space-x-4 mt-4 text-xs">
        <span class="flex items-center"><div class="w-4 h-4 bg-orange-600 rounded mr-1"></div>Current Match</span>
        <span class="flex items-center"><div class="w-4 h-4 bg-green-700 rounded mr-1"></div>Completed</span>
        <span class="flex items-center"><div class="w-4 h-4 bg-gray-700 rounded mr-1"></div>Upcoming</span>
      </div>
    `;

    bracketTree.innerHTML = html;
  }

  /**
   * Show tournament bracket
   */
  private static showTournamentBracket(tournament: any): void {
    document.getElementById('player-registration')?.classList.add('hidden');
    document.getElementById('tournament-bracket')?.classList.remove('hidden');
    
    const bracketDisplay = document.getElementById('bracket-display');
    if (!bracketDisplay) return;

    let bracketHTML = '';
    tournament.rounds.forEach((round: any, roundIndex: number) => {
      bracketHTML += `<div class="mb-4">
        <h4 class="text-lg font-bold mb-2">Round ${roundIndex + 1}</h4>
        <div class="space-y-2">`;
      
      round.forEach((match: any, matchIndex: number) => {
        const player1Name = match.player1.username;
        const player2Name = match.player2?.username || 'BYE';
        const winnerClass = match.winner ? 'bg-green-700' : 'bg-gray-700';
        
        bracketHTML += `
          <div class="flex justify-between items-center p-2 ${winnerClass} rounded">
            <span>${player1Name}</span>
            <span class="text-sm">vs</span>
            <span>${player2Name}</span>
            ${match.winner ? `<span class="text-yellow-400">🏆 ${match.winner.username}</span>` : ''}
          </div>`;
      });
      
      bracketHTML += '</div></div>';
    });

    bracketDisplay.innerHTML = bracketHTML;
  }

  /**
   * Start next tournament match
   */
  private static startNextMatch(tournament: any, matchIndex: number): void {
    console.log('=== START NEXT MATCH ===');
    console.log('Current round:', tournament.currentRound);
    console.log('Match index:', matchIndex);
    console.log('Current round matches:', tournament.rounds[tournament.currentRound]);
    
    // Store current match index for use by event handlers
    sessionStorage.setItem('currentMatchIndex', matchIndex.toString());
    console.log('Stored currentMatchIndex in sessionStorage:', matchIndex);
    
    const currentRound = tournament.rounds[tournament.currentRound];
    if (!currentRound || matchIndex >= currentRound.length) {
      console.log('End of round - checking if complete...');
      console.log('Current round matches:', currentRound);
      // Round finished, check if all matches in current round are complete
      const allMatchesComplete = currentRound && currentRound.every((match: any) => {
        console.log('Checking match:', match, 'Has winner:', !!match.winner);
        return match.winner;
      });
      console.log('All matches complete:', allMatchesComplete);
      
      if (allMatchesComplete) {
        // Create next round with winners
        const winners = currentRound.map((match: any) => match.winner).filter((winner: any) => winner);
        console.log('Winners:', winners);
        
        if (winners.length === 1) {
          // Tournament finished
          console.log('Tournament finished!');
          Router.showTournamentWinner(tournament);
          return;
        }
        
        // Create next round
        const nextRoundMatches = [];
        for (let i = 0; i < winners.length; i += 2) {
          nextRoundMatches.push({
            player1: winners[i],
            player2: winners[i + 1] || null,
            winner: null
          });
        }
        tournament.rounds.push(nextRoundMatches);
        console.log('New round created:', nextRoundMatches);
        
        // Move to next round and reset match index
        tournament.currentRound++;
        matchIndex = 0;
        
        // Update bracket display and start first match of new round
        Router.showTournamentBracket(tournament);
        Router.startNextMatch(tournament, matchIndex);
        return;
      }
      
      // If not all matches complete, something went wrong - reset to first incomplete match
      console.log('Not all matches complete, resetting...');
      matchIndex = 0;
    }

    const match = currentRound[matchIndex];
    if (match.winner) {
      // Match already completed, go to next
      Router.startNextMatch(tournament, matchIndex + 1);
      return;
    }

    if (!match.player2) {
      // BYE match, player1 advances automatically
      match.winner = match.player1;
      Router.startNextMatch(tournament, matchIndex + 1);
      return;
    }

    // Show current match display
    document.getElementById('tournament-bracket')?.classList.add('hidden');
    document.getElementById('current-match')?.classList.remove('hidden');
    
    // Generate bracket visualization
    Router.generateBracketVisualization(tournament, matchIndex);
    
    const player1Element = document.getElementById('match-player1');
    const player2Element = document.getElementById('match-player2');
    
    if (player1Element) player1Element.textContent = match.player1.username;
    if (player2Element) player2Element.textContent = match.player2.username;
  }

  /**
   * Show tournament winner
   */
  private static showTournamentWinner(tournament: any): void {
    document.getElementById('current-match')?.classList.add('hidden');
    document.getElementById('tournament-game')?.classList.add('hidden');
    document.getElementById('tournament-bracket')?.classList.add('hidden');
    document.getElementById('tournament-winner')?.classList.remove('hidden');
    
    // Find the winner - could be from the last completed round
    let winner = null;
    if (tournament.rounds.length > 0) {
      const lastRound = tournament.rounds[tournament.rounds.length - 1];
      if (lastRound.length === 1 && lastRound[0].winner) {
        winner = lastRound[0].winner;
      } else {
        // Find the winner from completed matches
        const winners = lastRound.map((match: any) => match.winner).filter((w: any) => w);
        if (winners.length === 1) {
          winner = winners[0];
        }
      }
    }
    
    const winnerNameElement = document.getElementById('winner-name');
    if (winnerNameElement && winner) {
      winnerNameElement.textContent = winner.username;
    }

    // Update winner statistics
    if (winner) {
      Router.updateTournamentWinner(winner.username);
    }
  }

  /**
   * Update tournament winner statistics
   */
  private static async updateTournamentWinner(username: string): Promise<void> {
    try {
      await fetch(`${API_BASE}/stats/tournament-win`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
    } catch (error) {
      console.error('Failed to update tournament winner stats:', error);
    }
  }

  /**
   * Actually start the tournament game when button is clicked
   */
  private static actuallyStartTournamentGame(): void {
    const gameData = (window as any).tournamentGameData;
    if (!gameData) return;
    
    const { player1, player2, tournament, matchIndex } = gameData;
    
    // Hide start button and update status
    document.getElementById('start-tournament-game')?.classList.add('hidden');
    const statusElement = document.getElementById('tournament-game-status');
    if (statusElement) statusElement.textContent = 'Game in progress...';
    
    // Get canvas and start game
    const canvas = document.getElementById('tournament-canvas') as HTMLCanvasElement;
    if (canvas) {
      // Set tournament mode flag for the game engine
      sessionStorage.setItem('tournamentMode', 'true');
      
      // Import PongEngine (it should already be available globally)
      if ((window as any).PongEngine) {
        const gameInstance = (window as any).PongEngine.createTournamentGame(canvas, {
          player1: player1,
          player2: player2,
          onGameEnd: (winner: string) => {
            console.log('Tournament game ended, winner:', winner);
            Router.onTournamentGameEnd(winner, tournament, matchIndex);
          }
        });
        gameInstance.start();
      } else {
        console.error('PongEngine not available');
      }
    }
  }
  private static startTournamentGame(player1: any, player2: any, tournament: any, matchIndex: number): void {
    const t = translations[LanguageManager.getLang()];
    // Update main title to show match info
    const titleElement = document.getElementById('tournament-main-title');
    const currentRound = tournament.currentRound + 1;
    const totalMatches = tournament.rounds[tournament.currentRound].length;
    const currentMatch = matchIndex + 1;
    
    if (titleElement) {
      titleElement.textContent = `🏆 Tournament - Round ${currentRound}, Match ${currentMatch}`;
    }
    
    // Hide current match display and show game area
    document.getElementById('current-match')?.classList.add('hidden');
    document.getElementById('tournament-game')?.classList.remove('hidden');
    
    // Set player names in game display
    const player1Element = document.getElementById('game-player1');
    const player2Element = document.getElementById('game-player2');
    if (player1Element) player1Element.textContent = player1.username;
    if (player2Element) player2Element.textContent = player2.username;
    
    // Initialize game status
    const statusElement = document.getElementById('tournament-game-status');
  if (statusElement) statusElement.textContent = t.readyToStartFull;
    
    // Store game data for when start button is clicked
    (window as any).tournamentGameData = { player1, player2, tournament, matchIndex };
    
    console.log('=== STARTING TOURNAMENT GAME ===');
    console.log('Storing game data with matchIndex:', matchIndex);
    console.log('Players:', player1, 'vs', player2);
  }

  /**
   * Handle tournament game completion
   */
  private static onTournamentGameEnd(winner: string, tournament: any, matchIndex: number): void {
    const t = translations[LanguageManager.getLang()];
    // Get the correct match index from game data
    const gameData = (window as any).tournamentGameData;
    if (gameData && typeof gameData.matchIndex === 'number') {
      matchIndex = gameData.matchIndex;
    }
    
    console.log('=== TOURNAMENT GAME END ===');
    console.log('Winner:', winner);
    console.log('Match index:', matchIndex);
    console.log('Tournament state:', tournament);
    
    // Update game status
    const statusElement = document.getElementById('tournament-game-status');
  if (statusElement) statusElement.textContent = `🏆 ${winner} wins!`;
    
    // CRITICAL: Update tournament bracket with winner at the CORRECT match index
    const currentRound = tournament.rounds[tournament.currentRound];
    if (currentRound && currentRound[matchIndex]) {
      const match = currentRound[matchIndex];
      console.log('Updating match:', matchIndex, 'Old match:', match);
      // Find the winner object from the players
      if (match.player1.username === winner) {
        match.winner = match.player1;
      } else if (match.player2 && match.player2.username === winner) {
        match.winner = match.player2;
      }
      console.log('Match updated with winner:', match);
    } else {
      console.error('Could not find match to update!', { matchIndex, currentRound });
    }
    
    // Update the global tournament state with current tournament
    (window as any).tournamentGameData.tournament = tournament;
    (window as any).tournamentGameData.matchIndex = matchIndex;
    
    // Show return to bracket button
    const returnButton = document.getElementById('return-to-bracket');
    if (returnButton) {
      returnButton.classList.remove('hidden');
      returnButton.textContent = t.continueTournament;
      // If in fullscreen, move the button into the fullscreen element so it's visible to the user
      try {
        const fs = document.fullscreenElement as HTMLElement | null;
        if (fs) {
          // position and append
          returnButton.style.position = 'absolute';
          returnButton.style.left = '50%';
          returnButton.style.bottom = '24px';
          returnButton.style.transform = 'translateX(-50%)';
          returnButton.style.zIndex = '10020';
          // If fullscreen element is a canvas, append to body (canvas elements don't reliably host HTML children)
          const appendTarget = (fs.tagName === 'CANVAS') ? document.body : fs;
          try { appendTarget.appendChild(returnButton); } catch (e) { /* ignore */ }
          // Make sure it can receive pointer events
          try { (returnButton as HTMLElement).style.pointerEvents = 'auto'; } catch (e) { /* ignore */ }
        }
      } catch (e) { /* ignore */ }
    }
  }

  /**
   * End tournament game and return to bracket
   */
  private static endTournamentGame(tournament: any, matchIndex: number): void {
    const t = translations[LanguageManager.getLang()];
    // Get the updated tournament state from the game data
    try {
      const gameData = (window as any).tournamentGameData;
      if (!tournament && gameData && gameData.tournament) {
        tournament = gameData.tournament;
        matchIndex = gameData.matchIndex || matchIndex;
      }
    } catch (e) { /* ignore */ }
    // As last resort, try sessionStorage
    try {
      if (!tournament) {
        const ts = sessionStorage.getItem('tournamentState');
        if (ts) tournament = JSON.parse(ts);
      }
    } catch (e) { /* ignore */ }
    
    console.log('=== END TOURNAMENT GAME ===');
    console.log('Tournament state:', tournament);
    console.log('Match index:', matchIndex);
    
    // Check if this was the final match (only 1 match in the current round)
    const currentRound = tournament.rounds[tournament.currentRound];
    const isFinalMatch = currentRound && currentRound.length === 1 && currentRound[0].winner;
    console.log('Is final match:', isFinalMatch);
    
    if (isFinalMatch) {
      // This was the final - show tournament winner
      Router.showTournamentWinner(tournament);
      return;
    }
    
    // Reset title back to tournament setup
    const titleElement = document.getElementById('tournament-main-title');
    if (titleElement) {
      titleElement.textContent = '🏆 Tournament Bracket';
    }
    
    // Hide game area and reset game elements
    document.getElementById('tournament-game')?.classList.add('hidden');
    document.getElementById('return-to-bracket')?.classList.add('hidden');
    document.getElementById('start-tournament-game')?.classList.remove('hidden');
    
    // Reset game status
    const statusElement = document.getElementById('tournament-game-status');
  if (statusElement) statusElement.textContent = t.readyToStart;
    
    // Clear tournament mode flag
    sessionStorage.removeItem('tournamentMode');
    
    // Update and show bracket
    Router.showTournamentBracket(tournament);
    
  // Ensure body is scrollable after returning from fullscreen
  try { document.body.style.overflow = ''; } catch (e) { /* ignore */ }

    // Continue to next match
    Router.startNextMatch(tournament, matchIndex + 1);
  }

  /**
   * Continue tournament after a match completes
   */
  private static continueTournamentFromGame(): void {
    try {
      const tournamentState = JSON.parse(sessionStorage.getItem('tournamentState') || '{}');
      const currentMatchIndex = parseInt(sessionStorage.getItem('currentMatchIndex') || '0');
      
      // Update tournament bracket display
      Router.showTournamentBracket(tournamentState);
      
      // Continue with next match or round
      Router.startNextMatch(tournamentState, currentMatchIndex);
    } catch (error) {
      console.error('Error continuing tournament:', error);
      // Reset tournament if there's an error
      document.getElementById('tournament-setup')?.classList.remove('hidden');
      document.getElementById('tournament-bracket')?.classList.add('hidden');
      document.getElementById('current-match')?.classList.add('hidden');
      document.getElementById('tournament-winner')?.classList.add('hidden');
    }
  }

  /**
   * Initialize game page with tournament mode support
   */
  private static initializeGamePage(): void {
    const isTournamentMode = sessionStorage.getItem('tournamentMode') === 'true';
    
    if (isTournamentMode) {
      // Handle tournament mode
      const player1 = sessionStorage.getItem('player1');
      const player2 = sessionStorage.getItem('player2');
      
      if (player1 && player2) {
        // Auto-select player vs player mode and set players
        setTimeout(() => {
          const playerModeBtn = document.getElementById('player-vs-player-btn');
          const gameArea = document.getElementById('game-area');
          const gameModeSelection = document.getElementById('game-mode-selection');
          
          if (playerModeBtn && gameArea && gameModeSelection) {
            // Hide mode selection and show game area
            gameModeSelection.classList.add('hidden');
            gameArea.classList.remove('hidden');
            
            // Set player names in the UI
            const player1Input = document.getElementById('player-1-username') as HTMLInputElement;
            const player2Input = document.getElementById('player-2-username') as HTMLInputElement;
            
            if (player1Input) player1Input.value = player1;
            if (player2Input) player2Input.value = player2;
            
            // Trigger form validation
            const event = new Event('input', { bubbles: true });
            player1Input?.dispatchEvent(event);
            player2Input?.dispatchEvent(event);
          }
        }, 100);
      }
    }
  }
}

// Make Router functions globally available for onclick handlers
(window as any).acceptFriendRequest = Router.acceptFriendRequest;
(window as any).rejectFriendRequest = Router.rejectFriendRequest;
(window as any).cancelFriendRequest = Router.cancelFriendRequest;
(window as any).removeFriend = Router.removeFriend;
(window as any).viewProfile = FriendsManager.viewProfile;
