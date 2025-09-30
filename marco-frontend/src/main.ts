// Multilanguage translations
const translations: Record<'en'|'it'|'fr', {
  title: string;
  login: string;
  startGame: string;
  multiplayer: string;
  options: string;
  leaderboard: string;
  startGameTitle: string;
  startGameDesc: string;
  multiplayerTitle: string;
  multiplayerDesc: string;
  optionsTitle: string;
  optionsDesc: string;
  leaderboardTitle: string;
  leaderboardDesc: string;
  langLabel: string;
}> = {
  en: {
    title: "Pong Game",
    login: "Login",
    startGame: "Start Game",
    multiplayer: "Multiplayer",
    options: "Options",
    leaderboard: "Leaderboard",
    startGameTitle: "Start Game",
    startGameDesc: "Game setup will go here.",
    multiplayerTitle: "Multiplayer",
    multiplayerDesc: "Multiplayer options will go here.",
    optionsTitle: "Options",
    optionsDesc: "Settings will go here.",
    leaderboardTitle: "Leaderboard",
    leaderboardDesc: "Leaderboard stats will go here.",
    langLabel: "Language"
  },
  it: {
    title: "Gioco Pong",
    login: "Accedi",
    startGame: "Inizia Gioco",
    multiplayer: "Multigiocatore",
    options: "Opzioni",
    leaderboard: "Classifica",
    startGameTitle: "Inizia Gioco",
    startGameDesc: "La configurazione del gioco sarà qui.",
    multiplayerTitle: "Multigiocatore",
    multiplayerDesc: "Le opzioni multigiocatore saranno qui.",
    optionsTitle: "Opzioni",
    optionsDesc: "Le impostazioni saranno qui.",
    leaderboardTitle: "Classifica",
    leaderboardDesc: "Le statistiche della classifica saranno qui.",
    langLabel: "Lingua"
  },
  fr: {
    title: "Jeu Pong",
    login: "Connexion",
    startGame: "Démarrer le jeu",
    multiplayer: "Multijoueur",
    options: "Options",
    leaderboard: "Classement",
    startGameTitle: "Démarrer le jeu",
    startGameDesc: "La configuration du jeu sera ici.",
    multiplayerTitle: "Multijoueur",
    multiplayerDesc: "Les options multijoueur seront ici.",
    optionsTitle: "Options",
    optionsDesc: "Les paramètres seront ici.",
    leaderboardTitle: "Classement",
    leaderboardDesc: "Les statistiques du classement seront ici.",
    langLabel: "Langue"
  }
};

const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:3000'
  : (window.location.hostname === 'host.docker.internal' || window.location.hostname === '0.0.0.0')
    ? 'http://host.docker.internal:3000'
    : 'http://backend:3000';

function getLang(): 'en'|'it'|'fr' {
  const lang = localStorage.getItem('lang');
  if (lang === 'it' || lang === 'fr') return lang;
  return 'en';
}

function setLang(lang: 'en'|'it'|'fr') {
  localStorage.setItem('lang', lang);
  render(window.location.hash.replace('#', ''));
}

function langSwitcherUI(currentLang: 'en'|'it'|'fr') {
  return `<div class='fixed top-4 left-4 z-50'>
    <label for='lang-select' class='mr-2'>${translations[currentLang].langLabel}:</label>
    <select id='lang-select' class='px-2 py-1 rounded bg-gray-800 text-white border border-gray-600'>
      <option value='en' ${currentLang === 'en' ? 'selected' : ''}>English</option>
      <option value='it' ${currentLang === 'it' ? 'selected' : ''}>Italiano</option>
      <option value='fr' ${currentLang === 'fr' ? 'selected' : ''}>Français</option>
    </select>
  </div>`;
}

function accessibilityTogglesUI() {
  return `<div class='fixed bottom-4 left-4 z-50 flex space-x-2'>
    <button id='toggle-contrast' class='px-2 py-1 bg-black text-white rounded border border-white focus:outline-none focus:ring-2 focus:ring-white' aria-label='Toggle high contrast' tabindex='0'>🌓</button>
    <button id='toggle-textsize' class='px-2 py-1 bg-black text-white rounded border border-white focus:outline-none focus:ring-2 focus:ring-white' aria-label='Toggle large text' tabindex='0'>A+</button>
  </div>`;
}

