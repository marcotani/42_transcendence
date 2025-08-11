"use strict";
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
// SPA navigation logic
const routes = {
    'home': `<h1 class="text-4xl font-bold mb-4">Pong Game</h1>
    <div class="flex flex-col items-center justify-center space-y-4 mt-8">
      <button class="w-48 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-green-400" id="start-game">Start Game</button>
      <button class="w-48 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-yellow-400" id="multiplayer">Multiplayer</button>
      <button class="w-48 px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded focus:outline-none focus:ring-2 focus:ring-gray-400" id="options">Options</button>
      <button class="w-48 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-purple-400" id="leaderboard">Leaderboard</button>
    </div>`,
    'start-game': `<h2 class="text-2xl font-bold mb-4">Start Game</h2><p>Game setup will go here.</p>`,
    'multiplayer': `<h2 class="text-2xl font-bold mb-4">Multiplayer</h2><p>Multiplayer options will go here.</p>`,
    'options': `<h2 class="text-2xl font-bold mb-4">Options</h2><p>Settings will go here.</p>`,
    'leaderboard': `<h2 class="text-2xl font-bold mb-4">Leaderboard</h2><p>Leaderboard stats will go here.</p>`
};
function render(route) {
    const lang = getLang();
    const t = translations[lang];
    const app = document.getElementById('app');
    if (!app)
        return;
    let content = '';
    if (route === 'start-game') {
        content = `<h2 class='text-2xl font-bold mb-4'>${t.startGameTitle}</h2><p>${t.startGameDesc}</p>`;
    }
    else if (route === 'multiplayer') {
        content = `<h2 class='text-2xl font-bold mb-4'>${t.multiplayerTitle}</h2><p>${t.multiplayerDesc}</p>`;
    }
    else if (route === 'options') {
        content = `<h2 class='text-2xl font-bold mb-4'>${t.optionsTitle}</h2><p>${t.optionsDesc}</p>`;
    }
    else if (route === 'leaderboard') {
        content = `<h2 class='text-2xl font-bold mb-4'>${t.leaderboardTitle}</h2><p>${t.leaderboardDesc}</p>`;
    }
    else {
        content = `<h1 class='text-4xl font-bold mb-4'>${t.title}</h1>
      <div class='flex flex-col items-center justify-center space-y-4 mt-8'>
        <button class='w-48 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-green-400' id='start-game'>${t.startGame}</button>
        <button class='w-48 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-yellow-400' id='multiplayer'>${t.multiplayer}</button>
        <button class='w-48 px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded focus:outline-none focus:ring-2 focus:ring-gray-400' id='options'>${t.options}</button>
        <button class='w-48 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-purple-400' id='leaderboard'>${t.leaderboard}</button>
      </div>`;
    }
    app.innerHTML = langSwitcherUI(lang) + `<div class='fixed top-4 right-4 z-50'><button class='px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-400' aria-label='Login'>${t.login}</button></div>` + content;
    attachMenuListeners();
    attachLangListener();
}
function attachMenuListeners() {
    var _a, _b, _c, _d;
    (_a = document.getElementById('start-game')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', () => {
        window.location.hash = '#start-game';
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
}
function attachLangListener() {
    var _a;
    (_a = document.getElementById('lang-select')) === null || _a === void 0 ? void 0 : _a.addEventListener('change', (e) => {
        const lang = e.target.value;
        setLang(lang);
    });
}
window.addEventListener('hashchange', () => {
    render(window.location.hash.replace('#', ''));
});
// Initial render
render(window.location.hash.replace('#', ''));
