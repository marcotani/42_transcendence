// Router class for handling application routing
import { routes } from './routes.js';
import { translations } from '../config/translations.js';
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
    await FriendsManager.acceptFriendRequest(requestId, {
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
}

// Make Router functions globally available for onclick handlers
(window as any).acceptFriendRequest = Router.acceptFriendRequest;
(window as any).rejectFriendRequest = Router.rejectFriendRequest;
(window as any).cancelFriendRequest = Router.cancelFriendRequest;
(window as any).removeFriend = Router.removeFriend;
(window as any).viewProfile = FriendsManager.viewProfile;