// SPA navigation logic
const routes: { [key: string]: string } = {
  'home': `<h1 class="text-4xl font-bold mb-4">Pong Game</h1>
  <div class="flex flex-col items-center justify-center space-y-4 mt-8">
    <button class="w-48 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-green-400" id="start-game">Start Game</button>
    <button class="w-48 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-yellow-400" id="multiplayer">Multiplayer</button>
    <button class="w-48 px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded focus:outline-none focus:ring-2 focus:ring-gray-400" id="options">Options</button>
    <button class="w-48 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-purple-400" id="leaderboard">Leaderboard</button>
    <div class="flex space-x-4 mt-8">
      <button class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded focus:outline-none focus:ring-4 focus:ring-blue-400" id="login-btn">Login</button>
      <button class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded focus:outline-none focus:ring-4 focus:ring-green-400" id="register-btn">Register</button>
    </div>
  </div>`,
  'multiplayer': `<h2 class="text-2xl font-bold mb-4">Multiplayer</h2><p>Multiplayer options will go here.</p>`,
  'options': `
    <h2 class="text-2xl font-bold mb-4">Options</h2>
    <div style="max-width: 600px; margin: 0 auto; background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; color: white;">
      <div style="margin-bottom: 20px;">
        <label for="ball-speed" style="display: block; margin-bottom: 5px;">Ball Speed:</label>
        <input type="range" id="ball-speed" min="1" max="10" value="3" style="width: 100%; margin-bottom: 5px;">
        <span id="ball-speed-value" style="font-size: 14px; color: #ccc;">3</span>
      </div>
      <div style="margin-bottom: 20px;">
        <label for="paddle-speed" style="display: block; margin-bottom: 5px;">Paddle Speed:</label>
        <input type="range" id="paddle-speed" min="1" max="10" value="5" style="width: 100%; margin-bottom: 5px;">
        <span id="paddle-speed-value" style="font-size: 14px; color: #ccc;">5</span>
      </div>
      <div style="margin-bottom: 20px;">
        <label for="points-to-win" style="display: block; margin-bottom: 5px;">Points to Win:</label>
        <select id="points-to-win" style="width: 100%; padding: 5px; border-radius: 5px; background: #333; color: white; border: 1px solid #555;">
          <option value="3">3 Points</option>
          <option value="5">5 Points</option>
          <option value="11" selected>11 Points</option>
          <option value="21">21 Points</option>
        </select>
      </div>
      <button id="save-options" style="width: 100%; padding: 10px; background: #007acc; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">Save Settings</button>
      <div id="save-status" style="margin-top: 10px; text-align: center; font-size: 14px; color: #4CAF50;"></div>
    </div>
  `,
  'login': `<div class='max-w-md mx-auto mt-16 p-8 bg-gray-900 rounded-lg shadow-lg'>
    <h2 class='text-2xl font-bold mb-6 text-center' tabindex='0'>Login</h2>
    <form id='login-form' class='space-y-4'>
      <div>
        <label for='login-username' class='block mb-1'>Username</label>
        <input type='text' id='login-username' name='username' class='w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400' required autocomplete='username' />
      </div>
      <div>
        <label for='login-password' class='block mb-1'>Password</label>
        <input type='password' id='login-password' name='password' class='w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400' required autocomplete='current-password' />
      </div>
      <button type='submit' class='w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded focus:outline-none focus:ring-4 focus:ring-blue-400'>Login</button>
      <div id='login-error' class='text-red-500 mt-2 hidden'></div>
    </form>
    <button id='back-home-login' class='mt-6 w-full px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded focus:outline-none focus:ring-4 focus:ring-gray-400'>Back to Home</button>
  </div>`,
  'register': `<div class='max-w-md mx-auto mt-16 p-8 bg-gray-900 rounded-lg shadow-lg'>
    <h2 class='text-2xl font-bold mb-6 text-center' tabindex='0'>Register</h2>
    <form id='register-form' class='space-y-4'>
      <div>
        <label for='register-username' class='block mb-1'>Username</label>
        <input type='text' id='register-username' name='username' class='w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-400' required autocomplete='username' />
      </div>
      <div>
        <label for='register-email' class='block mb-1'>Email</label>
        <input type='email' id='register-email' name='email' class='w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-400' required autocomplete='email' />
      </div>
      <div>
        <label for='register-password' class='block mb-1'>Password</label>
        <input type='password' id='register-password' name='password' class='w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-400' required autocomplete='new-password' />
      </div>
      <div class='flex items-start mb-2'>
        <input id='register-gdpr' name='gdpr' type='checkbox' class='mt-1 mr-2' required />
        <label for='register-gdpr' class='text-sm text-gray-300'>I have read and accept the <a href="/public/static/GDPR_Compliance.pdf" target="_blank" class="underline text-blue-400 hover:text-blue-600">privacy policy</a>.</label>
      </div>
      <button type='submit' class='w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded focus:outline-none focus:ring-4 focus:ring-green-400'>Register</button>
      <div id='register-error' class='text-red-500 mt-2 hidden'></div>
    </form>
    <button id='back-home-register' class='mt-6 w-full px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded focus:outline-none focus:ring-4 focus:ring-gray-400'>Back to Home</button>
  </div>`,
  'pong': `<div class='flex flex-col items-center justify-center min-h-screen'>
    <h2 class='text-3xl font-bold mb-6'>Pong Game</h2>
    <div class='bg-gray-800 rounded-lg shadow-lg p-4 flex flex-col items-center'>
      <canvas id='pong-canvas' width='600' height='400' class='bg-black rounded mb-4'></canvas>
      <button id='pong-start' class='px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded focus:outline-none focus:ring-4 focus:ring-green-400 mb-2'>Start Game</button>
      <div id='pong-status' class='text-white mt-2'></div>
    </div>
    <button id='back-home-pong' class='mt-8 px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded focus:outline-none focus:ring-4 focus:ring-gray-400'>Back to Home</button>
  </div>`,
  'friends': `<div class='max-w-4xl mx-auto mt-8 p-6 bg-gray-900 rounded-lg shadow-lg'>
    <h2 class='text-3xl font-bold mb-6 text-center'>Friends</h2>
    
    <!-- Send Friend Request Section -->
    <div class='mb-8 p-4 bg-gray-800 rounded-lg'>
      <h3 class='text-xl font-semibold mb-4'>Send Friend Request</h3>
      <form id='send-friend-request-form' class='flex space-x-2'>
        <input type='text' id='friend-username' placeholder='Enter username' class='flex-1 px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-400' required />
        <button type='submit' class='px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded focus:outline-none focus:ring-4 focus:ring-purple-400'>Send Request</button>
      </form>
      <div id='send-request-status' class='mt-2 text-sm'></div>
    </div>

    <!-- Pending Friend Requests Section -->
    <div class='mb-8 p-4 bg-gray-800 rounded-lg'>
      <h3 class='text-xl font-semibold mb-4'>Pending Requests</h3>
      <div id='pending-requests'>
        <div class='text-center py-4'>
          <div class='inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-white'></div>
          <p class='mt-2 text-gray-400'>Loading requests...</p>
        </div>
      </div>
    </div>

    <!-- Friends List Section -->
    <div class='p-4 bg-gray-800 rounded-lg'>
      <h3 class='text-xl font-semibold mb-4'>Your Friends</h3>
      <div id='friends-list'>
        <div class='text-center py-4'>
          <div class='inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-white'></div>
          <p class='mt-2 text-gray-400'>Loading friends...</p>
        </div>
      </div>
    </div>

    <button id='back-home-friends' class='mt-6 w-full px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded focus:outline-none focus:ring-4 focus:ring-gray-400'>Back to Home</button>
  </div>`,
  'edit-profile': `<div class='max-w-md mx-auto mt-16 p-8 bg-gray-900 rounded-lg shadow-lg'>
    <h2 class='text-2xl font-bold mb-6 text-center' tabindex='0'>Edit Profile</h2>
  <form id='edit-profile-form' class='space-y-4' method='POST' enctype='multipart/form-data'>
      <div>
        <label for='edit-avatar' class='block mb-1'>Avatar Image</label>
        <input type='file' id='edit-avatar' name='avatar' accept='image/png,image/jpeg,image/webp' class='w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-400' />
        <div id='edit-avatar-preview' class='mt-2'></div>
      </div>
      <div>
        <label for='edit-alias' class='block mb-1'>Alias (Display Name)</label>
        <input type='text' id='edit-alias' name='alias' class='w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-400' required />
      </div>
      <div>
        <label for='edit-username' class='block mb-1'>Username</label>
        <input type='text' id='edit-username' name='username' class='w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-400' required />
      </div>
      <div>
        <label for='edit-email' class='block mb-1'>Email</label>
        <input type='email' id='edit-email' name='email' class='w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-400' required />
      </div>
      <div class='flex items-center space-x-2'>
        <input type='checkbox' id='edit-email-visible' name='emailVisible' class='rounded bg-gray-800 border border-gray-700 text-green-600 focus:outline-none focus:ring-2 focus:ring-green-400' />
        <label for='edit-email-visible' class='text-gray-300'>Show email publicly</label>
      </div>
      <div>
        <label for='edit-bio' class='block mb-1'>Biography</label>
        <textarea id='edit-bio' name='bio' rows='3' class='w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-400'></textarea>
      </div>
      <div>
        <label for='edit-password' class='block mb-1'>New Password</label>
        <input type='password' id='edit-password' name='password' class='w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-400' autocomplete='new-password' />
      </div>
      <div>
        <label for='edit-current-password' class='block mb-1'>Current Password <span class='text-yellow-500'>*</span> <small class='text-gray-400'>(Required only for username, email and password changes)</small></label>
        <input type='password' id='edit-current-password' name='currentPassword' class='w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-400' autocomplete='current-password' />
      </div>
      <button type='submit' id='edit-profile-submit' class='w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded focus:outline-none focus:ring-4 focus:ring-green-400 disabled:opacity-50 disabled:cursor-not-allowed'>Loading...</button>
      <div id='edit-profile-error' class='text-red-500 mt-2 hidden'></div>
      <div id='edit-profile-success' class='text-green-500 mt-2 hidden'></div>
    </form>
    <button id='back-home-edit-profile' class='mt-6 w-full px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded focus:outline-none focus:ring-4 focus:ring-gray-400'>Back to Home</button>
  </div>`,

  // Profile page for logged-in user
  'profile': `<div class='max-w-md mx-auto mt-16 p-8 bg-gray-900 rounded-lg shadow-lg' id='profile-page'>
    <div class='flex flex-col items-center'>
      <div id='profile-avatar' class='mb-4'></div>
      <div class='text-2xl font-bold mb-2' id='profile-alias'></div>
      <div class='text-gray-400 mb-2' id='profile-username'></div>
      <div class='text-gray-400 mb-4' id='profile-email'></div>
      <div class='text-base text-white mb-6' id='profile-bio'></div>
      <div id='profile-stats-counters' class='w-full mb-6'></div>
      <div id='profile-match-history' class='w-full mb-6'></div>
  <div class='w-full mb-6' id='profile-skinColor-container'>
        <label for='profile-skinColor' class='block mb-1'>Paddle Color</label>
        <select id='profile-skinColor' name='skinColor' class='w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400'>
          <option value="#FF0000" style="color:#FF0000">Red</option>
          <option value="#00FF00" style="color:#00FF00">Green</option>
          <option value="#0000FF" style="color:#0000FF">Blue</option>
          <option value="#FFFF00" style="color:#FFFF00">Yellow</option>
          <option value="#FF00FF" style="color:#FF00FF">Magenta</option>
          <option value="#FFFFFF" style="color:#FFFFFF">White</option>
        </select>
        <button id='profile-skinColor-confirm' class='mt-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-green-400'>Confirm Color</button>
        <div id='profile-skinColor-success' class='text-green-500 mt-2 hidden'></div>
        <div id='profile-skinColor-error' class='text-red-500 mt-2 hidden'></div>
      </div>
      <button id='edit-profile-btn' class='w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded focus:outline-none focus:ring-4 focus:ring-green-400 mb-2'>Edit Profile Information</button>
      <a href="/public/static/GDPR_Compliance.pdf" target="_blank" class="w-full block mb-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded focus:outline-none focus:ring-4 focus:ring-blue-400 text-center">View Privacy Policy</a>
      <button id='delete-profile-btn' class='w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded focus:outline-none focus:ring-4 focus:ring-red-400 mb-2'>Delete Profile</button>
      <div id='delete-profile-error' class='text-red-500 mb-2 hidden'></div>
      <button id='back-home-profile' class='mt-2 w-full px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded focus:outline-none focus:ring-4 focus:ring-gray-400'>Back to Home</button>
    </div>
  </div>`
};

