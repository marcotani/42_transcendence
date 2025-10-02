// Game settings management service

export interface GameSettings {
  ballSpeed: number;
  paddleSpeed: number;
  pointsToWin: number;
  powerUpsEnabled: boolean;
  powerUpSpawnInterval: number; // seconds
}

export class GameSettingsService {
  private static readonly STORAGE_KEY = 'pong-game-settings';

  static getDefault(): GameSettings {
    return {
      ballSpeed: 3,
      paddleSpeed: 5,
      pointsToWin: 11,
      powerUpsEnabled: true,
      powerUpSpawnInterval: 15 // spawn every 15 seconds
    };
  }

  static save(settings: GameSettings): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
  }

  static load(): GameSettings {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        return { ...this.getDefault(), ...JSON.parse(saved) };
      } catch {
        return this.getDefault();
      }
    }
    return this.getDefault();
  }
}