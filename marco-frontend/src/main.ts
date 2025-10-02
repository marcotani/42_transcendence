// Import extracted modules
import { translations } from './config/translations.js';
import { API_BASE, HEARTBEAT_INTERVAL_MS } from './config/constants.js';
import { accessibilityTogglesUI } from './utils/dom-helpers.js';
import { StorageService, Language } from './services/storage.js';
import { HeartbeatService } from './services/heartbeat.js';
import { UserSession } from './services/user-session.js';
import { ProfileManager } from './features/profile.js';
import { LanguageManager } from './features/language.js';
import { Authentication } from './features/authentication.js';
import { FriendsManager } from './features/friends-manager.js';
import { LeaderboardsManager } from './features/leaderboards-manager.js';
import { ProfileManager as UserProfileManager } from './features/profile-manager.js';
import { PongEngine } from './game/pong-engine.js';
import { routes } from './routing/routes.js';
import { Router } from './routing/router.js';
import { TokenManager } from './services/token-manager.js';

// Check for JWT migration - if user is logged in but has no JWT token, clear session
const migrationCheck = () => {
  const loggedInUser = StorageService.getLoggedInUser();
  const hasJWTToken = TokenManager.isAuthenticated();
  
  if (loggedInUser && !hasJWTToken) {
    console.log('Migrating to JWT authentication - clearing old session');
    // Clear old session data
    StorageService.setLoggedInUser(null);
    StorageService.setLoggedInUserAvatar(null);
    
    // Show migration message
    alert('Security upgrade: Please log in again to continue using the application.');
    window.location.hash = '#login';
  }
};

// Run migration check before initializing
migrationCheck();

// Initialize UserSession and expose values for backward compatibility
const loggedInUser = UserSession.getCurrentUser();
const loggedInUserAvatar = UserSession.getCurrentUserAvatar();
const currentOnlineFriendsCount = UserSession.getCurrentOnlineFriendsCount();
const currentPendingRequestsCount = UserSession.getCurrentPendingRequestsCount();
export const setLoggedInUser = UserSession.setLoggedInUser;

function render(route: string) {
  // Get fresh values from UserSession
  const currentUser = UserSession.getCurrentUser();
  const currentAvatar = UserSession.getCurrentUserAvatar();
  const onlineFriendsCount = UserSession.getCurrentOnlineFriendsCount();
  const pendingRequestsCount = UserSession.getCurrentPendingRequestsCount();
  
  Router.render(route, currentUser, currentAvatar, onlineFriendsCount, pendingRequestsCount);
  attachMenuListeners();
  attachLangListener();
  attachAccessibilityListeners();
  attachLoginListeners();
  attachUserDropdownListeners();
  attachPongListeners();
  
  // Update friends count after rendering to restore correct values
  if (currentUser) {
    setTimeout(() => FriendsManager.updateFriendsCount(), 100);
  }
  
  // Always check for page-specific listeners after rendering
  attachPageSpecificListeners(route);
}

function attachPageSpecificListeners(route: string) {
  Router.attachPageSpecificListeners(route, undefined, undefined, undefined, undefined);
}

function clearPageSpecificListeners() {
  Router.clearPageSpecificListeners();
}

function attachMenuListeners() {
  document.getElementById('start-game')?.addEventListener('click', () => {
    window.location.hash = '#pong';
  });
  document.getElementById('multiplayer')?.addEventListener('click', () => {
    window.location.hash = '#multiplayer';
  });
  document.getElementById('options')?.addEventListener('click', () => {
    window.location.hash = '#options';
  });
  document.getElementById('leaderboard')?.addEventListener('click', () => {
    window.location.hash = '#leaderboard';
  });
  document.getElementById('friends-btn')?.addEventListener('click', () => {
    window.location.hash = '#friends';
  });
  document.getElementById('login-btn')?.addEventListener('click', () => {
    window.location.hash = '#login';
  });
  document.getElementById('register-btn')?.addEventListener('click', () => {
    window.location.hash = '#register';
  });
  document.getElementById('edit-profile-btn')?.addEventListener('click', () => {
    window.location.hash = '#edit-profile';
  });
}

