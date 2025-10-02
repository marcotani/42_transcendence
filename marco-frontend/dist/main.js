import { HeartbeatService } from './services/heartbeat.js';
import { UserSession } from './services/user-session.js';
import { LanguageManager } from './features/language.js';
import { Authentication } from './features/authentication.js';
import { FriendsManager } from './features/friends-manager.js';
import { LeaderboardsManager } from './features/leaderboards-manager.js';
import { PongEngine } from './game/pong-engine.js';
import { Router } from './routing/router.js';
// Initialize UserSession and expose values for backward compatibility
const loggedInUser = UserSession.getCurrentUser();
const loggedInUserAvatar = UserSession.getCurrentUserAvatar();
const currentOnlineFriendsCount = UserSession.getCurrentOnlineFriendsCount();
const currentPendingRequestsCount = UserSession.getCurrentPendingRequestsCount();
export const setLoggedInUser = UserSession.setLoggedInUser;
function render(route) {
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
    (_b = document.getElementById('multiplayer')) === null || _b === void 0 ? void 0 : _b.addEventListener('click', () => {
        window.location.hash = '#multiplayer';
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
        document.body.classList.toggle('high-contrast');
    });
    (_b = document.getElementById('toggle-textsize')) === null || _b === void 0 ? void 0 : _b.addEventListener('click', () => {
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
    const startBtn = document.getElementById('pong-start');
    const canvas = document.getElementById('pong-canvas');
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
