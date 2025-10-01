import { API_BASE } from '../config/constants.js';
import { GameSettingsService } from '../services/game-settings.js';

export class PongEngine {
  private static isGameRunning = false;

  /**
   * Start a new Pong game
   */
  static startGame(canvas: HTMLCanvasElement, statusDiv: HTMLElement | null): void {
    // Prevent multiple game instances
    if (PongEngine.isGameRunning) {
      console.log('Game already running, ignoring start request');
      return;
    }
    
    PongEngine.isGameRunning = true;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      PongEngine.isGameRunning = false;
      return;
    }

    // Load game settings
    const gameSettings = GameSettingsService.load();
    
    // Game state
    const gameState = {
      ballX: canvas.width / 2,
      ballY: canvas.height / 2,
      ballVX: gameSettings.ballSpeed,
      ballVY: gameSettings.ballSpeed * 0.7,
      leftPaddleY: canvas.height / 2 - 40,
      rightPaddleY: canvas.height / 2 - 40,
      paddleHeight: 80,
      paddleWidth: 10,
      paddleSpeed: gameSettings.paddleSpeed,
      upPressed: false,
      downPressed: false,
      gameOver: false,
      gameAborted: false,
      paddleVY: 0,
      leftScore: 0,
      rightScore: 0,
      pointsToWin: gameSettings.pointsToWin,
      aiUpPressed: false,
      aiDownPressed: false,
      userPaddleColor: '#FFFFFF',
      matchStart: new Date()
    };

    // Initialize user paddle color
    const loggedInUser = (window as any).loggedInUser;
    if (loggedInUser) {
      fetch(`${API_BASE}/users/${loggedInUser}`)
        .then(res => res.json())
        .then(user => {
          gameState.userPaddleColor = user.profile?.skinColor || '#FFFFFF';
        });
    }

    // Start AI and game loop
    const aiInterval = PongEngine.startAI(gameState, canvas);
    PongEngine.initializeControls(gameState);
    
    if (statusDiv) {
      statusDiv.textContent = `Game started! Score: ${gameState.leftScore} - ${gameState.rightScore}. Use Arrow Up/Down to move left paddle.`;
    }
    
