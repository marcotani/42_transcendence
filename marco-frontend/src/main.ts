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
    alert(translations[LanguageManager.getLang()].securityUpgradeAlert);
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
      if (isTouch) {
        try {
          // Create a clean fullscreen wrapper so only the canvas and overlays are shown in fullscreen
          let wrapper = document.getElementById('tournament-fullscreen-wrapper') as HTMLElement | null;
          if (!wrapper) {
            wrapper = document.createElement('div');
            wrapper.id = 'tournament-fullscreen-wrapper';
            wrapper.style.position = 'fixed';
            wrapper.style.left = '0';
            wrapper.style.top = '0';
            wrapper.style.width = '100vw';
            wrapper.style.height = '100vh';
            wrapper.style.display = 'flex';
            wrapper.style.alignItems = 'center';
            wrapper.style.justifyContent = 'center';
            wrapper.style.background = '#000';
            wrapper.style.zIndex = '10000';
            wrapper.style.overflow = 'hidden';
            document.body.appendChild(wrapper);
          }

          // Record original parent and next sibling so we can restore later
          try {
            (tournamentCanvas as any)._origParent = tournamentCanvas.parentElement;
            (tournamentCanvas as any)._origNextSibling = tournamentCanvas.nextSibling;
          } catch (e) { /* ignore */ }

          // Move canvas and mobile overlay into wrapper
          try {
            wrapper.appendChild(tournamentCanvas);
            const mobileOverlay = document.getElementById('mobile-controls-overlay');
            if (mobileOverlay) wrapper.appendChild(mobileOverlay);
          } catch (e) { /* ignore */ }

          // Request fullscreen on the wrapper (clean fullscreen area)
          try {
            if (typeof (wrapper as any).requestFullscreen === 'function') await (wrapper as any).requestFullscreen();
            else if (typeof (wrapper as any).webkitRequestFullscreen === 'function') await (wrapper as any).webkitRequestFullscreen();
            else if (typeof (wrapper as any).msRequestFullscreen === 'function') await (wrapper as any).msRequestFullscreen();
          } catch (err) { console.warn('Fullscreen request failed for tournament wrapper:', err); }

          // Resize canvas to wrapper size
          try {
            tournamentCanvas.style.width = '100%';
            tournamentCanvas.style.height = '100%';
            tournamentCanvas.width = wrapper.clientWidth || window.innerWidth;
            tournamentCanvas.height = wrapper.clientHeight || window.innerHeight;
          } catch (e) { /* ignore */ }
        } catch (err) { console.warn('Error preparing tournament fullscreen wrapper:', err); }
      }
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
        errorDiv.textContent = translations[lang].userAlreadyLoggedIn;
        errorDiv.style.visibility = 'visible';
      }
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      if (response.ok) {
        const userData = await response.json();
        console.log('Player 2 login response:', userData);
        console.log('userData.user.id:', userData.user?.id);
        player2Data = { username, id: userData.user?.id };
        console.log('player2Data set to:', player2Data);
        setupGameArea('player');
        if (errorDiv) errorDiv.style.visibility = 'hidden';
      } else {
        const error = await response.json();
        if (errorDiv) {
          errorDiv.textContent = error.message || translations[lang].loginFailed;
          errorDiv.style.visibility = 'visible';
        }
      }
    } catch (error) {
      if (errorDiv) {
        errorDiv.textContent = translations[lang].networkErrorOccurred;
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
      if (player2Info) player2Info.textContent = 'AI';
      if (player2Name) player2Name.textContent = 'Computer';
      if (player2Controls) player2Controls.textContent = '';
    } else {
      const lang = LanguageManager.getLang();
      if (player2Info) player2Info.textContent = translations[lang].player2;
      if (player2Name) player2Name.textContent = player2Data?.username || 'Unknown';
      if (player2Controls) player2Controls.textContent = translations[lang].controlsArrows;
    }
  }
  
  // Start game button
  const startBtn = document.getElementById('pong-start') as HTMLButtonElement | null;
  const canvas = document.getElementById('pong-canvas') as HTMLCanvasElement | null;
  const statusDiv = document.getElementById('pong-status');
  
  // Touch detection helper (broader than user agent)
  const isTouchDevice = () => {
    try {
      return ('ontouchstart' in window) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    } catch (e) { return false; }
  };

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

  // Create a fullscreen hint overlay (will be shown on mobile until fullscreen entered)
  let fullscreenHintElem: HTMLElement | null = document.getElementById('fullscreen-hint');
  if (!fullscreenHintElem) {
    try {
      const div = document.createElement('div');
      div.id = 'fullscreen-hint';
      div.style.position = 'fixed';
      div.style.left = '0';
      div.style.top = '0';
      div.style.right = '0';
      div.style.bottom = '0';
      div.style.display = 'none';
      div.style.zIndex = '9999';
      div.style.background = 'rgba(0,0,0,0.45)';
      div.style.color = '#fff';
      div.style.alignItems = 'center';
      div.style.justifyContent = 'center';
      div.style.pointerEvents = 'auto';
      div.style.textAlign = 'center';
      div.innerHTML = `
        <div style="position: absolute; left:50%; top:50%; transform: translate(-50%,-50%);">
          <div style="font-size:18px; margin-bottom:12px;">Tocca per entrare in fullscreen</div>
          <button id='fullscreen-hint-btn' style="padding:10px 16px; background:#10B981; color:#fff; border-radius:8px; border:none; font-weight:600;">Entra</button>
        </div>
      `;
      document.body.appendChild(div);
      fullscreenHintElem = div;
    } catch (e) { fullscreenHintElem = null; }
  }

  const showFullscreenHint = () => {
    try {
      if (!fullscreenHintElem) return;
      fullscreenHintElem.style.display = 'flex';
    } catch (e) { /* ignore */ }
  };
  const hideFullscreenHint = () => {
    try {
      if (!fullscreenHintElem) return;
      fullscreenHintElem.style.display = 'none';
    } catch (e) { /* ignore */ }
  };

  // Hook the hint button to attempt fullscreen
  if (fullscreenHintElem) {
    fullscreenHintElem.addEventListener('click', async (ev) => {
      try {
        ev.preventDefault();
        ev.stopPropagation();
      } catch (e) { /* ignore */ }
      const target = canvas && canvas.parentElement ? canvas.parentElement : canvas;
      await requestElementFullscreen(target);
    });
  }

  // Hide/show on fullscreenchange
  document.addEventListener('fullscreenchange', () => {
    try {
      if (document.fullscreenElement) hideFullscreenHint();
      else hideFullscreenHint();
    } catch (e) { /* ignore */ }
  });

  if (startBtn && canvas) {
    startBtn.addEventListener('click', async () => {
      // On touch devices, request fullscreen first (best-effort) and show hint until fullscreen is active
      if (isTouchDevice()) {
        // Show the hint overlay while requesting
        showFullscreenHint();
        const target = canvas.parentElement || canvas;
        try {
          await requestElementFullscreen(target);
          // After entering fullscreen, resize canvas to fill the fullscreen element
          const fsElem = document.fullscreenElement || target;
          if (canvas && fsElem) {
            try {
              canvas.width = (fsElem as HTMLElement).clientWidth || window.innerWidth;
              canvas.height = (fsElem as HTMLElement).clientHeight || window.innerHeight;
            } catch (e) { /* ignore */ }
          }
        } catch (e) { /* ignore */ }
      }

  startBtn.disabled = true;
  const lang = LanguageManager.getLang();
  startBtn.textContent = translations[lang].gameRunning;
      // Hide the start button while the match is running so it doesn't obstruct the view
      startBtn.style.display = 'none';

      // Pass game mode and player 2 data to the engine
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
          // Also ensure mobile controls overlay (if present) is moved into the same visible container
          try {
            const mobileOverlay = document.getElementById('mobile-controls-overlay');
            if (mobileOverlay) {
              appendTarget.appendChild(mobileOverlay);
            }
          } catch (e) { /* ignore */ }
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
        // Ensure mobile overlay is back in the document body when exiting fullscreen
        try {
          const mobileOverlay = document.getElementById('mobile-controls-overlay');
          if (mobileOverlay) document.body.appendChild(mobileOverlay);
        } catch (e) { /* ignore */ }

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

  // Helper: attach a single-use handler that requests fullscreen on first tap/click for mobile
  const attachCanvasFullscreenOnTap = (c: HTMLCanvasElement | null) => {
    if (!c) return;
    try {
      const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
      if (!isTouch) return;

      const requestFS = async (elem: Element) => {
        const doc: any = document;
        try {
          if (typeof (elem as any).requestFullscreen === 'function') {
            await (elem as any).requestFullscreen();
          } else if (typeof (elem as any).webkitRequestFullscreen === 'function') {
            await (elem as any).webkitRequestFullscreen();
          } else if (typeof (elem as any).msRequestFullscreen === 'function') {
            await (elem as any).msRequestFullscreen();
          }
        } catch (err) {
          console.warn('Fullscreen request failed:', err);
        }
      };

      const handler = async (ev: Event) => {
        try {
          ev.preventDefault();
          ev.stopPropagation();
        } catch (e) { /* ignore */ }
        // Prefer fullscreen on the canvas parent to include overlays
        const targetElem = c.parentElement || c;
        await requestFS(targetElem);
        // Remove the handler after first activation
        c.removeEventListener('pointerdown', handler as any);
        c.removeEventListener('touchstart', handler as any);
        c.removeEventListener('click', handler as any);
      };

      c.addEventListener('pointerdown', handler as any, { passive: false });
      c.addEventListener('touchstart', handler as any, { passive: false });
      c.addEventListener('click', handler as any);
    } catch (e) { /* ignore */ }
  };

  // Attach fullscreen-on-tap to both canvases if present
  attachCanvasFullscreenOnTap(canvas);
  attachCanvasFullscreenOnTap(document.getElementById('mobile-pong-canvas') as HTMLCanvasElement | null);
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
