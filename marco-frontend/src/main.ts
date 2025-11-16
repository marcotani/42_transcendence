// Import extracted modules
import { translations, getT } from './config/translations.js';
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

// Make PongEngine globally available for tournament
(window as any).PongEngine = PongEngine;

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
  alert(getT(LanguageManager.getLang()).securityUpgradeAlert);
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
  attachTournamentListeners();
  
  // Update friends count after rendering to restore correct values
  if (currentUser) {
    setTimeout(() => FriendsManager.updateFriendsCount(), 100);
  }
  
  // Always check for page-specific listeners after rendering
  attachPageSpecificListeners(route);
}

function attachTournamentListeners() {
  try {
    const startTournamentBtn = document.getElementById('start-tournament-game') as HTMLButtonElement | null;
    const tournamentCanvas = document.getElementById('tournament-canvas') as HTMLCanvasElement | null;
    if (!startTournamentBtn || !tournamentCanvas) return;
    startTournamentBtn.addEventListener('click', async (ev) => {
      try { ev.preventDefault(); ev.stopPropagation(); } catch (e) { /* ignore */ }
      const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
      // No mobile-specific fullscreen wrapper: mobile tournament should behave like desktop.
      // allow original handler to run afterwards (they will start the game)
    });
  } catch (e) { /* ignore */ }
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
  document.getElementById('tournament')?.addEventListener('click', () => {
    window.location.hash = '#tournament';
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
    // Toggle high-contrast on the <html> element so the mode applies globally
    // (some user agents or components may ignore body-level changes).
    document.documentElement.classList.toggle('high-contrast');
  });
  document.getElementById('toggle-textsize')?.addEventListener('click', () => {
    // Toggle the class on the <html> element (documentElement) instead of <body>
    // so rem-based Tailwind utilities scale correctly across the app.
    document.documentElement.classList.toggle('text-large');
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
  
  // Game mode selection
  const vsAiBtn = document.getElementById('vs-ai-mode');
  const vsPlayerBtn = document.getElementById('vs-player-mode');
  const gameModeSelection = document.getElementById('game-mode-selection');
  const player2Login = document.getElementById('player2-login');
  const gameArea = document.getElementById('game-area');
  const player1Name = document.getElementById('player1-name');
  const player2Info = document.getElementById('player2-info');
  const player2Name = document.getElementById('player2-name');
  const player2Controls = document.getElementById('player2-controls');
  
  // Store game mode and player 2 info
  let gameMode: 'ai' | 'player' = 'ai';
  let player2Data: { username: string; id: number } | null = null;
  
  vsAiBtn?.addEventListener('click', () => {
    gameMode = 'ai';
    setupGameArea('ai');
  });
  
  vsPlayerBtn?.addEventListener('click', () => {
    gameMode = 'player';
    gameModeSelection?.classList.add('hidden');
    player2Login?.classList.remove('hidden');
  });
  
  // Player 2 login form
  const player2LoginForm = document.getElementById('player2-login-form');
  const cancelPlayer2Login = document.getElementById('cancel-player2-login');
  
  player2LoginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
  const lang = LanguageManager.getLang();
    const username = (document.getElementById('player2-username') as HTMLInputElement).value;
    const password = (document.getElementById('player2-password') as HTMLInputElement).value;
    const errorDiv = document.getElementById('player2-login-error');
    
    // Check if player 2 is trying to use the same account as player 1
    const currentUser = UserSession.getCurrentUser();
      if (currentUser && username === currentUser) {
      if (errorDiv) {
        errorDiv.textContent = getT(LanguageManager.getLang()).userAlreadyLoggedIn;
        errorDiv.style.visibility = 'visible';
      }
      return;
    }
    
    try {
      // First, verify credentials without side effects (no token, no online=true)
      const verifyRes = await fetch(`${API_BASE}/api/verify-credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!verifyRes.ok) {
        const err = await verifyRes.json().catch(() => ({}));
        console.warn('Player2 verify error from server:', err);
        if (errorDiv) {
          errorDiv.textContent = getT(LanguageManager.getLang()).loginFailed;
          errorDiv.style.visibility = 'visible';
        }
        return;
      }

      const verifyData = await verifyRes.json();
      if (verifyData?.requiresTwoFactor) {
        if (errorDiv) {
          errorDiv.textContent = getT(LanguageManager.getLang()).twoFactorRequired || getT(LanguageManager.getLang()).loginFailed;
          errorDiv.style.visibility = 'visible';
        }
        return;
      }

      // Fetch user info to get the numeric id (needed by match payload)
      const userRes = await fetch(`${API_BASE}/users/${encodeURIComponent(username)}`);
      if (!userRes.ok) {
        if (errorDiv) {
          errorDiv.textContent = getT(LanguageManager.getLang()).userNotFound || getT(LanguageManager.getLang()).loginFailed;
          errorDiv.style.visibility = 'visible';
        }
        return;
      }
      const userJson = await userRes.json();
      if (!userJson?.id) {
        if (errorDiv) {
          errorDiv.textContent = getT(LanguageManager.getLang()).unknownError || getT(LanguageManager.getLang()).loginFailed;
          errorDiv.style.visibility = 'visible';
        }
        return;
      }

      player2Data = { username, id: userJson.id };
      console.log('player2Data set to:', player2Data);
      setupGameArea('player');
      if (errorDiv) errorDiv.style.visibility = 'hidden';
    } catch (error) {
      if (errorDiv) {
        errorDiv.textContent = getT(LanguageManager.getLang()).networkErrorOccurred;
        errorDiv.style.visibility = 'visible';
      }
    }
  });
  
  cancelPlayer2Login?.addEventListener('click', () => {
    player2Login?.classList.add('hidden');
    gameModeSelection?.classList.remove('hidden');
    // Clear form
    (document.getElementById('player2-username') as HTMLInputElement).value = '';
    (document.getElementById('player2-password') as HTMLInputElement).value = '';
    const errorDiv = document.getElementById('player2-login-error');
    if (errorDiv) errorDiv.style.visibility = 'hidden';
  });
  
  function setupGameArea(mode: 'ai' | 'player') {
    gameModeSelection?.classList.add('hidden');
    player2Login?.classList.add('hidden');
    gameArea?.classList.remove('hidden');
    
    // Set player 1 info
    const currentUser = UserSession.getCurrentUser();
    if (player1Name) player1Name.textContent = currentUser || 'Guest';
    
    // Set player 2 info
    if (mode === 'ai') {
      if (player2Info) player2Info.textContent = getT(LanguageManager.getLang()).aiLabel || 'AI';
      if (player2Name) player2Name.textContent = 'Computer';
      if (player2Controls) player2Controls.textContent = '';
    } else {
      if (player2Info) player2Info.textContent = getT(LanguageManager.getLang()).player2 || '';
      if (player2Name) player2Name.textContent = player2Data?.username || 'Unknown';
      if (player2Controls) player2Controls.textContent = getT(LanguageManager.getLang()).controlsArrows;
    }
  }
  
  // Start game button
  const startBtn = document.getElementById('pong-start') as HTMLButtonElement | null;
  const canvas = document.getElementById('pong-canvas') as HTMLCanvasElement | null;
  const statusDiv = document.getElementById('pong-status');
  
  // Touch detection helper removed — no mobile-specific behavior

  // Fullscreen helper
  const requestElementFullscreen = async (el: Element | null) => {
    if (!el) return false;
    try {
      if (typeof (el as any).requestFullscreen === 'function') {
        await (el as any).requestFullscreen();
        return true;
      } else if (typeof (el as any).webkitRequestFullscreen === 'function') {
        await (el as any).webkitRequestFullscreen();
        return true;
      } else if (typeof (el as any).msRequestFullscreen === 'function') {
        await (el as any).msRequestFullscreen();
        return true;
      }
    } catch (err) {
      console.warn('Fullscreen request failed:', err);
    }
    return false;
  };

  // Touch / fullscreen-first behavior removed: mobile should behave like desktop.

  if (startBtn && canvas) {
    const isTouchDevice = ('ontouchstart' in window)
      || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0)
      || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);

    const ensureFullscreenLandscape = async (): Promise<void> => {
      // Solo su device touch / mobile
      if (!isTouchDevice) return;
      // Se siamo già in landscape (larghezza > altezza) prosegui subito
      if (window.innerWidth > window.innerHeight && document.fullscreenElement) return;

      // Richiedi fullscreen sul parent del canvas (o canvas) prima di avviare il gioco
      const target = canvas.parentElement || canvas;
      try {
        const req: any = (target as any).requestFullscreen || (target as any).webkitRequestFullscreen || (target as any).msRequestFullscreen;
        if (typeof req === 'function') {
          await req.call(target);
        }
      } catch (e) {
        // Ignora fallimenti: il gioco funzionerà comunque, anche se inizialmente potrà presentare stretch
      }

      // Prova lock orientamento (best effort, funziona su Android Chrome, non su iOS Safari)
      try {
        const screenAny: any = screen;
        if (screenAny?.orientation?.lock) {
          screenAny.orientation.lock('landscape').catch(() => {});
        }
      } catch (e) { /* ignore */ }

      // Attendi che le dimensioni riflettano la rotazione (fino a 30 tentativi ~300ms)
      let attempts = 0;
      await new Promise<void>((resolve) => {
        const check = () => {
          attempts++;
            if (window.innerWidth > window.innerHeight || attempts > 30) {
            // Ridimensiona canvas ai nuovi bounds
            try {
              const container = (document.fullscreenElement as HTMLElement) || (canvas.parentElement as HTMLElement) || document.body;
              const w = container.clientWidth || window.innerWidth;
              const h = container.clientHeight || window.innerHeight;
              canvas.style.width = '100%';
              canvas.style.height = '100%';
              canvas.width = w;
              canvas.height = h;
            } catch (e) { /* ignore */ }
            resolve();
          } else {
            requestAnimationFrame(check);
          }
        };
        requestAnimationFrame(check);
      });
    };

    startBtn.addEventListener('click', async () => {
      startBtn.disabled = true;
      startBtn.textContent = getT(LanguageManager.getLang()).gameRunning;
      startBtn.style.display = 'none'; // Nasconde il bottone durante la partita

      // Prima forziamo fullscreen + landscape (se mobile) così le dimensioni iniziali sono corrette
      await ensureFullscreenLandscape();

      // Pass game mode e player 2 data al motore
      const gameConfig = {
        mode: gameMode,
        player1: { username: UserSession.getCurrentUser() || 'Guest' },
        player2: gameMode === 'player' ? player2Data : null
      };

      PongEngine.startGame(canvas, statusDiv, gameConfig);
    });
  }

  // On fullscreen change, ensure canvas is resized to fullscreen element and add an exit button
  document.addEventListener('fullscreenchange', () => {
    try {
      const fs = document.fullscreenElement as HTMLElement | null;
      const target = canvas && (canvas.parentElement || canvas) as HTMLElement | null;
      const used = fs || target;
      if (used && canvas) {
        try {
          canvas.width = used.clientWidth || window.innerWidth;
          canvas.height = used.clientHeight || window.innerHeight;
        } catch (e) { /* ignore */ }
      }

      // Create or remove exit button inside fullscreen element
      const existing = document.getElementById('fullscreen-exit-btn');
      if (fs) {
        if (!existing) {
          const btn = document.createElement('button');
          btn.id = 'fullscreen-exit-btn';
          btn.textContent = '✕';
          btn.setAttribute('aria-label', 'Exit fullscreen');
          btn.style.position = 'absolute';
          btn.style.left = '50%';
          btn.style.top = '8px';
          btn.style.transform = 'translateX(-50%)';
          btn.style.zIndex = '10010';
          btn.style.background = 'rgba(255,255,255,0.9)';
          btn.style.color = '#000';
          btn.style.border = 'none';
          btn.style.borderRadius = '9999px';
          btn.style.padding = '6px 10px';
          btn.style.fontSize = '16px';
          btn.style.cursor = 'pointer';
          // If fullscreen element is a canvas, append to body instead (canvas can't reliably host HTML overlays)
          const appendTarget = (fs.tagName === 'CANVAS') ? document.body : fs;
          try { appendTarget.appendChild(btn); } catch (e) { document.body.appendChild(btn); }
          // Do not move mobile-specific overlays; treat fullscreen the same as desktop
          btn.addEventListener('click', async (ev) => {
            try { ev.preventDefault(); ev.stopPropagation(); } catch (e) { /* ignore */ }
            // Return to main page which also triggers cleanup registered on hashchange
            try { window.location.hash = ''; } catch (e) { /* ignore */ }
            try { if (typeof (document as any).exitFullscreen === 'function') await (document as any).exitFullscreen(); }
            catch (e) { /* ignore */ }
          });
        }
      } else {
        if (existing) {
          try { existing.remove(); } catch (e) { /* ignore */ }
        }
        // No mobile-specific overlay restore needed; behave like desktop

        // If we used a tournament-fullscreen-wrapper, restore the canvas to its original parent
        try {
          const wrapper = document.getElementById('tournament-fullscreen-wrapper');
          if (wrapper) {
            const tCanvas = document.getElementById('tournament-canvas') as HTMLCanvasElement | null;
            if (tCanvas) {
              const origParent = (tCanvas as any)._origParent as HTMLElement | null;
              const origNext = (tCanvas as any)._origNextSibling as ChildNode | null;
              if (origParent) {
                if (origNext && origNext.parentNode === origParent) origParent.insertBefore(tCanvas, origNext);
                else origParent.appendChild(tCanvas);
              } else {
                // fallback: append to body
                document.body.appendChild(tCanvas);
              }
              // reset inline styles that made it fullscreen
              tCanvas.style.width = '';
              tCanvas.style.height = '';
              try { delete (tCanvas as any)._origParent; delete (tCanvas as any)._origNextSibling; } catch (e) { /* ignore */ }
            }
            try { wrapper.remove(); } catch (e) { /* ignore */ }
          }
        } catch (e) { /* ignore */ }

        // Make sure body is scrollable again (some browsers may have disabled it)
        try { document.body.style.overflow = ''; } catch (e) { /* ignore */ }
      }
    } catch (e) { /* ignore */ }
  });

  // Mobile-specific fullscreen-on-tap behavior removed; mobile now behaves like desktop.
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
