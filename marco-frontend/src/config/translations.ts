// Multilanguage translations
export const translations: Record<'en'|'it'|'fr', {
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