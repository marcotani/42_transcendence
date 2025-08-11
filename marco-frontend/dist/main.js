"use strict";
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
    const app = document.getElementById('app');
    if (!app)
        return;
    // Keep the login button fixed
    app.innerHTML = `<div class='fixed top-4 right-4 z-50'><button class='px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-400' aria-label='Login'>Login</button></div>` + (routes[route] || routes['home']);
    attachMenuListeners();
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
window.addEventListener('hashchange', () => {
    render(window.location.hash.replace('#', ''));
});
// Initial render
render(window.location.hash.replace('#', ''));
