var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// Import extracted modules
import { getT } from './config/translations.js';
import { API_BASE } from './config/constants.js';
import { StorageService } from './services/storage.js';
import { HeartbeatService } from './services/heartbeat.js';
import { UserSession } from './services/user-session.js';
import { LanguageManager } from './features/language.js';
import { Authentication } from './features/authentication.js';
import { FriendsManager } from './features/friends-manager.js';
import { LeaderboardsManager } from './features/leaderboards-manager.js';
import { PongEngine } from './game/pong-engine.js';
import { Router } from './routing/router.js';
import { TokenManager } from './services/token-manager.js';
// Make PongEngine globally available for tournament
window.PongEngine = PongEngine;
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
function render(route) {
    // Route guard: redirect unauthenticated users away from protected pages
    const requiresAuth = (r) => {
        if (!r)
            return false; // home
        return (r === 'profile' ||
            r === 'edit-profile' ||
            r === 'friends' ||
            r.startsWith('profile/'));
    };
    if (requiresAuth(route) && !TokenManager.isAuthenticated()) {
        // Send user back to the main page when not authenticated
        try {
            window.location.hash = '';
        }
        catch (_) { /* ignore */ }
        return;
    }
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
        const startTournamentBtn = document.getElementById('start-tournament-game');
        const tournamentCanvas = document.getElementById('tournament-canvas');
        if (!startTournamentBtn || !tournamentCanvas)
            return;
        startTournamentBtn.addEventListener('click', (ev) => __awaiter(this, void 0, void 0, function* () {
            try {
                ev.preventDefault();
                ev.stopPropagation();
            }
            catch (e) { /* ignore */ }
            const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
            // No mobile-specific fullscreen wrapper: mobile tournament should behave like desktop.
            // allow original handler to run afterwards (they will start the game)
        }));
    }
    catch (e) { /* ignore */ }
}
function attachPageSpecificListeners(route) {
    Router.attachPageSpecificListeners(route, undefined, undefined, undefined, undefined);
}
function clearPageSpecificListeners() {
    Router.clearPageSpecificListeners();
}
function attachMenuListeners() {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    (_a = document.getElementById('start-game')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', () => {
        window.location.hash = '#pong';
    });
    (_b = document.getElementById('tournament')) === null || _b === void 0 ? void 0 : _b.addEventListener('click', () => {
        window.location.hash = '#tournament';
    });
    (_c = document.getElementById('options')) === null || _c === void 0 ? void 0 : _c.addEventListener('click', () => {
        window.location.hash = '#options';
    });
    (_d = document.getElementById('leaderboard')) === null || _d === void 0 ? void 0 : _d.addEventListener('click', () => {
        window.location.hash = '#leaderboard';
    });
    (_e = document.getElementById('friends-btn')) === null || _e === void 0 ? void 0 : _e.addEventListener('click', () => {
        window.location.hash = '#friends';
    });
    (_f = document.getElementById('login-btn')) === null || _f === void 0 ? void 0 : _f.addEventListener('click', () => {
        window.location.hash = '#login';
    });
    (_g = document.getElementById('register-btn')) === null || _g === void 0 ? void 0 : _g.addEventListener('click', () => {
        window.location.hash = '#register';
    });
    (_h = document.getElementById('edit-profile-btn')) === null || _h === void 0 ? void 0 : _h.addEventListener('click', () => {
        window.location.hash = '#edit-profile';
    });
}
function attachLangListener() {
    LanguageManager.attachLangListener(() => render(window.location.hash.replace('#', '')));
}
function attachAccessibilityListeners() {
    var _a, _b;
    (_a = document.getElementById('toggle-contrast')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', () => {
        // Toggle high-contrast on the <html> element so the mode applies globally
        // (some user agents or components may ignore body-level changes).
        document.documentElement.classList.toggle('high-contrast');
    });
    (_b = document.getElementById('toggle-textsize')) === null || _b === void 0 ? void 0 : _b.addEventListener('click', () => {
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
    var _a, _b;
    const btn = document.getElementById('user-dropdown-btn');
    const menu = document.getElementById('user-dropdown-menu');
    if (!btn || !menu)
        return;
    let open = false;
    function openMenu() {
        var _a;
        if (!btn || !menu)
            return;
        menu.classList.remove('hidden');
        btn.setAttribute('aria-expanded', 'true');
        (_a = menu.querySelector('button')) === null || _a === void 0 ? void 0 : _a.focus();
        open = true;
    }
    function closeMenu() {
        if (!btn || !menu)
            return;
        menu.classList.add('hidden');
        btn.setAttribute('aria-expanded', 'false');
        open = false;
    }
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (open) {
            closeMenu();
        }
        else {
            openMenu();
        }
    });
    btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openMenu();
        }
        if (e.key === 'Escape')
            closeMenu();
    });
    menu.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeMenu();
            btn === null || btn === void 0 ? void 0 : btn.focus();
        }
    });
    document.addEventListener('click', (e) => {
        if (open && !(menu === null || menu === void 0 ? void 0 : menu.contains(e.target)) && e.target !== btn) {
            closeMenu();
        }
    });
    (_a = document.getElementById('dropdown-my-profile')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', () => {
        closeMenu();
        window.location.hash = '#profile';
    });
    (_b = document.getElementById('dropdown-logout')) === null || _b === void 0 ? void 0 : _b.addEventListener('click', () => {
        closeMenu();
        // Clear JWT token and session
        try {
            TokenManager.clearToken();
        }
        catch (e) { /* ignore */ }
        setLoggedInUser(null);
        window.location.hash = '';
        render('');
    });
}
// Make loadLeaderboards available globally
window.loadLeaderboards = LeaderboardsManager.loadLeaderboards;
function attachPongListeners() {
    var _a, _b;
    (_a = document.getElementById('pong')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', () => {
        window.location.hash = '#pong';
    });
    (_b = document.getElementById('back-home-pong')) === null || _b === void 0 ? void 0 : _b.addEventListener('click', () => {
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
    let gameMode = 'ai';
    let player2Data = null;
    vsAiBtn === null || vsAiBtn === void 0 ? void 0 : vsAiBtn.addEventListener('click', () => {
        gameMode = 'ai';
        setupGameArea('ai');
    });
    vsPlayerBtn === null || vsPlayerBtn === void 0 ? void 0 : vsPlayerBtn.addEventListener('click', () => {
        gameMode = 'player';
        gameModeSelection === null || gameModeSelection === void 0 ? void 0 : gameModeSelection.classList.add('hidden');
        player2Login === null || player2Login === void 0 ? void 0 : player2Login.classList.remove('hidden');
    });
    // Player 2 login form
    const player2LoginForm = document.getElementById('player2-login-form');
    const cancelPlayer2Login = document.getElementById('cancel-player2-login');
    player2LoginForm === null || player2LoginForm === void 0 ? void 0 : player2LoginForm.addEventListener('submit', (e) => __awaiter(this, void 0, void 0, function* () {
        e.preventDefault();
        const lang = LanguageManager.getLang();
        const username = document.getElementById('player2-username').value;
        const password = document.getElementById('player2-password').value;
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
            const verifyRes = yield fetch(`${API_BASE}/api/verify-credentials`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            if (!verifyRes.ok) {
                const err = yield verifyRes.json().catch(() => ({}));
                console.warn('Player2 verify error from server:', err);
                if (errorDiv) {
                    errorDiv.textContent = getT(LanguageManager.getLang()).loginFailed;
                    errorDiv.style.visibility = 'visible';
                }
                return;
            }
            const verifyData = yield verifyRes.json();
            if (verifyData === null || verifyData === void 0 ? void 0 : verifyData.requiresTwoFactor) {
                // Prompt for 2FA code for this specific player
                const code = yield promptTwoFactorCodeFor(username);
                if (!code || code.trim().length !== 6) {
                    if (errorDiv) {
                        errorDiv.textContent = getT(LanguageManager.getLang()).twoFactorRequired || getT(LanguageManager.getLang()).loginFailed;
                        errorDiv.style.visibility = 'visible';
                    }
                    return;
                }
                try {
                    const verify2faResp = yield fetch(`${API_BASE}/users/${encodeURIComponent(username)}/2fa/verify`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ code: code.trim() })
                    });
                    const verify2faData = yield verify2faResp.json().catch(() => ({}));
                    if (!verify2faResp.ok || !(verify2faData === null || verify2faData === void 0 ? void 0 : verify2faData.success)) {
                        if (errorDiv) {
                            const t = getT(LanguageManager.getLang());
                            errorDiv.textContent = (verify2faData === null || verify2faData === void 0 ? void 0 : verify2faData.errorCode) === 'INVALID_2FA_CODE' ? (t.invalid2FACode || t.loginFailed) : (t.twoFactorRequired || t.loginFailed);
                            errorDiv.style.visibility = 'visible';
                        }
                        return;
                    }
                    // Optional: store token for player2 if needed later
                    try {
                        window.pvpTokens = window.pvpTokens || {};
                        window.pvpTokens[username] = verify2faData.token;
                    }
                    catch (_) { /* ignore */ }
                }
                catch (err) {
                    if (errorDiv) {
                        errorDiv.textContent = getT(LanguageManager.getLang()).networkErrorTryAgain || getT(LanguageManager.getLang()).loginFailed;
                        errorDiv.style.visibility = 'visible';
                    }
                    return;
                }
            }
            // Fetch user info to get the numeric id (needed by match payload)
            const userRes = yield fetch(`${API_BASE}/users/${encodeURIComponent(username)}`);
            if (!userRes.ok) {
                if (errorDiv) {
                    errorDiv.textContent = getT(LanguageManager.getLang()).userNotFound || getT(LanguageManager.getLang()).loginFailed;
                    errorDiv.style.visibility = 'visible';
                }
                return;
            }
            const userJson = yield userRes.json();
            if (!(userJson === null || userJson === void 0 ? void 0 : userJson.id)) {
                if (errorDiv) {
                    errorDiv.textContent = getT(LanguageManager.getLang()).unknownError || getT(LanguageManager.getLang()).loginFailed;
                    errorDiv.style.visibility = 'visible';
                }
                return;
            }
            player2Data = { username, id: userJson.id };
            console.log('player2Data set to:', player2Data);
            setupGameArea('player');
            if (errorDiv)
                errorDiv.style.visibility = 'hidden';
        }
        catch (error) {
            if (errorDiv) {
                errorDiv.textContent = getT(LanguageManager.getLang()).networkErrorOccurred;
                errorDiv.style.visibility = 'visible';
            }
        }
    }));
    cancelPlayer2Login === null || cancelPlayer2Login === void 0 ? void 0 : cancelPlayer2Login.addEventListener('click', () => {
        player2Login === null || player2Login === void 0 ? void 0 : player2Login.classList.add('hidden');
        gameModeSelection === null || gameModeSelection === void 0 ? void 0 : gameModeSelection.classList.remove('hidden');
        // Clear form
        document.getElementById('player2-username').value = '';
        document.getElementById('player2-password').value = '';
        const errorDiv = document.getElementById('player2-login-error');
        if (errorDiv)
            errorDiv.style.visibility = 'hidden';
    });
    // Inline helper: prompt a labeled 2FA modal for a given username
    function promptTwoFactorCodeFor(username) {
        return new Promise((resolve) => {
            const t = getT(LanguageManager.getLang());
            const modal = document.createElement('div');
            modal.id = 'twofa-player2-modal';
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4" style="color:#374151 !important;">
          <h2 class="text-xl font-bold mb-2" style="color:#1f2937 !important;">${t.twoFactorTitle}</h2>
          <p class="text-sm text-gray-600 mb-4" style="color:#4b5563 !important;">Enter the 6-digit code for <strong>${username}</strong></p>
          <form id="twofa-player2-form" class="space-y-3">
            <input id="twofa-player2-code" type="text" maxlength="6" pattern="[0-9]{6}"
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-center text-lg tracking-widest"
              style="color:#1f2937 !important; background-color:#ffffff !important;" placeholder="000000" required />
            <div id="twofa-player2-error" class="hidden text-red-600 text-sm"></div>
            <div class="flex space-x-3">
              <button type="submit" class="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">${t.verifyButton || 'Verify'}</button>
              <button type="button" id="twofa-player2-cancel" class="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400">${t.cancelButton || 'Cancel'}</button>
            </div>
          </form>
        </div>`;
            document.body.appendChild(modal);
            const form = modal.querySelector('#twofa-player2-form');
            const codeInput = modal.querySelector('#twofa-player2-code');
            const cancelBtn = modal.querySelector('#twofa-player2-cancel');
            const errorDiv = modal.querySelector('#twofa-player2-error');
            const close = () => modal.remove();
            codeInput.addEventListener('input', () => { codeInput.value = codeInput.value.replace(/\D/g, ''); });
            cancelBtn.addEventListener('click', () => { close(); resolve(null); });
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                if (codeInput.value.trim().length !== 6) {
                    errorDiv.textContent = t.enter6DigitCode;
                    errorDiv.classList.remove('hidden');
                    return;
                }
                const code = codeInput.value.trim();
                close();
                resolve(code);
            });
            codeInput.focus();
        });
    }
    function setupGameArea(mode) {
        gameModeSelection === null || gameModeSelection === void 0 ? void 0 : gameModeSelection.classList.add('hidden');
        player2Login === null || player2Login === void 0 ? void 0 : player2Login.classList.add('hidden');
        gameArea === null || gameArea === void 0 ? void 0 : gameArea.classList.remove('hidden');
        // Set player 1 info
        const currentUser = UserSession.getCurrentUser();
        if (player1Name)
            player1Name.textContent = currentUser || 'Guest';
        // Set player 2 info
        if (mode === 'ai') {
            if (player2Info)
                player2Info.textContent = getT(LanguageManager.getLang()).aiLabel || 'AI';
            if (player2Name)
                player2Name.textContent = 'Computer';
            if (player2Controls)
                player2Controls.textContent = '';
        }
        else {
            if (player2Info)
                player2Info.textContent = getT(LanguageManager.getLang()).player2 || '';
            if (player2Name)
                player2Name.textContent = (player2Data === null || player2Data === void 0 ? void 0 : player2Data.username) || 'Unknown';
            if (player2Controls)
                player2Controls.textContent = getT(LanguageManager.getLang()).controlsArrows;
        }
    }
    // Start game button
    const startBtn = document.getElementById('pong-start');
    const canvas = document.getElementById('pong-canvas');
    const statusDiv = document.getElementById('pong-status');
    // Touch detection helper removed — no mobile-specific behavior
    // Fullscreen helper
    const requestElementFullscreen = (el) => __awaiter(this, void 0, void 0, function* () {
        if (!el)
            return false;
        try {
            if (typeof el.requestFullscreen === 'function') {
                yield el.requestFullscreen();
                return true;
            }
            else if (typeof el.webkitRequestFullscreen === 'function') {
                yield el.webkitRequestFullscreen();
                return true;
            }
            else if (typeof el.msRequestFullscreen === 'function') {
                yield el.msRequestFullscreen();
                return true;
            }
        }
        catch (err) {
            console.warn('Fullscreen request failed:', err);
        }
        return false;
    });
    // Touch / fullscreen-first behavior removed: mobile should behave like desktop.
    if (startBtn && canvas) {
        const isTouchDevice = ('ontouchstart' in window)
            || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0)
            || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
        const ensureFullscreenLandscape = () => __awaiter(this, void 0, void 0, function* () {
            var _a;
            // Solo su device touch / mobile
            if (!isTouchDevice)
                return;
            // Se siamo già in landscape (larghezza > altezza) prosegui subito
            if (window.innerWidth > window.innerHeight && document.fullscreenElement)
                return;
            // Richiedi fullscreen sul parent del canvas (o canvas) prima di avviare il gioco
            const target = canvas.parentElement || canvas;
            try {
                const req = target.requestFullscreen || target.webkitRequestFullscreen || target.msRequestFullscreen;
                if (typeof req === 'function') {
                    yield req.call(target);
                }
            }
            catch (e) {
                // Ignora fallimenti: il gioco funzionerà comunque, anche se inizialmente potrà presentare stretch
            }
            // Prova lock orientamento (best effort, funziona su Android Chrome, non su iOS Safari)
            try {
                const screenAny = screen;
                if ((_a = screenAny === null || screenAny === void 0 ? void 0 : screenAny.orientation) === null || _a === void 0 ? void 0 : _a.lock) {
                    screenAny.orientation.lock('landscape').catch(() => { });
                }
            }
            catch (e) { /* ignore */ }
            // Attendi che le dimensioni riflettano la rotazione (fino a 30 tentativi ~300ms)
            let attempts = 0;
            yield new Promise((resolve) => {
                const check = () => {
                    attempts++;
                    if (window.innerWidth > window.innerHeight || attempts > 30) {
                        // Ridimensiona canvas ai nuovi bounds
                        try {
                            const container = document.fullscreenElement || canvas.parentElement || document.body;
                            const w = container.clientWidth || window.innerWidth;
                            const h = container.clientHeight || window.innerHeight;
                            canvas.style.width = '100%';
                            canvas.style.height = '100%';
                            canvas.width = w;
                            canvas.height = h;
                        }
                        catch (e) { /* ignore */ }
                        resolve();
                    }
                    else {
                        requestAnimationFrame(check);
                    }
                };
                requestAnimationFrame(check);
            });
        });
        startBtn.addEventListener('click', () => __awaiter(this, void 0, void 0, function* () {
            startBtn.disabled = true;
            startBtn.textContent = getT(LanguageManager.getLang()).gameRunning;
            startBtn.style.display = 'none'; // Nasconde il bottone durante la partita
            // Prima forziamo fullscreen + landscape (se mobile) così le dimensioni iniziali sono corrette
            yield ensureFullscreenLandscape();
            // Pass game mode e player 2 data al motore
            const gameConfig = {
                mode: gameMode,
                player1: { username: UserSession.getCurrentUser() || 'Guest' },
                player2: gameMode === 'player' ? player2Data : null
            };
            PongEngine.startGame(canvas, statusDiv, gameConfig);
        }));
    }
    // On fullscreen change, ensure canvas is resized to fullscreen element and add an exit button
    document.addEventListener('fullscreenchange', () => {
        try {
            const fs = document.fullscreenElement;
            const target = canvas && (canvas.parentElement || canvas);
            const used = fs || target;
            if (used && canvas) {
                try {
                    canvas.width = used.clientWidth || window.innerWidth;
                    canvas.height = used.clientHeight || window.innerHeight;
                }
                catch (e) { /* ignore */ }
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
                    try {
                        appendTarget.appendChild(btn);
                    }
                    catch (e) {
                        document.body.appendChild(btn);
                    }
                    // Do not move mobile-specific overlays; treat fullscreen the same as desktop
                    btn.addEventListener('click', (ev) => __awaiter(this, void 0, void 0, function* () {
                        try {
                            ev.preventDefault();
                            ev.stopPropagation();
                        }
                        catch (e) { /* ignore */ }
                        // Return to main page which also triggers cleanup registered on hashchange
                        try {
                            window.location.hash = '';
                        }
                        catch (e) { /* ignore */ }
                        try {
                            if (typeof document.exitFullscreen === 'function')
                                yield document.exitFullscreen();
                        }
                        catch (e) { /* ignore */ }
                    }));
                }
            }
            else {
                if (existing) {
                    try {
                        existing.remove();
                    }
                    catch (e) { /* ignore */ }
                }
                // No mobile-specific overlay restore needed; behave like desktop
                // If we used a tournament-fullscreen-wrapper, restore the canvas to its original parent
                try {
                    const wrapper = document.getElementById('tournament-fullscreen-wrapper');
                    if (wrapper) {
                        const tCanvas = document.getElementById('tournament-canvas');
                        if (tCanvas) {
                            const origParent = tCanvas._origParent;
                            const origNext = tCanvas._origNextSibling;
                            if (origParent) {
                                if (origNext && origNext.parentNode === origParent)
                                    origParent.insertBefore(tCanvas, origNext);
                                else
                                    origParent.appendChild(tCanvas);
                            }
                            else {
                                // fallback: append to body
                                document.body.appendChild(tCanvas);
                            }
                            // reset inline styles that made it fullscreen
                            tCanvas.style.width = '';
                            tCanvas.style.height = '';
                            try {
                                delete tCanvas._origParent;
                                delete tCanvas._origNextSibling;
                            }
                            catch (e) { /* ignore */ }
                        }
                        try {
                            wrapper.remove();
                        }
                        catch (e) { /* ignore */ }
                    }
                }
                catch (e) { /* ignore */ }
                // Make sure body is scrollable again (some browsers may have disabled it)
                try {
                    document.body.style.overflow = '';
                }
                catch (e) { /* ignore */ }
            }
        }
        catch (e) { /* ignore */ }
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
