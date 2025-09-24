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
  return `<div class='absolute top-4 left-4 z-50'>
    <label for='lang-select' class='mr-2'>${translations[currentLang].langLabel}:</label>
    <select id='lang-select' class='px-2 py-1 rounded bg-gray-800 text-white border border-gray-600'>
      <option value='en' ${currentLang === 'en' ? 'selected' : ''}>English</option>
      <option value='it' ${currentLang === 'it' ? 'selected' : ''}>Italiano</option>
      <option value='fr' ${currentLang === 'fr' ? 'selected' : ''}>Français</option>
    </select>
  </div>`;
}

function accessibilityTogglesUI() {
  return `<div class='absolute bottom-4 left-4 z-50 flex space-x-2'>
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
  'options': `<h2 class="text-2xl font-bold mb-4">Options</h2><p>Settings will go here.</p>`,
  'leaderboard': `<h2 class="text-2xl font-bold mb-4">Leaderboard</h2>
      <div class='mt-6 w-full max-w-2xl mx-auto'>
        <div class='mb-6'>
          <h3 class='text-xl font-semibold mb-2' tabindex='0'>Player Stats</h3>
          <table class='w-full text-left bg-gray-800 rounded-lg overflow-hidden'>
            <thead class='bg-gray-700'>
              <tr>
                <th class='px-4 py-2'>Player</th>
                <th class='px-4 py-2'>Wins</th>
                <th class='px-4 py-2'>Losses</th>
                <th class='px-4 py-2'>Win Rate</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class='px-4 py-2'>Alice</td>
                <td class='px-4 py-2'>12</td>
                <td class='px-4 py-2'>5</td>
                <td class='px-4 py-2'>70%</td>
              </tr>
              <tr>
                <td class='px-4 py-2'>Bob</td>
                <td class='px-4 py-2'>8</td>
                <td class='px-4 py-2'>10</td>
                <td class='px-4 py-2'>44%</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div>
          <h3 class='text-xl font-semibold mb-2' tabindex='0'>Match History</h3>
          <table class='w-full text-left bg-gray-800 rounded-lg overflow-hidden'>
            <thead class='bg-gray-700'>
              <tr>
                <th class='px-4 py-2'>Date</th>
                <th class='px-4 py-2'>Players</th>
                <th class='px-4 py-2'>Winner</th>
                <th class='px-4 py-2'>Score</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class='px-4 py-2'>2025-08-10</td>
                <td class='px-4 py-2'>Alice vs Bob</td>
                <td class='px-4 py-2'>Alice</td>
                <td class='px-4 py-2'>11-7</td>
              </tr>
              <tr>
                <td class='px-4 py-2'>2025-08-09</td>
                <td class='px-4 py-2'>Bob vs Alice</td>
                <td class='px-4 py-2'>Bob</td>
                <td class='px-4 py-2'>11-9</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>`,
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
  'edit-profile': `<div class='max-w-md mx-auto mt-16 p-8 bg-gray-900 rounded-lg shadow-lg'>
    <h2 class='text-2xl font-bold mb-6 text-center' tabindex='0'>Edit Profile</h2>
  <form id='edit-profile-form' class='space-y-4' enctype='multipart/form-data'>
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
      <div>
        <label for='edit-bio' class='block mb-1'>Biography</label>
        <textarea id='edit-bio' name='bio' rows='3' class='w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-400'></textarea>
      </div>
      <div>
        <label for='edit-password' class='block mb-1'>New Password</label>
        <input type='password' id='edit-password' name='password' class='w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-400' autocomplete='new-password' />
      </div>
      <div>
        <label for='edit-current-password' class='block mb-1'>Current Password <span class='text-red-500'>*</span></label>
        <input type='password' id='edit-current-password' name='currentPassword' class='w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-400' required autocomplete='current-password' />
      </div>
      <button type='submit' class='w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded focus:outline-none focus:ring-4 focus:ring-green-400'>Update Profile</button>
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
      <div class='text-gray-400 mb-4' id='profile-username'></div>
      <div class='text-base text-white mb-6' id='profile-bio'></div>
      <div id='profile-stats-counters' class='w-full mb-6'></div>
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
let loggedInUserAvatar: string | null = null;

function setLoggedInUser(username: string | null) {
  loggedInUser = username;
  if (username) {
    localStorage.setItem('loggedInUser', username);
    // Fetch avatar URL for the user
    fetch(`${API_BASE}/users/${username}`)
      .then(res => res.json())
      .then(user => {
        loggedInUserAvatar = user.profile?.avatarUrl || null;
        // Re-render to update avatar if needed
        render(window.location.hash.replace('#', ''));
      })
      .catch(() => {
        loggedInUserAvatar = null;
        render(window.location.hash.replace('#', ''));
      });
  } else {
    localStorage.removeItem('loggedInUser');
    loggedInUserAvatar = null;
  }
}

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
      <div class='mt-6 w-full max-w-2xl mx-auto'>
        <div class='mb-6'>
          <h3 class='text-xl font-semibold mb-2' tabindex='0'>Player Stats</h3>
          <table class='w-full text-left bg-gray-800 rounded-lg overflow-hidden'>
            <thead class='bg-gray-700'>
              <tr>
                <th class='px-4 py-2'>Player</th>
                <th class='px-4 py-2'>Wins</th>
                <th class='px-4 py-2'>Losses</th>
                <th class='px-4 py-2'>Win Rate</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class='px-4 py-2'>Alice</td>
                <td class='px-4 py-2'>12</td>
                <td class='px-4 py-2'>5</td>
                <td class='px-4 py-2'>70%</td>
              </tr>
              <tr>
                <td class='px-4 py-2'>Bob</td>
                <td class='px-4 py-2'>8</td>
                <td class='px-4 py-2'>10</td>
                <td class='px-4 py-2'>44%</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div>
          <h3 class='text-xl font-semibold mb-2' tabindex='0'>Match History</h3>
          <table class='w-full text-left bg-gray-800 rounded-lg overflow-hidden'>
            <thead class='bg-gray-700'>
              <tr>
                <th class='px-4 py-2'>Date</th>
                <th class='px-4 py-2'>Players</th>
                <th class='px-4 py-2'>Winner</th>
                <th class='px-4 py-2'>Score</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class='px-4 py-2'>2025-08-10</td>
                <td class='px-4 py-2'>Alice vs Bob</td>
                <td class='px-4 py-2'>Alice</td>
                <td class='px-4 py-2'>11-7</td>
              </tr>
              <tr>
                <td class='px-4 py-2'>2025-08-09</td>
                <td class='px-4 py-2'>Bob vs Alice</td>
                <td class='px-4 py-2'>Bob</td>
                <td class='px-4 py-2'>11-9</td>
              </tr>
            </tbody>
          </table>
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
    // Show avatar if available, else fallback to default icon
    let avatarImg = '';
    if (loggedInUserAvatar) {
      // If avatarUrl is relative, prepend API_BASE
      let avatarUrl = loggedInUserAvatar;
      if (avatarUrl.startsWith('/uploads') || avatarUrl.startsWith('/static')) {
        avatarUrl = API_BASE + avatarUrl;
      }
      avatarImg = `<img src='${avatarUrl}' alt='avatar' class='inline-block w-8 h-8 rounded-full mr-2 border border-gray-600 bg-gray-700 object-cover' style='vertical-align:middle;' />`;
    } else {
      // fallback: show a default avatar SVG
      avatarImg = `<span class='inline-block w-8 h-8 rounded-full mr-2 bg-gray-700 border border-gray-600 flex items-center justify-center' style='vertical-align:middle;'><svg width='24' height='24' fill='none' viewBox='0 0 24 24'><circle cx='12' cy='8' r='4' fill='#bbb'/><ellipse cx='12' cy='18' rx='7' ry='4' fill='#bbb'/></svg></span>`;
    }
    topRightUI = `<div class='fixed top-4 right-4 z-50 flex items-center'>
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

// Attach listeners and fill data for the profile page
function attachProfilePageListeners() {
  // Delete profile button logic
  const deleteBtn = document.getElementById('delete-profile-btn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
      if (!confirm('Are you sure you want to delete your profile? This action cannot be undone.')) return;
      if (!confirm('This is your last chance! Do you really want to delete your profile and all your data?')) return;
      const password = prompt('Please enter your password to confirm deletion:');
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
  // Fetch user info and stats
  Promise.all([
    fetch(`${API_BASE}/users/${loggedInUser}`).then(res => res.json()),
    fetch(`${API_BASE}/stats/${loggedInUser}`).then(res => res.json())
  ]).then(([user, stats]) => {
    // Avatar
    let avatarUrl = user.profile?.avatarUrl || '';
    if (avatarUrl.startsWith('/uploads') || avatarUrl.startsWith('/static')) {
      avatarUrl = API_BASE + avatarUrl;
    }
    // Add cache-busting query string to force refresh after upload
    if (avatarUrl && avatarUrl.includes('/uploads/')) {
      avatarUrl += (avatarUrl.includes('?') ? '&' : '?') + 't=' + Date.now();
    }
    const avatarHtml = avatarUrl
      ? `<img src='${avatarUrl}' alt='avatar' class='w-32 h-32 rounded-full border-4 border-gray-600 bg-gray-700 object-cover mb-2' />`
      : `<span class='inline-block w-32 h-32 rounded-full bg-gray-700 border-4 border-gray-600 flex items-center justify-center mb-2'><svg width='64' height='64' fill='none' viewBox='0 0 24 24'><circle cx='12' cy='8' r='4' fill='#bbb'/><ellipse cx='12' cy='18' rx='7' ry='4' fill='#bbb'/></svg></span>`;
    document.getElementById('profile-avatar')!.innerHTML = avatarHtml;
    // Alias
    document.getElementById('profile-alias')!.textContent = user.profile?.alias || user.username;
    // Username
    document.getElementById('profile-username')!.textContent = '@' + user.username;
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
  });
  document.getElementById('edit-profile-btn')?.addEventListener('click', () => {
    window.location.hash = '#edit-profile';
  });
  document.getElementById('back-home-profile')?.addEventListener('click', () => {
    window.location.hash = '';
  });
}

// Basic Pong game logic
function startBasicPongGame(canvas: HTMLCanvasElement, statusDiv: HTMLElement | null) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  let ballX = canvas.width / 2;
  let ballY = canvas.height / 2;
  let ballVX = 3;
  let ballVY = 2;
  let leftPaddleY = canvas.height / 2 - 40;
  let rightPaddleY = canvas.height / 2 - 40;
  const paddleHeight = 80;
  const paddleWidth = 10;
  const paddleSpeed = 5;
  let upPressed = false;
  let downPressed = false;
  let gameOver = false;
  let paddleVY = 0;

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

  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.fillRect(20, leftPaddleY, paddleWidth, paddleHeight);
    ctx.fillRect(canvas.width - 30, rightPaddleY, paddleWidth, paddleHeight);
    ctx.beginPath();
    ctx.arc(ballX, ballY, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.closePath();
  }

  // Helper to send match result to backend
  async function sendMatchResult({ result, score, opponent, startedAt, endedAt, duration }: { result: 'win'|'loss', score: string, opponent: string, startedAt: string, endedAt: string, duration: number }) {
    if (!loggedInUser) return;
    // Fetch userId for loggedInUser
    try {
      const userRes = await fetch(`${API_BASE}/users/${loggedInUser}`);
      const user = await userRes.json();
      if (!user || !user.id) return;
      await fetch(`${API_BASE}/stats/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          result,
          type: 'bot',
          score,
          opponent,
          startedAt,
          endedAt,
          duration
        })
      });
    } catch (e) {
      // Ignore errors for now
    }
  }

  let matchStart = new Date();
  function update() {
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
    // Ball out of bounds
    if (ballX < 0) {
      gameOver = true;
      if (statusDiv) statusDiv.textContent = 'Game Over! Right player wins.';
      // Send match result: user lost
      const matchEnd = new Date();
      sendMatchResult({
        result: 'loss',
        score: '0-1',
        opponent: 'AI',
        startedAt: matchStart.toISOString(),
        endedAt: matchEnd.toISOString(),
        duration: Math.round((matchEnd.getTime() - matchStart.getTime()) / 1000)
      });
    }
    if (ballX > canvas.width) {
      gameOver = true;
      if (statusDiv) statusDiv.textContent = 'Game Over! Left player wins.';
      // Send match result: user won
      const matchEnd = new Date();
      sendMatchResult({
        result: 'win',
        score: '1-0',
        opponent: 'AI',
        startedAt: matchStart.toISOString(),
        endedAt: matchEnd.toISOString(),
        duration: Math.round((matchEnd.getTime() - matchStart.getTime()) / 1000)
      });
    }
    if (gameOver) {
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

  if (statusDiv) statusDiv.textContent = 'Game started! Use Arrow Up/Down to move left paddle.';
  gameLoop();

  // Clean up listeners on game over or navigation
  window.addEventListener('hashchange', () => {
    document.removeEventListener('keydown', keyDownHandler);
    document.removeEventListener('keyup', keyUpHandler);
  }, { once: true });
}

function attachPongListeners() {
  document.getElementById('pong')?.addEventListener('click', () => {
    window.location.hash = '#pong';
  });
  document.getElementById('back-home-pong')?.addEventListener('click', () => {
    window.location.hash = '';
  });
  const startBtn = document.getElementById('pong-start');
  const canvas = document.getElementById('pong-canvas') as HTMLCanvasElement | null;
  const statusDiv = document.getElementById('pong-status');
  if (startBtn && canvas) {
    startBtn.addEventListener('click', () => {
      startBasicPongGame(canvas, statusDiv);
    });
  }
}

function attachEditProfileListeners() {
  document.getElementById('back-home-edit-profile')?.addEventListener('click', () => {
    window.location.hash = '';
  });
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
    let original = { alias: '', username: '', email: '', bio: '' };
    // Prefill form with current user info
    fetch(`${API_BASE}/users/${loggedInUser}`)
      .then(res => res.json())
      .then(user => {
        original = {
          alias: user.profile?.alias || '',
          username: user.username || '',
          email: user.email || '',
          bio: user.profile?.bio || ''
        };
        (document.getElementById('edit-alias') as HTMLInputElement).value = original.alias;
        (document.getElementById('edit-username') as HTMLInputElement).value = original.username;
        (document.getElementById('edit-email') as HTMLInputElement).value = original.email;
        (document.getElementById('edit-bio') as HTMLTextAreaElement).value = original.bio;
      });
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const alias = (document.getElementById('edit-alias') as HTMLInputElement).value.trim();
      const username = (document.getElementById('edit-username') as HTMLInputElement).value.trim();
      const email = (document.getElementById('edit-email') as HTMLInputElement).value.trim();
      const bio = (document.getElementById('edit-bio') as HTMLTextAreaElement).value;
      const password = (document.getElementById('edit-password') as HTMLInputElement).value;
      const currentPassword = (document.getElementById('edit-current-password') as HTMLInputElement).value;
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
      if (!alias && !wantsUsernameChange && !wantsEmailChange && !wantsPasswordChange && !wantsAvatarChange) errorMsg = 'At least one field must be filled.';
      if ((wantsUsernameChange || wantsEmailChange || wantsPasswordChange || wantsAvatarChange) && !currentPassword) {
        errorMsg = 'Current password is required to change username, email, password, or avatar.';
      }
      if (errorMsg) {
        if (errorDiv) {
          errorDiv.textContent = errorMsg;
          errorDiv.classList.remove('hidden');
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
                  const newUser = await newUserRes.json();
                  original = {
                    alias: newUser.profile?.alias || '',
                    username: newUser.username || '',
                    email: newUser.email || '',
                    bio: newUser.profile?.bio || ''
                  };
                  (document.getElementById('edit-alias') as HTMLInputElement).value = original.alias;
                  (document.getElementById('edit-username') as HTMLInputElement).value = original.username;
                  (document.getElementById('edit-email') as HTMLInputElement).value = original.email;
                  (document.getElementById('edit-bio') as HTMLTextAreaElement).value = original.bio;
                } catch {}
              } else if (updateBody.newEmail) {
                try {
                  const newUserRes = await fetch(`${API_BASE}/users/${aliasTargetUser}`);
                  const newUser = await newUserRes.json();
                  original = {
                    alias: newUser.profile?.alias || '',
                    username: newUser.username || '',
                    email: newUser.email || '',
                    bio: newUser.profile?.bio || ''
                  };
                  (document.getElementById('edit-alias') as HTMLInputElement).value = original.alias;
                  (document.getElementById('edit-username') as HTMLInputElement).value = original.username;
                  (document.getElementById('edit-email') as HTMLInputElement).value = original.email;
                  (document.getElementById('edit-bio') as HTMLTextAreaElement).value = original.bio;
                } catch {}
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
          const formData = new FormData();
          formData.append('file', file);
          formData.append('currentPassword', currentPassword);
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
              setLoggedInUser(aliasTargetUser);
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
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Update Profile';
        }
      }
      if (ok) {
        if (successDiv) {
          successDiv.textContent = 'Profile updated successfully!';
          successDiv.classList.remove('hidden');
        }
      } else {
        if (errorDiv) {
          errorDiv.textContent = msg;
          errorDiv.classList.remove('hidden');
        }
      }
    });
  }
}

window.addEventListener('hashchange', () => {
  render(window.location.hash.replace('#', ''));
  if (window.location.hash === '#edit-profile') attachEditProfileListeners();
  if (window.location.hash === '#profile') attachProfilePageListeners();
});
// Ensure initial render also attaches listeners for edit-profile if needed
if (window.location.hash === '#edit-profile') attachEditProfileListeners();
if (window.location.hash === '#profile') attachProfilePageListeners();

// Initial render
render(window.location.hash.replace('#', ''));