let loggedInUser: string | null = localStorage.getItem('loggedInUser');
// Store avatar URL for logged-in user
let loggedInUserAvatar: string | null = localStorage.getItem('loggedInUserAvatar');

// Store current friends counts to avoid flashing 0s during page navigation
let currentOnlineFriendsCount: number = parseInt(localStorage.getItem('currentOnlineFriendsCount') || '0');
let currentPendingRequestsCount: number = parseInt(localStorage.getItem('currentPendingRequestsCount') || '0');

function setLoggedInUser(username: string | null, newAvatarUrl?: string, skipRender: boolean = false) {
  loggedInUser = username;
  if (username) {
    localStorage.setItem('loggedInUser', username);
    
    // Start heartbeat for logged-in user
    startHeartbeat();
    
    // Update friends count
    setTimeout(() => updateFriendsCount(), 1000);
    
    // If a new avatar URL is explicitly provided, use it immediately
    if (newAvatarUrl !== undefined) {
      loggedInUserAvatar = newAvatarUrl;
      localStorage.setItem('loggedInUserAvatar', newAvatarUrl || '');
      // Update cache buster for immediate avatar refresh
      if (newAvatarUrl && newAvatarUrl.includes('/uploads/')) {
        localStorage.setItem('avatarCacheBuster', Date.now().toString());
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
        localStorage.setItem('loggedInUserAvatar', avatarUrl || '');
        // Re-render to update avatar if needed
        render(window.location.hash.replace('#', ''));
      })
      .catch(() => {
        loggedInUserAvatar = null;
        localStorage.removeItem('loggedInUserAvatar');
        render(window.location.hash.replace('#', ''));
      });
  } else {
    // Stop heartbeat when logging out
    stopHeartbeat();
    localStorage.removeItem('loggedInUser');
    localStorage.removeItem('loggedInUserAvatar');
    localStorage.removeItem('currentOnlineFriendsCount');
    localStorage.removeItem('currentPendingRequestsCount');
    loggedInUserAvatar = null;
    currentOnlineFriendsCount = 0;
    currentPendingRequestsCount = 0;
  }
}

// Heartbeat functionality for tracking online status
let heartbeatInterval: number | null = null;
const HEARTBEAT_INTERVAL_MS = 30000; // 30 seconds

