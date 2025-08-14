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
  </div>`
};

let loggedInUser: string | null = null;

function render(route: string) {
  const lang = getLang();
  const t = translations[lang];
  const app = document.getElementById('app');
  if (!app) return;
  let content = '';
  if (route === 'pong') {
    content = routes['pong'];
  } else if (route === 'login') {
    content = routes['login'];
  } else if (route === 'register') {
    content = routes['register'];
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
                <td class='px-4 py-2'>70%</</td>
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
    topRightUI = `<div class='fixed top-4 right-4 z-50 flex items-center space-x-2'>
      <span class='px-4 py-2 bg-gray-800 text-white rounded border border-gray-700'>${loggedInUser}</span>
      <button id='logout-btn' class='px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded focus:outline-none focus:ring-4 focus:ring-red-400'>Logout</button>
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
  attachLogoutListener();
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
        const response = await fetch('http://localhost:3000/api/login', {
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
        loggedInUser = data.user.username;
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
        const response = await fetch('http://localhost:3000/api/register', {
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

function attachLogoutListener() {
  document.getElementById('logout-btn')?.addEventListener('click', () => {
    loggedInUser = null;
    render(window.location.hash.replace('#', ''));
  });
}

function drawPongSkeleton(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
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

  function update() {
    if (upPressed && leftPaddleY > 0) leftPaddleY -= paddleSpeed;
    if (downPressed && leftPaddleY < canvas.height - paddleHeight) leftPaddleY += paddleSpeed;
    ballX += ballVX;
    ballY += ballVY;
    // Ball collision with top/bottom
    if (ballY < 10 || ballY > canvas.height - 10) ballVY *= -1;
    // Ball collision with left paddle
    if (ballX - 10 < 30 && ballY > leftPaddleY && ballY < leftPaddleY + paddleHeight) ballVX *= -1;
    // Ball collision with right paddle
    if (ballX + 10 > canvas.width - 30 && ballY > rightPaddleY && ballY < rightPaddleY + paddleHeight) ballVX *= -1;
    // Ball out of bounds
    if (ballX < 0) {
      gameOver = true;
      if (statusDiv) statusDiv.textContent = 'Game Over! Right player wins.';
    }
    if (ballX > canvas.width) {
      gameOver = true;
      if (statusDiv) statusDiv.textContent = 'Game Over! Left player wins.';
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

  // Simple AI for right paddle
  function aiMove() {
    if (ballY < rightPaddleY + paddleHeight / 2 && rightPaddleY > 0) rightPaddleY -= paddleSpeed;
    if (ballY > rightPaddleY + paddleHeight / 2 && rightPaddleY < canvas.height - paddleHeight) rightPaddleY += paddleSpeed;
  }
  function aiLoop() {
    if (gameOver) return;
    aiMove();
    setTimeout(aiLoop, 20);
  }
  aiLoop();

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

window.addEventListener('hashchange', () => {
  render(window.location.hash.replace('#', ''));
});

// Initial render
render(window.location.hash.replace('#', ''));