function attachLangListener() {
  LanguageManager.attachLangListener(() => render(window.location.hash.replace('#', '')));
}

function attachAccessibilityListeners() {
  document.getElementById('toggle-contrast')?.addEventListener('click', () => {
    document.body.classList.toggle('high-contrast');
  });
  document.getElementById('toggle-textsize')?.addEventListener('click', () => {
    document.body.classList.toggle('text-large');
  });
}

function attachLoginListeners() {
  // Initialize authentication module
  Authentication.setCallbacks({
    setLoggedInUser,
    render
  });
  Authentication.initialize();
}

function attachUserDropdownListeners() {
  const btn = document.getElementById('user-dropdown-btn');
  const menu = document.getElementById('user-dropdown-menu');
  if (!btn || !menu) return;
  let open = false;
  function openMenu() {
    if (!btn || !menu) return;
    menu.classList.remove('hidden');
    btn.setAttribute('aria-expanded', 'true');
    menu.querySelector('button')?.focus();
    open = true;
  }
  function closeMenu() {
    if (!btn || !menu) return;
    menu.classList.add('hidden');
    btn.setAttribute('aria-expanded', 'false');
    open = false;
  }
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (open) {
      closeMenu();
    } else {
      openMenu();
    }
  });
  btn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openMenu();
    }
    if (e.key === 'Escape') closeMenu();
  });
  menu.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeMenu();
      btn?.focus();
    }
  });
  document.addEventListener('click', (e) => {
    if (open && !menu?.contains(e.target as Node) && e.target !== btn) {
      closeMenu();
    }
  });
  document.getElementById('dropdown-my-profile')?.addEventListener('click', () => {
    closeMenu();
    window.location.hash = '#profile';
  });
  document.getElementById('dropdown-logout')?.addEventListener('click', () => {
    closeMenu();
    setLoggedInUser(null);
    window.location.hash = '';
    render('');
  });
}

// Make loadLeaderboards available globally
(window as any).loadLeaderboards = LeaderboardsManager.loadLeaderboards;

function attachPongListeners() {
  document.getElementById('pong')?.addEventListener('click', () => {
    window.location.hash = '#pong';
  });
  document.getElementById('back-home-pong')?.addEventListener('click', () => {
    window.location.hash = '';
  });
  const startBtn = document.getElementById('pong-start') as HTMLButtonElement | null;
  const canvas = document.getElementById('pong-canvas') as HTMLCanvasElement | null;
  const statusDiv = document.getElementById('pong-status');
  if (startBtn && canvas) {
    startBtn.addEventListener('click', () => {
      startBtn.disabled = true;
      startBtn.textContent = 'Game Running...';
      PongEngine.startGame(canvas, statusDiv);
    });
  }
}

window.addEventListener('hashchange', () => {
  const newRoute = window.location.hash.replace('#', '');
  clearPageSpecificListeners(); // Clear previous listeners
  render(newRoute);
  // Note: attachPageSpecificListeners is now called within render(), so no need to duplicate here
});

// Initialize UserSession
UserSession.initialize(render);

// Cleanup heartbeat on page unload
window.addEventListener('beforeunload', () => {
  HeartbeatService.stop();
});

// Setup heartbeat callback for updateFriendsCount
HeartbeatService.setUpdateFriendsCallback(() => FriendsManager.updateFriendsCount());

// Start heartbeat if user is already logged in
const currentUser = UserSession.getCurrentUser();
if (currentUser) {
  HeartbeatService.start(currentUser);
  // Update friends count after a short delay to ensure UI is loaded
  setTimeout(() => FriendsManager.updateFriendsCount(), 1500);
}

// Initial render
render(window.location.hash.replace('#', ''));
