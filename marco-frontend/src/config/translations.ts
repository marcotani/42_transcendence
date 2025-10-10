// Multilanguage translations
export const translations: Record<'en'|'it'|'fr', {
  title: string;
  login: string;
  startGame: string;
  tournament: string;
  options: string;
  leaderboard: string;
  startGameTitle: string;
  startGameDesc: string;
  tournamentTitle: string;
  tournamentDesc: string;
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
    tournament: "🏆 Tournament",
    options: "Options",
    leaderboard: "Leaderboard",
    startGameTitle: "Start Game",
    startGameDesc: "Game setup will go here.",
    tournamentTitle: "Tournament",
    tournamentDesc: "Tournament mode for multiple players.",
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
    tournament: "🏆 Torneo",
    options: "Opzioni",
    leaderboard: "Classifica",
    startGameTitle: "Inizia Gioco",
    startGameDesc: "La configurazione del gioco sarà qui.",
    tournamentTitle: "Torneo",
    tournamentDesc: "Modalità torneo per più giocatori.",
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
    tournament: "🏆 Tournoi",
    options: "Options",
    leaderboard: "Classement",
    startGameTitle: "Démarrer le jeu",
    startGameDesc: "La configuration du jeu sera ici.",
    tournamentTitle: "Tournoi",
    tournamentDesc: "Mode tournoi pour plusieurs joueurs.",
    optionsTitle: "Options",
    optionsDesc: "Les paramètres seront ici.",
    leaderboardTitle: "Classement",
    leaderboardDesc: "Les statistiques du classement seront ici.",
    langLabel: "Langue"
  }
};