async function sendHeartbeat() {
  if (!loggedInUser) return;
  
  try {
    // First get the user ID
    const userRes = await fetch(`${API_BASE}/users/${loggedInUser}`);
    const user = await userRes.json();
    if (!user || !user.id) return;
    
    // Send heartbeat
    await fetch(`${API_BASE}/api/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id })
    });
    
    // Update friends count to keep the button updated across all pages
    updateFriendsCount();
  } catch (error) {
    console.error('Failed to send heartbeat:', error);
  }
}

function startHeartbeat() {
  if (heartbeatInterval) return; // Already running
  
  if (loggedInUser) {
    // Send initial heartbeat immediately
    sendHeartbeat();
    
    // Set up periodic heartbeat
    heartbeatInterval = window.setInterval(() => {
      sendHeartbeat();
    }, HEARTBEAT_INTERVAL_MS);
  }
}

function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

// Game settings functions
interface GameSettings {
  ballSpeed: number;
  paddleSpeed: number;
  pointsToWin: number;
}

function getDefaultGameSettings(): GameSettings {
  return {
    ballSpeed: 3,
    paddleSpeed: 5,
    pointsToWin: 11
  };
}

function saveGameSettings(settings: GameSettings): void {
  localStorage.setItem('pong-game-settings', JSON.stringify(settings));
}

function loadGameSettings(): GameSettings {
  const saved = localStorage.getItem('pong-game-settings');
  if (saved) {
    try {
      return { ...getDefaultGameSettings(), ...JSON.parse(saved) };
    } catch {
      return getDefaultGameSettings();
    }
  }
  return getDefaultGameSettings();
}

function initializeOptionsPage(): void {
  const settings = loadGameSettings();
  
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
      
      saveGameSettings(newSettings);
      
      if (saveStatus) {
        saveStatus.textContent = 'Settings saved successfully!';
        setTimeout(() => {
          saveStatus.textContent = '';
        }, 3000);
      }
    });
  }
}

// Friends page functionality
async function initializeFriendsPage() {
  if (!loggedInUser) return;

  // Load initial data
  loadPendingRequests();
  loadFriendsList();
  updateFriendsCount();

  // Set up form listeners
  const sendRequestForm = document.getElementById('send-friend-request-form') as HTMLFormElement;
  const backButton = document.getElementById('back-home-friends') as HTMLButtonElement;

  if (sendRequestForm) {
    sendRequestForm.addEventListener('submit', handleSendFriendRequest);
  }

  if (backButton) {
    backButton.addEventListener('click', () => {
      window.location.hash = '';
    });
  }
}

async function handleSendFriendRequest(e: Event) {
  e.preventDefault();
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
      loadPendingRequests(); // Refresh pending requests
    } else {
      showStatus(statusDiv, result.error || 'Failed to send friend request', 'error');
    }
  } catch (error) {
    showStatus(statusDiv, 'Error sending friend request', 'error');
    console.error('Error:', error);
  }
}

async function loadPendingRequests() {
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

async function loadFriendsList() {
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

async function acceptFriendRequest(requestId: number) {
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
      loadPendingRequests(); // Refresh pending requests
      loadFriendsList(); // Refresh friends list
      updateFriendsCount(); // Update friends count
    } else {
      const error = await response.json();
      alert(error.error || 'Failed to accept friend request');
    }
  } catch (error) {
    console.error('Error accepting friend request:', error);
    alert('Error accepting friend request');
  }
}

async function rejectFriendRequest(requestId: number) {
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
      loadPendingRequests(); // Refresh pending requests
      updateFriendsCount(); // Update friends count
    } else {
      const error = await response.json();
      alert(error.error || 'Failed to reject friend request');
    }
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    alert('Error rejecting friend request');
  }
}

async function cancelFriendRequest(requestId: number) {
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
      loadPendingRequests(); // Refresh pending requests
      updateFriendsCount(); // Update friends count
    } else {
      const error = await response.json();
      alert(error.error || 'Failed to cancel friend request');
    }
  } catch (error) {
    console.error('Error canceling friend request:', error);
    alert('Error canceling friend request');
  }
}

async function removeFriend(friendUsername: string) {
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
      loadFriendsList(); // Refresh friends list
      updateFriendsCount(); // Update friends count
    } else {
      const error = await response.json();
      alert(error.error || 'Failed to remove friend');
    }
  } catch (error) {
    console.error('Error removing friend:', error);
    alert('Error removing friend');
  }
}

function viewProfile(username: string) {
  window.location.hash = `#profile/${username}`;
}

async function updateFriendsCount() {
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
      
      // Store the counts in global variables and localStorage to avoid flashing 0s
      currentOnlineFriendsCount = onlineFriendsCount;
      currentPendingRequestsCount = pendingCount;
      localStorage.setItem('currentOnlineFriendsCount', onlineFriendsCount.toString());
      localStorage.setItem('currentPendingRequestsCount', pendingCount.toString());
      
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

function showStatus(element: HTMLElement, message: string, type: 'success' | 'error') {
  element.textContent = message;
  element.className = type === 'success' ? 'mt-2 text-sm text-green-400' : 'mt-2 text-sm text-red-400';
  setTimeout(() => {
    element.textContent = '';
  }, 3000);
}

// Make functions globally available for onclick handlers
(window as any).acceptFriendRequest = acceptFriendRequest;
(window as any).rejectFriendRequest = rejectFriendRequest;
(window as any).cancelFriendRequest = cancelFriendRequest;
(window as any).removeFriend = removeFriend;
(window as any).viewProfile = viewProfile;

function render(route: string) {
  const lang = getLang();
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
        const cacheBuster = localStorage.getItem('avatarCacheBuster') || Date.now().toString();
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
  app.innerHTML = langSwitcherUI(lang) + accessibilityTogglesUI() + topRightUI + content;
  attachMenuListeners();
  attachLangListener();
  attachAccessibilityListeners();
  attachLoginListeners();
  attachUserDropdownListeners();
  attachPongListeners();
  
  // Update friends count after rendering to restore correct values
  if (loggedInUser) {
    setTimeout(() => updateFriendsCount(), 100);
  }
  
  // Always check for page-specific listeners after rendering
  attachPageSpecificListeners(route);
}

// Track which page-specific listeners are already attached
let attachedListeners = new Set<string>();

function attachPageSpecificListeners(route: string) {
  // Attach page-specific listeners based on current route
  if (route === 'edit-profile' && !attachedListeners.has('edit-profile')) {
    attachedListeners.add('edit-profile');
    setTimeout(() => attachEditProfileListeners(), 0);
  }
  if (route === 'profile' && !attachedListeners.has('profile')) {
    attachedListeners.add('profile');
    setTimeout(() => attachProfilePageListeners(), 0);
  }
  if (route === 'leaderboard' && !attachedListeners.has('leaderboard')) {
    attachedListeners.add('leaderboard');
    setTimeout(() => loadLeaderboards(), 0);
  }
  if (route === 'options' && !attachedListeners.has('options')) {
    attachedListeners.add('options');
    setTimeout(() => initializeOptionsPage(), 0);
  }
  if (route === 'friends' && !attachedListeners.has('friends')) {
    attachedListeners.add('friends');
    setTimeout(() => initializeFriendsPage(), 0);
  }
}

function clearPageSpecificListeners() {
  attachedListeners.clear();
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
  document.getElementById('lang-select')?.addEventListener('change', (e) => {
    const lang = (e.target as HTMLSelectElement).value as 'en'|'it'|'fr';
    setLang(lang);
  });
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

function generateMatchHistoryHtml(matches: any[]): string {
  if (!matches || matches.length === 0) {
    return `
      <div class='bg-gray-800 rounded-lg p-4'>
        <h3 class='text-lg font-semibold mb-4 text-white'>Match History</h3>
        <div class='text-gray-400 text-center py-4'>No matches played yet</div>
      </div>
    `;
  }

  const matchesHtml = matches.map(match => {
    const matchDate = new Date(match.matchDate).toLocaleDateString();
    const isWin = match.userResult === 'WIN';
    const resultColor = isWin ? 'text-green-400' : 'text-red-400';
    const resultBg = isWin ? 'bg-green-900' : 'bg-red-900';
    
    // Determine opponent name
    const opponent = match.participants.player1 === loggedInUser 
      ? match.participants.player2 
      : match.participants.player1;
    
    // Format match type
    const typeColor = match.matchType === 'bot' ? 'text-orange-400' : 
                     match.matchType === 'player' ? 'text-blue-400' : 'text-yellow-400';
    
    return `
      <div class='${resultBg} border-l-4 ${isWin ? 'border-green-400' : 'border-red-400'} rounded-r-lg p-3 mb-2'>
        <div class='flex justify-between items-center'>
          <div class='flex-1'>
            <div class='flex items-center space-x-2'>
              <span class='${resultColor} font-bold text-sm'>${match.userResult}</span>
              <span class='${typeColor} text-xs uppercase'>${match.matchType}</span>
            </div>
            <div class='text-white font-medium'>vs ${opponent}</div>
            <div class='text-gray-300 text-sm'>${matchDate}</div>
          </div>
          <div class='text-right'>
            <div class='text-white font-bold text-lg'>
              ${match.scores.player1Score}-${match.scores.player2Score}
            </div>
            <div class='text-gray-400 text-xs'>
              Winner: ${match.winner}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class='bg-gray-800 rounded-lg p-4'>
      <h3 class='text-lg font-semibold mb-4 text-white'>Match History</h3>
      <div class='max-h-64 overflow-y-auto'>
        ${matchesHtml}
      </div>
      <div class='text-center mt-3'>
        <small class='text-gray-400'>Last ${matches.length} matches</small>
      </div>
    </div>
  `;
}

// Attach listeners and fill data for the profile page
function attachProfilePageListeners() {
  // Delete profile button logic
  const deleteBtn = document.getElementById('delete-profile-btn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
      if (!confirm('Are you sure you want to delete your profile? This action cannot be undone.')) return;
      if (!confirm('This is your last chance! Do you really want to delete your profile and all your data?')) return;
      // Prompt for password
      const password = prompt('Please enter your current password to confirm deletion:');
      if (!password) return;
      const errorDiv = document.getElementById('delete-profile-error');
      errorDiv?.classList.add('hidden');
      try {
        const res = await fetch(`${API_BASE}/users/${loggedInUser}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password })
        });
        const data = await res.json();
        if (!res.ok) {
          errorDiv!.textContent = data.error || 'Failed to delete profile.';
          errorDiv!.classList.remove('hidden');
        } else {
          alert('Your profile has been deleted.');
          setLoggedInUser(null);
          window.location.hash = '';
        }
      } catch (err) {
        errorDiv!.textContent = 'Network error.';
        errorDiv!.classList.remove('hidden');
      }
    });
  }
  if (!loggedInUser) return;
  // Fetch user info, stats, and match history
  Promise.all([
    fetch(`${API_BASE}/users/${loggedInUser}`).then(res => res.json()),
    fetch(`${API_BASE}/stats/${loggedInUser}`).then(res => res.json()),
    fetch(`${API_BASE}/matches/history/${loggedInUser}`).then(res => res.json())
  ]).then(([user, stats, matchHistory]) => {
    // Avatar
    let avatarUrl = user.profile?.avatarUrl || '';
    if (avatarUrl.startsWith('/uploads') || avatarUrl.startsWith('/static')) {
      avatarUrl = API_BASE + avatarUrl;
    }
    // Add cache-busting query string to force refresh after upload
    if (avatarUrl && avatarUrl.includes('/uploads/')) {
      const cacheBuster = localStorage.getItem('avatarCacheBuster') || Date.now().toString();
      avatarUrl += (avatarUrl.includes('?') ? '&' : '?') + 'v=' + cacheBuster;
    }
    
    // Show avatar image (default or uploaded) with SVG fallback
    const avatarHtml = avatarUrl
      ? `<img src='${avatarUrl}' alt='avatar' class='w-32 h-32 rounded-full border-4 border-gray-600 bg-gray-700 object-cover mb-2' onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" /><span class='w-32 h-32 rounded-full bg-gray-700 border-4 border-gray-600 flex items-center justify-center mb-2' style='display:none;'><svg width='64' height='64' fill='none' viewBox='0 0 24 24'><circle cx='12' cy='8' r='4' fill='#bbb'/><ellipse cx='12' cy='18' rx='7' ry='4' fill='#bbb'/></svg></span>`
      : `<span class='w-32 h-32 rounded-full bg-gray-700 border-4 border-gray-600 flex items-center justify-center mb-2'><svg width='64' height='64' fill='none' viewBox='0 0 24 24'><circle cx='12' cy='8' r='4' fill='#bbb'/><ellipse cx='12' cy='18' rx='7' ry='4' fill='#bbb'/></svg></span>`;
    document.getElementById('profile-avatar')!.innerHTML = avatarHtml;
    // Alias
    document.getElementById('profile-alias')!.textContent = user.profile?.alias || user.username;
    // Username
    document.getElementById('profile-username')!.textContent = '@' + user.username;
    // Email (show only if emailVisible is true)
    const emailDiv = document.getElementById('profile-email');
    if (emailDiv) {
      if (user.profile?.emailVisible && user.email && user.email !== '*************') {
        emailDiv.textContent = user.email;
        emailDiv.style.display = 'block';
      } else {
        emailDiv.textContent = '';
        emailDiv.style.display = 'none';
      }
    }
    // Bio
    const bio = user.profile?.bio;
    const bioDiv = document.getElementById('profile-bio');
    if (bio && bio.trim()) {
      bioDiv!.textContent = '';
      bioDiv!.innerHTML = `<div class='whitespace-pre-line text-gray-300'>${bio}</div>`;
    } else {
      bioDiv!.innerHTML = '';
    }
    // Stats counters
    const statsHtml = `
      <div class='grid grid-cols-2 gap-4 mb-2'>
        <div class='bg-gray-800 rounded-lg p-4 flex flex-col items-center'>
          <div class='text-lg font-semibold text-green-400'>Bot</div>
          <div class='flex space-x-4 mt-2'>
            <div class='text-center'>
              <div class='text-2xl font-bold'>${stats.botWins ?? 0}</div>
              <div class='text-gray-400 text-sm'>Wins</div>
            </div>
            <div class='text-center'>
              <div class='text-2xl font-bold'>${stats.botLosses ?? 0}</div>
              <div class='text-gray-400 text-sm'>Losses</div>
            </div>
          </div>
        </div>
        <div class='bg-gray-800 rounded-lg p-4 flex flex-col items-center'>
          <div class='text-lg font-semibold text-blue-400'>Player</div>
          <div class='flex space-x-4 mt-2'>
            <div class='text-center'>
              <div class='text-2xl font-bold'>${stats.playerWins ?? 0}</div>
              <div class='text-gray-400 text-sm'>Wins</div>
            </div>
            <div class='text-center'>
              <div class='text-2xl font-bold'>${stats.playerLosses ?? 0}</div>
              <div class='text-gray-400 text-sm'>Losses</div>
            </div>
          </div>
        </div>
      </div>
      <div class='bg-gray-800 rounded-lg p-4 flex flex-col items-center'>
        <div class='text-lg font-semibold text-yellow-400'>Tournament Wins</div>
        <div class='text-3xl font-bold mt-2'>${stats.tournamentWins ?? 0}</div>
      </div>
    `;
    document.getElementById('profile-stats-counters')!.innerHTML = statsHtml;
    
    // Match History
    const matchHistoryHtml = generateMatchHistoryHtml(matchHistory.matches || []);
    document.getElementById('profile-match-history')!.innerHTML = matchHistoryHtml;
    
    // Setup paddle color selector after stats are loaded
    setTimeout(() => {
      const skinColorSelect = document.getElementById('profile-skinColor') as HTMLSelectElement | null;
      const skinColorConfirm = document.getElementById('profile-skinColor-confirm') as HTMLButtonElement | null;
      if (skinColorSelect && skinColorConfirm && loggedInUser) {
        // Set initial value from user profile  
        if (user.profile?.skinColor) {
          skinColorSelect.value = user.profile.skinColor;
        }
        skinColorConfirm.onclick = () => {
          const newColor = skinColorSelect.value;
          fetch(`${API_BASE}/users/${loggedInUser}/skin`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ skinColor: newColor })
          })
            .then(res => res.ok ? res.json() : res.json().then(e => Promise.reject(e)))
            .then(() => {
              document.getElementById('profile-skinColor-success')!.textContent = 'Paddle color updated!';
              document.getElementById('profile-skinColor-success')!.classList.remove('hidden');
              document.getElementById('profile-skinColor-error')!.classList.add('hidden');
            })
            .catch(err => {
              document.getElementById('profile-skinColor-error')!.textContent = err.error || 'Failed to update color.';
              document.getElementById('profile-skinColor-error')!.classList.remove('hidden');
              document.getElementById('profile-skinColor-success')!.classList.add('hidden');
            });
        };
      }
    }, 0);
  });
  document.getElementById('edit-profile-btn')?.addEventListener('click', () => {
    window.location.hash = '#edit-profile';
  });
  document.getElementById('back-home-profile')?.addEventListener('click', () => {
    window.location.hash = '';
  });
}

// Global flag to prevent multiple game instances
let isGameRunning = false;

// Basic Pong game logic
function startBasicPongGame(canvas: HTMLCanvasElement, statusDiv: HTMLElement | null) {
  // Prevent multiple game instances
  if (isGameRunning) {
    console.log('Game already running, ignoring start request');
    return;
  }
  
  isGameRunning = true;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    isGameRunning = false;
    return;
  }

  // Load game settings
  const gameSettings = loadGameSettings();
  
  // Function to reset start button when game ends
  function resetStartButton() {
    const startBtn = document.getElementById('pong-start') as HTMLButtonElement | null;
    if (startBtn) {
      startBtn.disabled = false;
      startBtn.textContent = 'Start Game';
    }
  }
  let ballX = canvas.width / 2;
  let ballY = canvas.height / 2;
  let ballVX = gameSettings.ballSpeed;
  let ballVY = gameSettings.ballSpeed * 0.7; // Slightly less vertical speed
  let leftPaddleY = canvas.height / 2 - 40;
  let rightPaddleY = canvas.height / 2 - 40;
  const paddleHeight = 80;
  const paddleWidth = 10;
  const paddleSpeed = gameSettings.paddleSpeed;
  let upPressed = false;
  let downPressed = false;
  let gameOver = false;
  let gameAborted = false; // Flag to prevent sending results during navigation
  let paddleVY = 0;
  
  // Score tracking
  let leftScore = 0;
  let rightScore = 0;
  const pointsToWin = gameSettings.pointsToWin;

  // AI simulated keyboard input
  let aiUpPressed = false;
  let aiDownPressed = false;

  function aiDecideMove() {
    // AI only sees the game state once per second
    // Predict ball position and set aiUpPressed/aiDownPressed
    const paddleCenter = rightPaddleY + paddleHeight / 2;
    // Predict ball's future Y position (simulate bounces)
    let predictedY = ballY;
    let predictedVY = ballVY;
    let predictedVX = ballVX;
    let predictedX = ballX;
    // Simulate ball movement until it reaches right paddle X
    while (predictedVX > 0 && predictedX < canvas.width - 30) {
      predictedX += predictedVX;
      predictedY += predictedVY;
      // Bounce off top/bottom
      if (predictedY < 10) {
        predictedY = 10 + (10 - predictedY);
        predictedVY *= -1;
      } else if (predictedY > canvas.height - 10) {
        predictedY = (canvas.height - 10) - (predictedY - (canvas.height - 10));
        predictedVY *= -1;
      }
    }
    // Remove random error for more consistent prediction
    // predictedY += (Math.random() - 0.5) * 5;
    // Add a deadzone so AI doesn't constantly move
    const deadzone = 30;
    // Only move if paddle is far from predicted position
    if (Math.abs(predictedY - paddleCenter) > deadzone) {
      if (predictedY < paddleCenter) {
        aiUpPressed = true;
        aiDownPressed = false;
      } else {
        aiUpPressed = false;
        aiDownPressed = true;
      }
    } else {
      aiUpPressed = false;
      aiDownPressed = false;
    }
  }

  // Makes decision every second
  let aiInterval: number;
  function startAI() {
    aiDecideMove();
    aiInterval = window.setInterval(() => {
      aiDecideMove();
    }, 1000);
  }
  startAI();

  function aiSimulateKey() {
    // Simulate keyboard input for right paddle
    if (aiUpPressed && rightPaddleY > 0) rightPaddleY -= paddleSpeed;
    if (aiDownPressed && rightPaddleY < canvas.height - paddleHeight) rightPaddleY += paddleSpeed;
  }

  // Paddle color customization
  let userPaddleColor = '#FFFFFF';
  if (loggedInUser) {
    fetch(`${API_BASE}/users/${loggedInUser}`)
      .then(res => res.json())
      .then(user => {
        userPaddleColor = user.profile?.skinColor || '#FFFFFF';
      });
  }

  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw scores
    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${leftScore}`, canvas.width / 4, 40);
    ctx.fillText(`${rightScore}`, (canvas.width * 3) / 4, 40);
    
    // Draw center line
    ctx.setLineDash([5, 15]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.strokeStyle = '#fff';
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Use user's preferred color for left paddle
    ctx.fillStyle = userPaddleColor;
    ctx.fillRect(20, leftPaddleY, paddleWidth, paddleHeight);
    // Right paddle stays white
    ctx.fillStyle = '#fff';
    ctx.fillRect(canvas.width - 30, rightPaddleY, paddleWidth, paddleHeight);
    ctx.beginPath();
    ctx.arc(ballX, ballY, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.closePath();
  }

  // Helper to send match result to backend
  async function sendMatchResult({ result, player1Score, player2Score, opponent, startedAt, endedAt, duration }: { result: 'win'|'loss', player1Score: number, player2Score: number, opponent: string, startedAt: string, endedAt: string, duration: number }) {
    if (!loggedInUser) return;
    // Fetch userId for loggedInUser
    try {
      const userRes = await fetch(`${API_BASE}/users/${loggedInUser}`);
      const user = await userRes.json();
      if (!user || !user.id) return;
      
      // Determine winner ID
      const winnerId = result === 'win' ? user.id : null; // null for bot wins since bot doesn't have an ID
      
      await fetch(`${API_BASE}/matches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player1Id: user.id,
          player2BotName: opponent,
          player1Score,
          player2Score,
          winnerId,
          matchType: 'bot'
        })
      });
    } catch (e) {
      console.error('Failed to send match result:', e);
    }
  }

  function resetBall() {
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
    // Randomly choose initial direction but keep the speed setting
    ballVX = (Math.random() > 0.5 ? 1 : -1) * gameSettings.ballSpeed;
    ballVY = (Math.random() > 0.5 ? 1 : -1) * (gameSettings.ballSpeed * 0.7);
  }

  let matchStart = new Date();
  function update() {
    // Early exit if game was aborted during navigation
    if (gameAborted || gameOver) return;
    
    let prevPaddleY = leftPaddleY;
    if (upPressed && leftPaddleY > 0) leftPaddleY -= paddleSpeed;
    if (downPressed && leftPaddleY < canvas.height - paddleHeight) leftPaddleY += paddleSpeed;
    paddleVY = leftPaddleY - prevPaddleY;
    // Simulate AI keyboard input for right paddle
    aiSimulateKey();
    ballX += ballVX;
    ballY += ballVY;
    // Ball collision with top/bottom
    if (ballY < 10 || ballY > canvas.height - 10) ballVY *= -1;
    // Ball collision with left paddle
    if (
      ballX - 10 < 30 &&
      ballY + 10 > leftPaddleY &&
      ballY - 10 < leftPaddleY + paddleHeight &&
      ballVX < 0
    ) {
      ballX = 30 + 10;
      const hitPos = ((ballY - leftPaddleY) / paddleHeight) * 2 - 1;
      let speed = Math.sqrt(ballVX * ballVX + ballVY * ballVY);
      const angle = hitPos * Math.PI / 4;
      ballVX = Math.abs(speed * Math.cos(angle));
      ballVY = speed * Math.sin(angle);
      // Add spin based on paddle movement
      ballVY += paddleVY * 0.7; // spin factor
      // Slightly increase speed for more dynamic play
      const newSpeed = Math.min(Math.sqrt(ballVX * ballVX + ballVY * ballVY) * 1.05, 12);
      const norm = newSpeed / Math.sqrt(ballVX * ballVX + ballVY * ballVY);
      ballVX *= norm;
      ballVY *= norm;
    }
    // Ball collision with right paddle
    if (
      ballX + 10 > canvas.width - 30 &&
      ballY + 10 > rightPaddleY &&
      ballY - 10 < rightPaddleY + paddleHeight &&
      ballVX > 0
    ) {
      ballX = canvas.width - 30 - 10;
      const hitPos = ((ballY - rightPaddleY) / paddleHeight) * 2 - 1;
      let speed = Math.sqrt(ballVX * ballVX + ballVY * ballVY);
      const angle = hitPos * Math.PI / 4;
      ballVX = -Math.abs(speed * Math.cos(angle));
      ballVY = speed * Math.sin(angle);
      // Slightly increase speed for more dynamic play
      const newSpeed = Math.min(Math.sqrt(ballVX * ballVX + ballVY * ballVY) * 1.05, 12);
      const norm = newSpeed / Math.sqrt(ballVX * ballVX + ballVY * ballVY);
      ballVX *= norm;
      ballVY *= norm;
    }
    // Ball out of bounds - scoring
    if (ballX < 0 && !gameAborted) {
      rightScore++;
      if (statusDiv) statusDiv.textContent = `Right Player scores! Score: ${leftScore} - ${rightScore}`;
      
      if (rightScore >= pointsToWin) {
        gameOver = true;
        if (statusDiv) statusDiv.textContent = `Game Over! Right player wins ${rightScore}-${leftScore}!`;
        resetStartButton();
        // Send match result: user lost
        const matchEnd = new Date();
        sendMatchResult({
          result: 'loss',
          player1Score: leftScore,
          player2Score: rightScore,
          opponent: 'AI',
          startedAt: matchStart.toISOString(),
          endedAt: matchEnd.toISOString(),
          duration: Math.round((matchEnd.getTime() - matchStart.getTime()) / 1000)
        });
      } else {
        resetBall();
        setTimeout(() => {
          if (statusDiv) statusDiv.textContent = `Score: ${leftScore} - ${rightScore}`;
        }, 1500);
      }
    }
    if (ballX > canvas.width && !gameAborted) {
      leftScore++;
      if (statusDiv) statusDiv.textContent = `Left Player scores! Score: ${leftScore} - ${rightScore}`;
      
      if (leftScore >= pointsToWin) {
        gameOver = true;
        if (statusDiv) statusDiv.textContent = `Game Over! Left player wins ${leftScore}-${rightScore}!`;
        resetStartButton();
        // Send match result: user won
        const matchEnd = new Date();
        sendMatchResult({
          result: 'win',
          player1Score: leftScore,
          player2Score: rightScore,
          opponent: 'AI',
          startedAt: matchStart.toISOString(),
          endedAt: matchEnd.toISOString(),
          duration: Math.round((matchEnd.getTime() - matchStart.getTime()) / 1000)
        });
      } else {
        resetBall();
        setTimeout(() => {
          if (statusDiv) statusDiv.textContent = `Score: ${leftScore} - ${rightScore}`;
        }, 1500);
      }
    }
    if (gameOver) {
      isGameRunning = false; // Allow new games to start
      clearInterval(aiInterval);
    }
  }

  function gameLoop() {
    if (gameOver) return;
    update();
    draw();
    requestAnimationFrame(gameLoop);
  }

  // Keyboard controls for left paddle
  function keyDownHandler(e: KeyboardEvent) {
    if (e.key === 'ArrowUp') upPressed = true;
    if (e.key === 'ArrowDown') downPressed = true;
  }
  function keyUpHandler(e: KeyboardEvent) {
    if (e.key === 'ArrowUp') upPressed = false;
    if (e.key === 'ArrowDown') downPressed = false;
  }
  document.addEventListener('keydown', keyDownHandler);
  document.addEventListener('keyup', keyUpHandler);

  if (statusDiv) statusDiv.textContent = `Game started! Score: ${leftScore} - ${rightScore}. Use Arrow Up/Down to move left paddle.`;
  gameLoop();

  // Clean up listeners on game over or navigation
  window.addEventListener('hashchange', () => {
    gameAborted = true; // Flag to prevent sending match results
    gameOver = true; // Stop the game loop
    isGameRunning = false; // Allow new games to start
    resetStartButton(); // Reset the start button
    clearInterval(aiInterval); // Stop the AI interval
    document.removeEventListener('keydown', keyDownHandler);
    document.removeEventListener('keyup', keyUpHandler);
  }, { once: true });

  // Clean up on page unload (refresh/close)
  window.addEventListener('beforeunload', () => {
    gameAborted = true;
    gameOver = true;
    isGameRunning = false;
    resetStartButton();
    clearInterval(aiInterval);
    document.removeEventListener('keydown', keyDownHandler);
    document.removeEventListener('keyup', keyUpHandler);
  }, { once: true });
}

