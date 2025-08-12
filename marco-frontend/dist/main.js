"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// Multilanguage translations
const translations = {
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
function getLang() {
    const lang = localStorage.getItem('lang');
    if (lang === 'it' || lang === 'fr')
        return lang;
    return 'en';
}
function setLang(lang) {
    localStorage.setItem('lang', lang);
    render(window.location.hash.replace('#', ''));
}
function langSwitcherUI(currentLang) {
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
const routes = {
    'home': `<h1 class="text-4xl font-bold mb-4">Pong Game</h1>
  <div class="flex flex-col items-center justify-center space-y-4 mt-8">
    <button class="w-48 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-green-400" id="start-game">Start Game</button>
    <button class="w-48 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-yellow-400" id="multiplayer">Multiplayer</button>
    <button class="w-48 px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded focus:outline-none focus:ring-2 focus:ring-gray-400" id="options">Options</button>
    <button class="w-48 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-purple-400" id="leaderboard">Leaderboard</button>
    <button class="w-48 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-400" id="pong">Pong Game</button>
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
    <h2 class='text-2xl font-bold mb-6 text-center' tabindex='0'>Login / Register</h2>
    <form id='auth-form' class='space-y-4'>
      <div>
        <label for='username' class='block mb-1'>Username</label>
        <input type='text' id='username' name='username' class='w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400' required autocomplete='username' />
      </div>
      <div>
        <label for='password' class='block mb-1'>Password</label>
        <input type='password' id='password' name='password' class='w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400' required autocomplete='current-password' />
      </div>
      <div class='flex items-center mb-2'>
        <input type='checkbox' id='register-toggle' class='mr-2' />
        <label for='register-toggle'>Register new account</label>
      </div>
      <button type='submit' class='w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded focus:outline-none focus:ring-4 focus:ring-blue-400'>Continue</button>
      <div id='auth-error' class='text-red-500 mt-2 hidden'></div>
    </form>
    <button id='back-home' class='mt-6 w-full px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded focus:outline-none focus:ring-4 focus:ring-gray-400'>Back to Home</button>
  </div>`,
    'pong': `<div class='flex flex-col items-center justify-center min-h-screen'>
    <h2 class='text-3xl font-bold mb-6'>Pong Game</h2>
    <div class='bg-gray-800 rounded-lg shadow-lg p-4 flex flex-col items-center'>
      <canvas id='pong-canvas' width='600' height='400' class='bg-black rounded mb-4'></canvas>
      <button id='pong-start' class='px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded focus:outline-none focus:ring-4 focus:ring-green-400 mb-2'>Start Game</button>
      <div id='pong-status' class='text-white mt-2'></div>
    </div>
    <button id='back-home-pong' class='mt-8 px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded focus:outline-none focus:ring-4 focus:ring-gray-400'>Back to Home</button>
  </div>`
};
function render(route) {
    const lang = getLang();
    const t = translations[lang];
    const app = document.getElementById('app');
    if (!app)
        return;
    let content = '';
    if (route === 'pong') {
        content = routes['pong'];
    }
    else if (route === 'login') {
        content = routes['login'];
    }
    else if (route === 'multiplayer') {
        content = `<h2 class='text-2xl font-bold mb-4' tabindex='0' aria-label='${t.multiplayerTitle}'>${t.multiplayerTitle}</h2><p>${t.multiplayerDesc}</p>`;
    }
    else if (route === 'options') {
        content = `<h2 class='text-2xl font-bold mb-4' tabindex='0' aria-label='${t.optionsTitle}'>${t.optionsTitle}</h2><p>${t.optionsDesc}</p>`;
    }
    else if (route === 'leaderboard') {
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
    }
    else {
        content = `<h1 class='text-4xl font-bold mb-4' tabindex='0' aria-label='${t.title}'>${t.title}</h1>
      <div class='flex flex-col items-center justify-center space-y-4 mt-8'>
        <button class='w-48 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded focus:outline-none focus:ring-4 focus:ring-green-400' id='start-game' aria-label='${t.startGame}' tabindex='0'>${t.startGame}</button>
        <button class='w-48 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded focus:outline-none focus:ring-4 focus:ring-yellow-400' id='multiplayer' aria-label='${t.multiplayer}' tabindex='0'>${t.multiplayer}</button>
        <button class='w-48 px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded focus:outline-none focus:ring-4 focus:ring-gray-400' id='options' aria-label='${t.options}' tabindex='0'>${t.options}</button>
        <button class='w-48 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded focus:outline-none focus:ring-4 focus:ring-purple-400' id='leaderboard' aria-label='${t.leaderboard}' tabindex='0'>${t.leaderboard}</button>
        <button class='w-48 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded focus:outline-none focus:ring-4 focus:ring-blue-400' id='pong' aria-label='Pong Game' tabindex='0'>Pong Game</button>
      </div>`;
    }
    app.innerHTML = langSwitcherUI(lang) + accessibilityTogglesUI() + `<div class='fixed top-4 right-4 z-50'><button class='px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded focus:outline-none focus:ring-4 focus:ring-blue-400' aria-label='${t.login}' tabindex='0' id='login-btn'>${t.login}</button></div>` + content;
    attachMenuListeners();
    attachLangListener();
    attachAccessibilityListeners();
    attachLoginListeners();
    attachPongListeners();
}
function attachMenuListeners() {
    var _a, _b, _c, _d, _e;
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
    (_e = document.getElementById('pong')) === null || _e === void 0 ? void 0 : _e.addEventListener('click', () => {
        window.location.hash = '#pong';
    });
}
function attachLangListener() {
    var _a;
    (_a = document.getElementById('lang-select')) === null || _a === void 0 ? void 0 : _a.addEventListener('change', (e) => {
        const lang = e.target.value;
        setLang(lang);
    });
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
    var _a, _b;
    (_a = document.getElementById('login-btn')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', () => {
        window.location.hash = '#login';
    });
    (_b = document.getElementById('back-home')) === null || _b === void 0 ? void 0 : _b.addEventListener('click', () => {
        window.location.hash = '';
    });
    const form = document.getElementById('auth-form');
    if (form) {
        form.addEventListener('submit', (e) => __awaiter(this, void 0, void 0, function* () {
            e.preventDefault();
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;
            const isRegister = document.getElementById('register-toggle').checked;
            const errorDiv = document.getElementById('auth-error');
            if (!username || !password) {
                if (errorDiv) {
                    errorDiv.textContent = 'Username and password required.';
                    errorDiv.classList.remove('hidden');
                }
                return;
            }
            if (errorDiv)
                errorDiv.classList.add('hidden');
            // Send request to backend for login/register
            try {
                const endpoint = isRegister ? 'register' : 'login';
                // Use backend service name for Docker Compose networking
                const response = yield fetch('http://emanuele-backend:4000/api/' + endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                const data = yield response.json();
                if (!response.ok) {
                    if (errorDiv) {
                        errorDiv.textContent = data.message || 'Authentication failed.';
                        errorDiv.classList.remove('hidden');
                    }
                    return;
                }
                // Success: you can store token, redirect, etc.
                alert((isRegister ? 'Registered' : 'Logged in') + ' as ' + username);
                window.location.hash = '';
            }
            catch (err) {
                if (errorDiv) {
                    errorDiv.textContent = 'Network error.';
                    errorDiv.classList.remove('hidden');
                }
            }
        }));
    }
}
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
            if (statusDiv)
                statusDiv.textContent = 'Game started! (logic not implemented yet)';
            drawPongSkeleton(canvas);
        });
    }
}
function drawPongSkeleton(canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx)
        return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw left paddle
    ctx.fillStyle = '#fff';
    ctx.fillRect(20, canvas.height / 2 - 40, 10, 80);
    // Draw right paddle
    ctx.fillStyle = '#fff';
    ctx.fillRect(canvas.width - 30, canvas.height / 2 - 40, 10, 80);
    // Draw ball
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.closePath();
}
window.addEventListener('hashchange', () => {
    render(window.location.hash.replace('#', ''));
});
// Initial render
render(window.location.hash.replace('#', ''));
