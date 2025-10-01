// Import extracted modules
import { translations } from './config/translations.js';
import { API_BASE, HEARTBEAT_INTERVAL_MS } from './config/constants.js';
import { accessibilityTogglesUI } from './utils/dom-helpers.js';
import { StorageService, Language } from './services/storage.js';
import { HeartbeatService } from './services/heartbeat.js';
import { ProfileManager } from './features/profile.js';
import { LanguageManager } from './features/language.js';
import { PongEngine } from './game/pong-engine.js';
import { routes } from './routing/routes.js';
import { Router } from './routing/router.js';

let loggedInUser: string | null = StorageService.getLoggedInUser();
// Store avatar URL for logged-in user
let loggedInUserAvatar: string | null = StorageService.getLoggedInUserAvatar();

// Expose on window for other modules
(window as any).loggedInUser = loggedInUser;

// Store current friends counts to avoid flashing 0s during page navigation
let currentOnlineFriendsCount: number = StorageService.getCurrentOnlineFriendsCount();
let currentPendingRequestsCount: number = StorageService.getCurrentPendingRequestsCount();

export function setLoggedInUser(username: string | null, newAvatarUrl?: string, skipRender: boolean = false) {
  loggedInUser = username;
  (window as any).loggedInUser = username; // Keep window in sync
  if (username) {
    StorageService.setLoggedInUser(username);
    
    // Start heartbeat for logged-in user
    HeartbeatService.start(username);
    
    // Update friends count
    setTimeout(() => Router.updateFriendsCount(), 1000);
    
    // If a new avatar URL is explicitly provided, use it immediately
    if (newAvatarUrl !== undefined) {
      loggedInUserAvatar = newAvatarUrl;
      StorageService.setLoggedInUserAvatar(newAvatarUrl);
      // Update cache buster for immediate avatar refresh
      if (newAvatarUrl && newAvatarUrl.includes('/uploads/')) {
        StorageService.setAvatarCacheBuster();
      }
      // Re-render to update avatar immediately (unless skipRender is true)
      if (!skipRender) {
        render(window.location.hash.replace('#', ''));
      }
      return;
    }
    
    // Fetch avatar URL for the user with cache-busting
    const cacheBuster = Date.now();
    fetch(`${API_BASE}/users/${username}?_t=${cacheBuster}`)
      .then(res => res.json())
      .then(user => {
        const avatarUrl = user.profile?.avatarUrl || null;
        loggedInUserAvatar = avatarUrl;
        StorageService.setLoggedInUserAvatar(avatarUrl);
        // Re-render to update avatar if needed
        render(window.location.hash.replace('#', ''));
      })
      .catch(() => {
        loggedInUserAvatar = null;
        StorageService.setLoggedInUserAvatar(null);
        render(window.location.hash.replace('#', ''));
      });
  } else {
    // Stop heartbeat when logging out
    HeartbeatService.stop();
    StorageService.clearUserData();
    loggedInUserAvatar = null;
    currentOnlineFriendsCount = 0;
    currentPendingRequestsCount = 0;
  }
}

// Expose setLoggedInUser on window for other modules
(window as any).setLoggedInUser = setLoggedInUser;

function generateViewProfilePage(username: string): string {
  return Router.generateViewProfilePage(username);
}

async function loadUserProfile(username: string) {
  return Router.loadUserProfile(username);
}

function render(route: string) {
  Router.render(route, loggedInUser, loggedInUserAvatar, currentOnlineFriendsCount, currentPendingRequestsCount);
  attachMenuListeners();
  attachLangListener();
  attachAccessibilityListeners();
  attachLoginListeners();
  attachUserDropdownListeners();
  attachPongListeners();
  
  // Update friends count after rendering to restore correct values
  if (loggedInUser) {
    setTimeout(() => Router.updateFriendsCount(), 100);
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
  document.getElementById('back-home-login')?.addEventListener('click', () => {
    window.location.hash = '';
  });
  document.getElementById('back-home-edit-profile')?.addEventListener('click', () => {
    window.location.hash = '#profile';
  });
  const loginForm = document.getElementById('login-form') as HTMLFormElement | null;
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = (document.getElementById('login-username') as HTMLInputElement).value.trim();
      const password = (document.getElementById('login-password') as HTMLInputElement).value;
      const errorDiv = document.getElementById('login-error');
      if (!username || !password) {
        if (errorDiv) {
          errorDiv.textContent = 'Username and password required.';
          errorDiv.classList.remove('hidden');
        }
        return;
      }
      if (errorDiv) errorDiv.classList.add('hidden');
      try {
        const response = await fetch(`${API_BASE}/api/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        if (!response.ok) {
          if (errorDiv) {
            errorDiv.textContent = data.error || 'Authentication failed.';
            errorDiv.classList.remove('hidden');
          }
          return;
        }
        setLoggedInUser(data.user.username);
        alert('Logged in as ' + loggedInUser);
        window.location.hash = '';
        render('');
      } catch (err) {
        if (errorDiv) {
          errorDiv.textContent = 'Network error.';
          errorDiv.classList.remove('hidden');
        }
      }
    });
  }
  document.getElementById('back-home-register')?.addEventListener('click', () => {
    window.location.hash = '';
  });
  const registerForm = document.getElementById('register-form') as HTMLFormElement | null;
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = (document.getElementById('register-username') as HTMLInputElement).value.trim();
      const email = (document.getElementById('register-email') as HTMLInputElement).value.trim();
      const password = (document.getElementById('register-password') as HTMLInputElement).value;
      const errorDiv = document.getElementById('register-error');
      if (!username || !email || !password) {
        if (errorDiv) {
          errorDiv.textContent = 'Username, email and password required.';
          errorDiv.classList.remove('hidden');
        }
        return;
      }
      if (errorDiv) errorDiv.classList.add('hidden');
      try {
        const response = await fetch(`${API_BASE}/api/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email, password })
        });
        const data = await response.json();
        if (!response.ok) {
          if (errorDiv) {
            errorDiv.textContent = data.message || 'Registration failed.';
            errorDiv.classList.remove('hidden');
          }
          return;
        }
        alert('Registered as ' + username);
        window.location.hash = '';
      } catch (err) {
        if (errorDiv) {
          errorDiv.textContent = 'Network error.';
          errorDiv.classList.remove('hidden');
        }
      }
    });
  }
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

// Function to create leaderboard table HTML
async function loadLeaderboards() {
  return Router.loadLeaderboards();
}

// Make loadLeaderboards available globally
(window as any).loadLeaderboards = loadLeaderboards;

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

// Cleanup heartbeat on page unload
window.addEventListener('beforeunload', () => {
  HeartbeatService.stop();
});

// Setup heartbeat callback for updateFriendsCount
HeartbeatService.setUpdateFriendsCallback(() => Router.updateFriendsCount());

// Start heartbeat if user is already logged in
if (loggedInUser) {
  HeartbeatService.start(loggedInUser);
  // Update friends count after a short delay to ensure UI is loaded
  setTimeout(() => Router.updateFriendsCount(), 1500);
}

// Initial render
render(window.location.hash.replace('#', ''));