// Function to create leaderboard table HTML
function createLeaderboardTable(title: string, data: any[], emptyMessage: string) {
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

// Function to load and display leaderboards
async function loadLeaderboards() {
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
        ${createLeaderboardTable('🤖 Bot Wins', botWinsData, 'No bot matches played yet')}
        ${createLeaderboardTable('👥 Player Wins', playerWinsData, 'No player matches played yet')}
        ${createLeaderboardTable('🏆 Tournament Wins', tournamentWinsData, 'No tournaments won yet')}
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
      if (isGameRunning) {
        console.log('Game already running, ignoring start request');
        return;
      }
      startBtn.disabled = true;
      startBtn.textContent = 'Game Running...';
      startBasicPongGame(canvas, statusDiv);
    });
  }
}

function attachEditProfileListeners() {
  // Remove any existing listeners first to prevent duplicates
  const backButton = document.getElementById('back-home-edit-profile');
  if (backButton) {
    // Clone and replace to remove all event listeners
    const newBackButton = backButton.cloneNode(true) as HTMLElement;
    backButton.parentNode?.replaceChild(newBackButton, backButton);
    // Attach fresh event listener
    newBackButton.addEventListener('click', () => {
      window.location.hash = '';
    });
  }
  
  const form = document.getElementById('edit-profile-form') as HTMLFormElement | null;
  const avatarInput = document.getElementById('edit-avatar') as HTMLInputElement | null;
  const avatarPreview = document.getElementById('edit-avatar-preview');
  if (avatarInput && avatarPreview) {
    avatarInput.addEventListener('change', () => {
      const file = avatarInput.files && avatarInput.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = e => {
          avatarPreview.innerHTML = `<img src='${e.target?.result}' alt='avatar preview' class='w-24 h-24 rounded-full object-cover border-2 border-gray-600' />`;
        };
        reader.readAsDataURL(file);
      } else {
        avatarPreview.innerHTML = '';
      }
    });
  }
  if (form && loggedInUser) {
    let original = { alias: '', username: '', email: '', bio: '', skinColor: '#FFFFFF', emailVisible: true };
    let formReady = false;
    let isSubmitting = false; // Add submission lock
    
    // Initially disable submit button
    const submitBtn = document.getElementById('edit-profile-submit') as HTMLButtonElement;
    if (submitBtn) {
      submitBtn.disabled = true;
    }
    
    // Prefill form with current user info
    fetch(`${API_BASE}/users/${loggedInUser}`)
      .then(res => res.json())
      .then(user => {
        original = {
          alias: user.profile?.alias || '',
          username: user.username || '',
          email: user.email || '',
          bio: user.profile?.bio || '',
          skinColor: user.profile?.skinColor || '#FFFFFF',
          emailVisible: user.profile?.emailVisible !== false
        };
        (document.getElementById('edit-alias') as HTMLInputElement).value = original.alias;
        (document.getElementById('edit-username') as HTMLInputElement).value = original.username;
        (document.getElementById('edit-email') as HTMLInputElement).value = original.email;
        (document.getElementById('edit-bio') as HTMLTextAreaElement).value = original.bio;
        (document.getElementById('edit-email-visible') as HTMLInputElement).checked = original.emailVisible;
        formReady = true; // Mark form as ready after data is loaded
        
        // Enable submit button and update text
        const submitBtn = document.getElementById('edit-profile-submit') as HTMLButtonElement;
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Update Profile';
        }
        
      });
      
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      console.log('[DEBUG] Form submit event triggered');
      
      console.log('[DEBUG] Form submit event triggered');
      
      // Prevent multiple submissions
      if (isSubmitting) {
        console.log('[DEBUG] Already submitting, ignoring duplicate submission');
        return;
      }
      
      // Prevent submission if form data isn't loaded yet
      if (!formReady) {
        console.log('[DEBUG] Form not ready yet');
        const errorDiv = document.getElementById('edit-profile-error');
        const successDiv = document.getElementById('edit-profile-success');
        if (errorDiv) {
          errorDiv.textContent = 'Please wait for form to load completely before submitting.';
          errorDiv.classList.remove('hidden');
        }
        if (successDiv) {
          successDiv.classList.add('hidden');
        }
        return;
      }
      
      isSubmitting = true; // Lock submissions
      
      const alias = (document.getElementById('edit-alias') as HTMLInputElement).value.trim();
      const username = (document.getElementById('edit-username') as HTMLInputElement).value.trim();
      const email = (document.getElementById('edit-email') as HTMLInputElement).value.trim();
      const bio = (document.getElementById('edit-bio') as HTMLTextAreaElement).value;
      const password = (document.getElementById('edit-password') as HTMLInputElement).value.trim();
      const emailVisible = (document.getElementById('edit-email-visible') as HTMLInputElement).checked;
      
      // More robust way to get current password
      const currentPasswordInput = document.getElementById('edit-current-password') as HTMLInputElement;
      const currentPassword = currentPasswordInput ? currentPasswordInput.value.trim() : '';
      
      // Removed edit-skinColor field, do not read its value
      const errorDiv = document.getElementById('edit-profile-error');
      const successDiv = document.getElementById('edit-profile-success');
      const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement | null;
      if (errorDiv) errorDiv.classList.add('hidden');
      if (successDiv) successDiv.classList.add('hidden');
      let errorMsg = '';
      // Only require current password if changing username/email/password or uploading avatar
      const wantsUsernameChange = username && username !== original.username;
      const wantsEmailChange = email && email !== original.email;
      const wantsPasswordChange = !!password;
      const wantsAvatarChange = avatarInput && avatarInput.files && avatarInput.files.length > 0;
      const wantsBioChange = bio !== original.bio;
      const wantsEmailVisibilityChange = emailVisible !== original.emailVisible;
      
      // Check if at least one field is being changed
      if (!alias && !wantsUsernameChange && !wantsEmailChange && !wantsPasswordChange && !wantsAvatarChange && !wantsBioChange && !wantsEmailVisibilityChange) {
        errorMsg = 'At least one field must be filled.';
      }
      
      // Current password only required for sensitive changes (not for alias, bio, or avatar)
      if ((wantsUsernameChange || wantsEmailChange || wantsPasswordChange) && !currentPassword) {
        errorMsg = 'Current password is required to change username, email, or password.';
      }
      if (errorMsg) {
        if (errorDiv) {
          errorDiv.textContent = errorMsg;
          errorDiv.classList.remove('hidden');
        }
        // Hide success div when showing error
        if (successDiv) {
          successDiv.classList.add('hidden');
        }
        // Reset button state before returning
        isSubmitting = false;
        const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement | null;
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Update Profile';
        }
        return;
      }
      let ok = true;
      let msg = '';
      let aliasTargetUser = loggedInUser;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Updating...';
      }
      try {
        // PATCH username/email/password only if needed
        const updateBody: any = {};
        if (wantsUsernameChange) updateBody.newUsername = username;
        if (wantsEmailChange) updateBody.newEmail = email;
        if (wantsPasswordChange) updateBody.newPassword = password;
        if (wantsUsernameChange || wantsEmailChange || wantsPasswordChange) {
          updateBody.currentPassword = currentPassword;
        }
  if (Object.keys(updateBody).length > 0) {
        // Removed PATCH for skinColor; handled in profile view only
          try {
            const userRes = await fetch(`${API_BASE}/users/${loggedInUser}` , {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updateBody)
            });
            const userResBody = await userRes.json();
            if (!userRes.ok) {
              ok = false;
              msg = userResBody.error || JSON.stringify(userResBody) || 'Failed to update profile.';
            } else {
              if (updateBody.newUsername) {
                setLoggedInUser(updateBody.newUsername);
                aliasTargetUser = updateBody.newUsername;
                try {
                  const newUserRes = await fetch(`${API_BASE}/users/${updateBody.newUsername}`);
                  if (!newUserRes.ok) {
                    console.warn('Failed to fetch updated user data after username change');
                  } else {
                    const newUser = await newUserRes.json();
                    original = {
                      alias: newUser.profile?.alias || '',
                      username: newUser.username || '',
                      email: newUser.email || '',
                      bio: newUser.profile?.bio || '',
                      skinColor: newUser.profile?.skinColor || '#FFFFFF',
                      emailVisible: newUser.profile?.emailVisible !== false
                    };
                    // Preserve current password field when updating form
                    const currentPasswordField = document.getElementById('edit-current-password') as HTMLInputElement;
                    const currentPasswordValue = currentPasswordField?.value || '';
                    
                    try {
                      (document.getElementById('edit-alias') as HTMLInputElement).value = original.alias;
                      (document.getElementById('edit-username') as HTMLInputElement).value = original.username;
                      (document.getElementById('edit-email') as HTMLInputElement).value = original.email;
                      (document.getElementById('edit-bio') as HTMLTextAreaElement).value = original.bio;
                      (document.getElementById('edit-email-visible') as HTMLInputElement).checked = original.emailVisible;
                      
                      // Restore current password field
                      if (currentPasswordField) {
                        currentPasswordField.value = currentPasswordValue;
                      }
                    } catch (domError) {
                      console.error('Error updating form fields after username change:', domError);
                    }
                  }
                } catch (err) {
                  console.warn('Error updating form after username change:', err);
                }
              } else if (updateBody.newEmail) {
                try {
                  const newUserRes = await fetch(`${API_BASE}/users/${aliasTargetUser}`);
                  if (!newUserRes.ok) {
                    console.warn('Failed to fetch updated user data after email change');
                  } else {
                    const newUser = await newUserRes.json();
                    original = {
                      alias: newUser.profile?.alias || '',
                      username: newUser.username || '',
                      email: newUser.email || '',
                      bio: newUser.profile?.bio || '',
                      skinColor: newUser.profile?.skinColor || '#FFFFFF',
                      emailVisible: newUser.profile?.emailVisible !== false
                    };
                    // Preserve current password field when updating form
                    const currentPasswordField = document.getElementById('edit-current-password') as HTMLInputElement;
                    const currentPasswordValue = currentPasswordField?.value || '';
                    
                    (document.getElementById('edit-alias') as HTMLInputElement).value = original.alias;
                    (document.getElementById('edit-username') as HTMLInputElement).value = original.username;
                    (document.getElementById('edit-email') as HTMLInputElement).value = original.email;
                    (document.getElementById('edit-bio') as HTMLTextAreaElement).value = original.bio;
                    (document.getElementById('edit-email-visible') as HTMLInputElement).checked = original.emailVisible;
                    
                    // Restore current password field
                    if (currentPasswordField) {
                      currentPasswordField.value = currentPasswordValue;
                    }
                  }
                } catch (err) {
                  console.warn('Error updating form after email change:', err);
                }
              }
            }
          } catch (err) {
            ok = false;
            msg = err instanceof Error ? err.message : 'Network error updating profile.';
          }
        }
        // Avatar upload if needed
        if (ok && wantsAvatarChange && avatarInput && avatarInput.files && avatarInput.files.length > 0) {
          const file = avatarInput.files[0];
          
          console.log('[DEBUG] Avatar upload: uploading file', file.name);
          
          const formData = new FormData();
          formData.append('file', file);
          
          try {
            const avatarRes = await fetch(`${API_BASE}/users/${aliasTargetUser}/avatar`, {
              method: 'PATCH',
              body: formData
            });
            const avatarResBody = await avatarRes.json();
            if (!avatarRes.ok) {
              ok = false;
              msg = avatarResBody.error || JSON.stringify(avatarResBody) || 'Failed to upload avatar.';
            } else {
              // Pass the new avatar URL directly to avoid refetch issues, but skip render to prevent button reset
              const newAvatarUrl = avatarResBody.avatarUrl;
              setLoggedInUser(aliasTargetUser, newAvatarUrl, true);
              // Clear file input and preview
              avatarInput.value = '';
              if (avatarPreview) avatarPreview.innerHTML = '';
            }
          } catch (err) {
            ok = false;
            msg = err instanceof Error ? err.message : 'Network error uploading avatar.';
          }
        }
        // Update alias if changed (after username PATCH if needed)
        if (ok && alias && alias !== original.alias) {
          try {
            const aliasRes = await fetch(`${API_BASE}/users/${aliasTargetUser}/alias`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ alias })
            });
            const aliasResBody = await aliasRes.json();
            if (!aliasRes.ok) {
              ok = false;
              msg = aliasResBody.error || JSON.stringify(aliasResBody) || 'Failed to update alias.';
            }
          } catch (err) {
            ok = false;
            msg = err instanceof Error ? err.message : 'Network error updating alias.';
          }
        }
        // Update bio if changed
        if (ok && bio && bio !== original.bio) {
          try {
            const bioRes = await fetch(`${API_BASE}/users/${aliasTargetUser}/bio`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ bio })
            });
            const bioResBody = await bioRes.json();
            if (!bioRes.ok) {
              ok = false;
              msg = bioResBody.error || JSON.stringify(bioResBody) || 'Failed to update biography.';
            }
          } catch (err) {
            ok = false;
            msg = err instanceof Error ? err.message : 'Network error updating biography.';
          }
        }
        // Update email visibility if changed
        if (ok && wantsEmailVisibilityChange) {
          try {
            const emailVisRes = await fetch(`${API_BASE}/users/${aliasTargetUser}/email-visibility`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ emailVisible })
            });
            const emailVisResBody = await emailVisRes.json();
            if (!emailVisRes.ok) {
              ok = false;
              msg = emailVisResBody.error || JSON.stringify(emailVisResBody) || 'Failed to update email visibility.';
            }
          } catch (err) {
            ok = false;
            msg = err instanceof Error ? err.message : 'Network error updating email visibility.';
          }
        }
      } finally {
        console.log('[DEBUG] Form submission completed');
        
        isSubmitting = false; // Unlock submissions
        // Get fresh reference to submit button to ensure we have the correct element
        const currentSubmitBtn = document.getElementById('edit-profile-submit') as HTMLButtonElement;
        if (currentSubmitBtn) {
          console.log('[DEBUG] Resetting button state');
          currentSubmitBtn.disabled = false;
          currentSubmitBtn.textContent = 'Update Profile';
        } else {
          console.log('[DEBUG] Submit button not found!');
        }
      }
      if (ok) {
        console.log('[DEBUG] Profile update successful, showing success message');
        // Get fresh DOM references to ensure they're current
        const currentSuccessDiv = document.getElementById('edit-profile-success');
        const currentErrorDiv = document.getElementById('edit-profile-error');
        
        if (currentSuccessDiv) {
          currentSuccessDiv.textContent = 'Profile updated successfully!';
          currentSuccessDiv.classList.remove('hidden');
          console.log('[DEBUG] Success message displayed');
          
          // Ensure back button is still working after username change
          setTimeout(() => {
            const backButton = document.getElementById('back-home-edit-profile');
            if (backButton) {
              console.log('[DEBUG] Ensuring back button functionality after username change');
              // Remove any existing listeners and add a fresh one
              const newBackButton = backButton.cloneNode(true) as HTMLElement;
              backButton.parentNode?.replaceChild(newBackButton, backButton);
              newBackButton.addEventListener('click', () => {
                console.log('[DEBUG] Back button clicked after username change');
                window.location.hash = '';
              });
            }
          }, 100);
        } else {
          console.warn('[DEBUG] Success div not found!');
        }
        // Hide error div if it was previously shown
        if (currentErrorDiv) {
          currentErrorDiv.classList.add('hidden');
        }
      } else {
        console.log('[DEBUG] Profile update failed:', msg);
        // Get fresh DOM references
        const currentErrorDiv = document.getElementById('edit-profile-error');
        const currentSuccessDiv = document.getElementById('edit-profile-success');
        
        if (currentErrorDiv) {
          currentErrorDiv.textContent = msg;
          currentErrorDiv.classList.remove('hidden');
        }
        // Hide success div when showing error
        if (currentSuccessDiv) {
          currentSuccessDiv.classList.add('hidden');
        }
      }
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
  stopHeartbeat();
});

// Start heartbeat if user is already logged in
if (loggedInUser) {
  startHeartbeat();
  // Update friends count after a short delay to ensure UI is loaded
  setTimeout(() => updateFriendsCount(), 1500);
}

// Initial render
render(window.location.hash.replace('#', ''));