    PongEngine.gameLoop(ctx, canvas, gameState, statusDiv, aiInterval);
    PongEngine.setupCleanup(gameState, aiInterval);
  }

  /**
   * Start AI for the right paddle
   */
  private static startAI(gameState: any, canvas: HTMLCanvasElement): number {
    const aiDecideMove = () => {
      const paddleCenter = gameState.rightPaddleY + gameState.paddleHeight / 2;
      let predictedY = gameState.ballY;
      let predictedVY = gameState.ballVY;
      let predictedVX = gameState.ballVX;
      let predictedX = gameState.ballX;
      
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
      
      const deadzone = 30;
      if (Math.abs(predictedY - paddleCenter) > deadzone) {
        if (predictedY < paddleCenter) {
          gameState.aiUpPressed = true;
          gameState.aiDownPressed = false;
        } else {
          gameState.aiUpPressed = false;
          gameState.aiDownPressed = true;
        }
      } else {
        gameState.aiUpPressed = false;
        gameState.aiDownPressed = false;
      }
    };

    aiDecideMove();
    return window.setInterval(aiDecideMove, 1000);
  }

  /**
   * Initialize keyboard controls
   */
  private static initializeControls(gameState: any): void {
    const keyDownHandler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') gameState.upPressed = true;
      if (e.key === 'ArrowDown') gameState.downPressed = true;
    };
    
    const keyUpHandler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') gameState.upPressed = false;
      if (e.key === 'ArrowDown') gameState.downPressed = false;
    };
    
    document.addEventListener('keydown', keyDownHandler);
    document.addEventListener('keyup', keyUpHandler);
    
    // Store handlers for cleanup
    gameState.keyDownHandler = keyDownHandler;
    gameState.keyUpHandler = keyUpHandler;
  }

  /**
   * Main game loop
   */
  private static gameLoop(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    gameState: any,
    statusDiv: HTMLElement | null,
    aiInterval: number
  ): void {
    const loop = () => {
      if (gameState.gameOver) return;
      PongEngine.update(canvas, gameState, statusDiv, aiInterval);
      PongEngine.draw(ctx, canvas, gameState);
      requestAnimationFrame(loop);
    };
    loop();
  }

  /**
   * Update game state
   */
  private static update(
    canvas: HTMLCanvasElement,
    gameState: any,
    statusDiv: HTMLElement | null,
    aiInterval: number
  ): void {
    // Early exit if game was aborted
    if (gameState.gameAborted || gameState.gameOver) return;
    
    // Update left paddle
    const prevPaddleY = gameState.leftPaddleY;
    if (gameState.upPressed && gameState.leftPaddleY > 0) {
      gameState.leftPaddleY -= gameState.paddleSpeed;
    }
    if (gameState.downPressed && gameState.leftPaddleY < canvas.height - gameState.paddleHeight) {
      gameState.leftPaddleY += gameState.paddleSpeed;
    }
    gameState.paddleVY = gameState.leftPaddleY - prevPaddleY;
    
    // Update right paddle (AI)
    if (gameState.aiUpPressed && gameState.rightPaddleY > 0) {
      gameState.rightPaddleY -= gameState.paddleSpeed;
    }
    if (gameState.aiDownPressed && gameState.rightPaddleY < canvas.height - gameState.paddleHeight) {
      gameState.rightPaddleY += gameState.paddleSpeed;
    }
    
    // Update ball position
    gameState.ballX += gameState.ballVX;
    gameState.ballY += gameState.ballVY;
    
    // Ball collision with top/bottom
    if (gameState.ballY < 10 || gameState.ballY > canvas.height - 10) {
      gameState.ballVY *= -1;
    }
    
    // Ball collision with left paddle
    if (
      gameState.ballX - 10 < 30 &&
      gameState.ballY + 10 > gameState.leftPaddleY &&
      gameState.ballY - 10 < gameState.leftPaddleY + gameState.paddleHeight &&
      gameState.ballVX < 0
    ) {
      PongEngine.handlePaddleCollision(gameState, canvas, 'left');
    }
    
    // Ball collision with right paddle
    if (
      gameState.ballX + 10 > canvas.width - 30 &&
      gameState.ballY + 10 > gameState.rightPaddleY &&
      gameState.ballY - 10 < gameState.rightPaddleY + gameState.paddleHeight &&
      gameState.ballVX > 0
    ) {
      PongEngine.handlePaddleCollision(gameState, canvas, 'right');
    }
    
    // Check for scoring
    PongEngine.checkScoring(gameState, canvas, statusDiv, aiInterval);
  }

  /**
   * Handle paddle collision
   */
  private static handlePaddleCollision(gameState: any, canvas: HTMLCanvasElement, side: 'left' | 'right'): void {
    if (side === 'left') {
      gameState.ballX = 30 + 10;
      const hitPos = ((gameState.ballY - gameState.leftPaddleY) / gameState.paddleHeight) * 2 - 1;
      let speed = Math.sqrt(gameState.ballVX * gameState.ballVX + gameState.ballVY * gameState.ballVY);
      const angle = hitPos * Math.PI / 4;
      gameState.ballVX = Math.abs(speed * Math.cos(angle));
      gameState.ballVY = speed * Math.sin(angle);
      gameState.ballVY += gameState.paddleVY * 0.7; // Add spin
    } else {
      gameState.ballX = canvas.width - 30 - 10;
      const hitPos = ((gameState.ballY - gameState.rightPaddleY) / gameState.paddleHeight) * 2 - 1;
      let speed = Math.sqrt(gameState.ballVX * gameState.ballVX + gameState.ballVY * gameState.ballVY);
      const angle = hitPos * Math.PI / 4;
      gameState.ballVX = -Math.abs(speed * Math.cos(angle));
      gameState.ballVY = speed * Math.sin(angle);
    }
    
    // Increase speed slightly
    const newSpeed = Math.min(Math.sqrt(gameState.ballVX * gameState.ballVX + gameState.ballVY * gameState.ballVY) * 1.05, 12);
    const norm = newSpeed / Math.sqrt(gameState.ballVX * gameState.ballVX + gameState.ballVY * gameState.ballVY);
    gameState.ballVX *= norm;
    gameState.ballVY *= norm;
  }

  /**
   * Check for scoring
   */
  private static checkScoring(
    gameState: any,
    canvas: HTMLCanvasElement,
    statusDiv: HTMLElement | null,
    aiInterval: number
  ): void {
    // Left side scoring (right player scores)
    if (gameState.ballX < 0 && !gameState.gameAborted) {
      gameState.rightScore++;
      if (statusDiv) {
        statusDiv.textContent = `Right Player scores! Score: ${gameState.leftScore} - ${gameState.rightScore}`;
      }
      
      if (gameState.rightScore >= gameState.pointsToWin) {
        PongEngine.endGame(gameState, 'loss', statusDiv, aiInterval);
      } else {
        PongEngine.resetBall(gameState, canvas);
        setTimeout(() => {
          if (statusDiv) {
            statusDiv.textContent = `Score: ${gameState.leftScore} - ${gameState.rightScore}`;
          }
        }, 1500);
      }
    }
    
    // Right side scoring (left player scores)
    if (gameState.ballX > canvas.width && !gameState.gameAborted) {
      gameState.leftScore++;
      if (statusDiv) {
        statusDiv.textContent = `Left Player scores! Score: ${gameState.leftScore} - ${gameState.rightScore}`;
      }
      
      if (gameState.leftScore >= gameState.pointsToWin) {
        PongEngine.endGame(gameState, 'win', statusDiv, aiInterval);
      } else {
        PongEngine.resetBall(gameState, canvas);
        setTimeout(() => {
          if (statusDiv) {
            statusDiv.textContent = `Score: ${gameState.leftScore} - ${gameState.rightScore}`;
          }
        }, 1500);
      }
    }
  }

  /**
   * End the game
   */
  private static endGame(
    gameState: any,
    result: 'win' | 'loss',
    statusDiv: HTMLElement | null,
    aiInterval: number
  ): void {
    gameState.gameOver = true;
    PongEngine.isGameRunning = false;
    clearInterval(aiInterval);
    
    const message = result === 'win' 
      ? `Game Over! Left player wins ${gameState.leftScore}-${gameState.rightScore}!`
      : `Game Over! Right player wins ${gameState.rightScore}-${gameState.leftScore}!`;
    
    if (statusDiv) statusDiv.textContent = message;
    
    PongEngine.resetStartButton();
    
    // Send match result
    const matchEnd = new Date();
    PongEngine.sendMatchResult({
      result,
      player1Score: gameState.leftScore,
      player2Score: gameState.rightScore,
      opponent: 'AI',
      startedAt: gameState.matchStart.toISOString(),
      endedAt: matchEnd.toISOString(),
      duration: Math.round((matchEnd.getTime() - gameState.matchStart.getTime()) / 1000)
    });
  }

  /**
   * Reset the ball position and velocity
   */
  private static resetBall(gameState: any, canvas: HTMLCanvasElement): void {
    const gameSettings = GameSettingsService.load();
    gameState.ballX = canvas.width / 2;
    gameState.ballY = canvas.height / 2;
    gameState.ballVX = (Math.random() > 0.5 ? 1 : -1) * gameSettings.ballSpeed;
    gameState.ballVY = (Math.random() > 0.5 ? 1 : -1) * (gameSettings.ballSpeed * 0.7);
  }

  /**
   * Draw the game
   */
  private static draw(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, gameState: any): void {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw scores
    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${gameState.leftScore}`, canvas.width / 4, 40);
    ctx.fillText(`${gameState.rightScore}`, (canvas.width * 3) / 4, 40);
    
    // Draw center line
    ctx.setLineDash([5, 15]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.strokeStyle = '#fff';
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw paddles
    ctx.fillStyle = gameState.userPaddleColor;
    ctx.fillRect(20, gameState.leftPaddleY, gameState.paddleWidth, gameState.paddleHeight);
    ctx.fillStyle = '#fff';
    ctx.fillRect(canvas.width - 30, gameState.rightPaddleY, gameState.paddleWidth, gameState.paddleHeight);
    
    // Draw ball
    ctx.beginPath();
    ctx.arc(gameState.ballX, gameState.ballY, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.closePath();
  }

  /**
   * Send match result to backend
   */
  private static async sendMatchResult(params: {
    result: 'win' | 'loss';
    player1Score: number;
    player2Score: number;
    opponent: string;
    startedAt: string;
    endedAt: string;
    duration: number;
  }): Promise<void> {
    const loggedInUser = (window as any).loggedInUser;
    if (!loggedInUser) return;
    
    try {
      const userRes = await fetch(`${API_BASE}/users/${loggedInUser}`);
      const user = await userRes.json();
      if (!user || !user.id) return;
      
      const winnerId = params.result === 'win' ? user.id : null;
      
      await fetch(`${API_BASE}/matches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player1Id: user.id,
          player2BotName: params.opponent,
          player1Score: params.player1Score,
          player2Score: params.player2Score,
          winnerId,
          matchType: 'bot'
        })
      });
    } catch (e) {
      console.error('Failed to send match result:', e);
    }
  }

  /**
   * Reset the start button
   */
  private static resetStartButton(): void {
    const startBtn = document.getElementById('pong-start') as HTMLButtonElement | null;
    if (startBtn) {
      startBtn.disabled = false;
      startBtn.textContent = 'Start Game';
    }
  }

  /**
   * Setup cleanup handlers
   */
  private static setupCleanup(gameState: any, aiInterval: number): void {
    const cleanup = () => {
      gameState.gameAborted = true;
      gameState.gameOver = true;
      PongEngine.isGameRunning = false;
      PongEngine.resetStartButton();
      clearInterval(aiInterval);
      if (gameState.keyDownHandler && gameState.keyUpHandler) {
        document.removeEventListener('keydown', gameState.keyDownHandler);
        document.removeEventListener('keyup', gameState.keyUpHandler);
      }
    };

    // Clean up on navigation
    window.addEventListener('hashchange', cleanup, { once: true });
    
    // Clean up on page unload
    window.addEventListener('beforeunload', cleanup, { once: true });
  }

  /**
   * Attach Pong page listeners
   */
  static attachPongListeners(): void {
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
        if (PongEngine.isGameRunning) {
          console.log('Game already running, ignoring start request');
          return;
        }
        startBtn.disabled = true;
        startBtn.textContent = 'Game Running...';
        PongEngine.startGame(canvas, statusDiv);
      });
    }
  }
}