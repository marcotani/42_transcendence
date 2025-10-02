import { API_BASE } from '../config/constants.js';
import { GameSettingsService } from '../services/game-settings.js';

// Power-up types and their effects
export enum PowerUpType {
  EXTENDED_PADDLE = 'extended_paddle',
  MULTI_BALL = 'multi_ball',
  SPEED_BOOST = 'speed_boost',
  SLOW_MOTION = 'slow_motion'
}

export interface PowerUp {
  id: number;
  type: PowerUpType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  active: boolean;
  color: string;
  name: string;
  description: string;
}

export interface ActiveEffect {
  type: PowerUpType;
  duration: number;
  startTime: number;
  side?: 'left' | 'right'; // For paddle-specific effects
}

export class PongEngine {
  private static isGameRunning = false;

  /**
   * Get random power-up type
   */
  private static getRandomPowerUpType(): PowerUpType {
    const types = [
      PowerUpType.EXTENDED_PADDLE,
      PowerUpType.MULTI_BALL,
      PowerUpType.SPEED_BOOST,
      PowerUpType.SLOW_MOTION
    ];
    return types[Math.floor(Math.random() * types.length)];
  }

  /**
   * Create a new power-up
   */
  private static createPowerUp(gameState: any, canvas: HTMLCanvasElement): PowerUp {
    const type = PongEngine.getRandomPowerUpType();
    const powerUpConfig = {
      [PowerUpType.EXTENDED_PADDLE]: { color: '#4CAF50', name: 'Extended Paddle', description: 'Increases paddle size' },
      [PowerUpType.MULTI_BALL]: { color: '#FF9800', name: 'Multi Ball', description: 'Spawns extra balls' },
      [PowerUpType.SPEED_BOOST]: { color: '#F44336', name: 'Speed Boost', description: 'Increases ball speed' },
      [PowerUpType.SLOW_MOTION]: { color: '#2196F3', name: 'Slow Motion', description: 'Slows down gameplay' }
    };

    const config = powerUpConfig[type];
    const powerUp: PowerUp = {
      id: gameState.powerUpIdCounter++,
      type,
      x: Math.random() * (canvas.width - 200) + 100, // Keep away from edges
      y: Math.random() * (canvas.height - 100) + 50,
      vx: (Math.random() - 0.5) * 2, // Slow horizontal movement
      vy: (Math.random() - 0.5) * 2, // Slow vertical movement
      active: true,
      color: config.color,
      name: config.name,
      description: config.description
    };

    return powerUp;
  }

  /**
   * Apply power-up effect
   */
  private static applyPowerUpEffect(gameState: any, canvas: HTMLCanvasElement, powerUp: PowerUp, side: 'left' | 'right'): void {
    const effectDuration = 10000; // 10 seconds
    
    switch (powerUp.type) {
      case PowerUpType.EXTENDED_PADDLE:
        if (side === 'left') {
          gameState.leftPaddleHeight = gameState.basePaddleHeight * 1.5;
          PongEngine.addActiveEffect(gameState, { type: powerUp.type, side: 'left' }, effectDuration);
        } else if (side === 'right') {
          gameState.rightPaddleHeight = gameState.basePaddleHeight * 1.5;
          PongEngine.addActiveEffect(gameState, { type: powerUp.type, side: 'right' }, effectDuration);
        }
        break;
        
      case PowerUpType.MULTI_BALL:
        // Spawn 2 additional balls
        for (let i = 0; i < 2; i++) {
          const newBall = {
            x: gameState.ballX + (Math.random() - 0.5) * 100,
            y: gameState.ballY + (Math.random() - 0.5) * 100,
            vx: (Math.random() > 0.5 ? 1 : -1) * gameState.gameSettings.ballSpeed * 0.8,
            vy: (Math.random() - 0.5) * gameState.gameSettings.ballSpeed * 0.6
          };
          gameState.activeBalls.push(newBall);
        }
        break;
        
      case PowerUpType.SPEED_BOOST:
        // Increase main ball speed temporarily
        const speedMultiplier = 1.5;
        gameState.ballVX *= speedMultiplier;
        gameState.ballVY *= speedMultiplier;
        PongEngine.addActiveEffect(gameState, { type: powerUp.type }, effectDuration);
        break;
        
      case PowerUpType.SLOW_MOTION:
        // Slow down everything temporarily
        gameState.ballVX *= 0.6;
        gameState.ballVY *= 0.6;
        gameState.activeBalls.forEach((ball: any) => {
          ball.vx *= 0.6;
          ball.vy *= 0.6;
        });
        PongEngine.addActiveEffect(gameState, { type: powerUp.type }, effectDuration);
        break;
    }
  }

  /**
   * Add active effect
   */
  private static addActiveEffect(gameState: any, effectData: { type: PowerUpType; side?: 'left' | 'right' }, duration: number): void {
    gameState.activeEffects.push({
      type: effectData.type,
      side: effectData.side,
      duration,
      startTime: Date.now()
    });
  }

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
      ballVX: 0, // Start stationary for initial 1-second delay
      ballVY: 0,
      leftPaddleY: canvas.height / 2 - 40,
      rightPaddleY: canvas.height / 2 - 40,
      leftPaddleHeight: 80,
      rightPaddleHeight: 80,
      basePaddleHeight: 80, // Store original paddle height
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
      matchStart: new Date(),
      ballRespawning: true, // Flag to indicate ball is in respawn state
      
      // Power-up system
      powerUps: [] as PowerUp[],
      activeBalls: [] as any[], // Additional balls for multi-ball power-up
      activeEffects: [] as ActiveEffect[],
      powerUpIdCounter: 0,
      lastPowerUpSpawn: Date.now(),
      gameSettings: gameSettings
    };

    // Start ball movement after initial 1-second delay
    setTimeout(() => {
      if (!gameState.gameOver && !gameState.gameAborted) {
        gameState.ballRespawning = false;
        gameState.ballVX = (Math.random() > 0.5 ? 1 : -1) * gameSettings.ballSpeed;
        gameState.ballVY = 0; // Start horizontal only
      }
    }, 1000);

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
      const paddleCenter = gameState.rightPaddleY + gameState.rightPaddleHeight / 2;
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
    if (gameState.downPressed && gameState.leftPaddleY < canvas.height - gameState.leftPaddleHeight) {
      gameState.leftPaddleY += gameState.paddleSpeed;
    }
    gameState.paddleVY = gameState.leftPaddleY - prevPaddleY;
    
    // Update right paddle (AI)
    if (gameState.aiUpPressed && gameState.rightPaddleY > 0) {
      gameState.rightPaddleY -= gameState.paddleSpeed;
    }
    if (gameState.aiDownPressed && gameState.rightPaddleY < canvas.height - gameState.rightPaddleHeight) {
      gameState.rightPaddleY += gameState.paddleSpeed;
    }
    
    // Update ball position (only if not respawning)
    if (!gameState.ballRespawning) {
      gameState.ballX += gameState.ballVX;
      gameState.ballY += gameState.ballVY;
      
      // Ball collision with top/bottom
      if (gameState.ballY < 10 || gameState.ballY > canvas.height - 10) {
        gameState.ballVY *= -1;
      }
    }
    
    // Ball collision with paddles (only if not respawning)
    if (!gameState.ballRespawning) {
      // Ball collision with left paddle
      if (
        gameState.ballX - 10 < 30 &&
        gameState.ballY + 10 > gameState.leftPaddleY &&
        gameState.ballY - 10 < gameState.leftPaddleY + gameState.leftPaddleHeight &&
        gameState.ballVX < 0
      ) {
        PongEngine.handlePaddleCollision(gameState, canvas, 'left');
      }
      
      // Ball collision with right paddle
      if (
        gameState.ballX + 10 > canvas.width - 30 &&
        gameState.ballY + 10 > gameState.rightPaddleY &&
        gameState.ballY - 10 < gameState.rightPaddleY + gameState.rightPaddleHeight &&
        gameState.ballVX > 0
      ) {
        PongEngine.handlePaddleCollision(gameState, canvas, 'right');
      }
    }
    
    // Update power-ups (if enabled)
    if (gameState.gameSettings.powerUpsEnabled) {
      PongEngine.updatePowerUps(gameState, canvas);
    }
    
    // Update active effects
    PongEngine.updateActiveEffects(gameState);
    
    // Update additional balls from multi-ball power-up
    PongEngine.updateAdditionalBalls(gameState, canvas, statusDiv, aiInterval);
    
    // Check for scoring
    PongEngine.checkScoring(gameState, canvas, statusDiv, aiInterval);
  }

  /**
   * Handle paddle collision
   */
  private static handlePaddleCollision(gameState: any, canvas: HTMLCanvasElement, side: 'left' | 'right'): void {
    console.log('Paddle collision detected!', side, 'Ball position:', gameState.ballX, gameState.ballY);
    console.log('Paddle heights:', gameState.leftPaddleHeight, gameState.rightPaddleHeight);
    
    if (side === 'left') {
      gameState.ballX = 30 + 10;
      const hitPos = ((gameState.ballY - gameState.leftPaddleY) / gameState.leftPaddleHeight) * 2 - 1;
      let speed = Math.sqrt(gameState.ballVX * gameState.ballVX + gameState.ballVY * gameState.ballVY);
      const angle = hitPos * Math.PI / 4;
      gameState.ballVX = Math.abs(speed * Math.cos(angle));
      gameState.ballVY = speed * Math.sin(angle);
      gameState.ballVY += gameState.paddleVY * 0.7; // Add spin
    } else {
      gameState.ballX = canvas.width - 30 - 10;
      const hitPos = ((gameState.ballY - gameState.rightPaddleY) / gameState.rightPaddleHeight) * 2 - 1;
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
    
    console.log('After collision - Ball velocity:', gameState.ballVX, gameState.ballVY);
    console.log('After collision - Ball position:', gameState.ballX, gameState.ballY);
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
        if (statusDiv) {
          statusDiv.textContent = `Ball respawning...`;
        }
        setTimeout(() => {
          if (statusDiv) {
            statusDiv.textContent = `Score: ${gameState.leftScore} - ${gameState.rightScore}`;
          }
        }, 1200); // Slightly longer than respawn delay
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
        if (statusDiv) {
          statusDiv.textContent = `Ball respawning...`;
        }
        setTimeout(() => {
          if (statusDiv) {
            statusDiv.textContent = `Score: ${gameState.leftScore} - ${gameState.rightScore}`;
          }
        }, 1200); // Slightly longer than respawn delay
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
    
    // Reset ball to center
    gameState.ballX = canvas.width / 2;
    gameState.ballY = canvas.height / 2;
    
    // Stop ball movement initially
    gameState.ballVX = 0;
    gameState.ballVY = 0;
    
    // Add ball respawn delay flag
    gameState.ballRespawning = true;
    
    // After 1 second, start ball movement horizontally
    setTimeout(() => {
      if (!gameState.gameOver && !gameState.gameAborted) {
        gameState.ballRespawning = false;
        // Start with purely horizontal movement (no vertical component)
        gameState.ballVX = (Math.random() > 0.5 ? 1 : -1) * gameSettings.ballSpeed;
        gameState.ballVY = 0; // Start horizontal only
      }
    }, 1000);
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
    ctx.fillRect(20, gameState.leftPaddleY, gameState.paddleWidth, gameState.leftPaddleHeight);
    ctx.fillStyle = '#fff';
    ctx.fillRect(canvas.width - 30, gameState.rightPaddleY, gameState.paddleWidth, gameState.rightPaddleHeight);
    
    // Draw ball
    ctx.beginPath();
    ctx.arc(gameState.ballX, gameState.ballY, 10, 0, Math.PI * 2);
    
    // Different visual style when respawning
    if (gameState.ballRespawning) {
      // Blinking effect during respawn (use time-based blinking)
      const blinkRate = 300; // milliseconds
      const shouldShow = Math.floor(Date.now() / blinkRate) % 2 === 0;
      if (shouldShow) {
        ctx.fillStyle = '#ff6b6b'; // Red color to indicate respawn
        ctx.fill();
      }
    } else {
      ctx.fillStyle = '#fff';
      ctx.fill();
    }
    ctx.closePath();
    
    // Draw additional balls from multi-ball power-up
    gameState.activeBalls.forEach((ball: any) => {
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, 8, 0, Math.PI * 2); // Slightly smaller than main ball
      ctx.fillStyle = '#ffeb3b'; // Yellow color for extra balls
      ctx.fill();
      ctx.closePath();
    });
    
    // Draw power-ups
    if (gameState.gameSettings.powerUpsEnabled) {
      gameState.powerUps.forEach((powerUp: PowerUp) => {
        if (powerUp.active) {
          // Draw power-up circle
          ctx.beginPath();
          ctx.arc(powerUp.x, powerUp.y, 15, 0, Math.PI * 2);
          ctx.fillStyle = powerUp.color;
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.closePath();
          
          // Draw power-up icon/text
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(powerUp.type.charAt(0).toUpperCase(), powerUp.x, powerUp.y + 4);
        }
      });
    }
    
    // Draw active effects indicator
    if (gameState.activeEffects.length > 0) {
      ctx.fillStyle = '#fff';
      ctx.font = '14px Arial';
      ctx.textAlign = 'left';
      let yOffset = 60;
      gameState.activeEffects.forEach((effect: ActiveEffect) => {
        const remaining = Math.ceil((effect.duration - (Date.now() - effect.startTime)) / 1000);
        ctx.fillText(`${effect.type.replace('_', ' ').toUpperCase()}: ${remaining}s`, 10, yOffset);
        yOffset += 20;
      });
    }
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
   * Update power-ups - spawn, move, and check collisions
   */
  private static updatePowerUps(gameState: any, canvas: HTMLCanvasElement): void {
    const now = Date.now();
    
    // Spawn new power-up if enough time has passed
    if (now - gameState.lastPowerUpSpawn > gameState.gameSettings.powerUpSpawnInterval * 1000) {
      if (gameState.powerUps.length < 3) { // Max 3 power-ups at once
        const powerUp = PongEngine.createPowerUp(gameState, canvas);
        gameState.powerUps.push(powerUp);
        gameState.lastPowerUpSpawn = now;
      }
    }
    
    // Update existing power-ups
    gameState.powerUps = gameState.powerUps.filter((powerUp: PowerUp) => {
      if (!powerUp.active) return false;
      
      // Move power-up
      powerUp.x += powerUp.vx;
      powerUp.y += powerUp.vy;
      
      // Bounce off walls
      if (powerUp.x < 15 || powerUp.x > canvas.width - 15) {
        powerUp.vx *= -1;
      }
      if (powerUp.y < 15 || powerUp.y > canvas.height - 15) {
        powerUp.vy *= -1;
      }
      
      // Keep within bounds
      powerUp.x = Math.max(15, Math.min(canvas.width - 15, powerUp.x));
      powerUp.y = Math.max(15, Math.min(canvas.height - 15, powerUp.y));
      
      // Check collision with left paddle
      if (
        powerUp.x > 15 && powerUp.x < 35 &&
        powerUp.y > gameState.leftPaddleY - 15 &&
        powerUp.y < gameState.leftPaddleY + gameState.leftPaddleHeight + 15
      ) {
        PongEngine.applyPowerUpEffect(gameState, canvas, powerUp, 'left');
        powerUp.active = false;
        return false;
      }
      
      // Check collision with right paddle (AI)
      if (
        powerUp.x > canvas.width - 35 && powerUp.x < canvas.width - 15 &&
        powerUp.y > gameState.rightPaddleY - 15 &&
        powerUp.y < gameState.rightPaddleY + gameState.rightPaddleHeight + 15
      ) {
        PongEngine.applyPowerUpEffect(gameState, canvas, powerUp, 'right');
        powerUp.active = false;
        return false;
      }
      
      return true;
    });
  }

  /**
   * Update active effects and remove expired ones
   */
  private static updateActiveEffects(gameState: any): void {
    const now = Date.now();
    
    gameState.activeEffects = gameState.activeEffects.filter((effect: ActiveEffect) => {
      const elapsed = now - effect.startTime;
      
      if (elapsed >= effect.duration) {
        // Remove effect
        switch (effect.type) {
          case PowerUpType.EXTENDED_PADDLE:
            if (effect.side === 'left') {
              gameState.leftPaddleHeight = gameState.basePaddleHeight;
            } else if (effect.side === 'right') {
              gameState.rightPaddleHeight = gameState.basePaddleHeight;
            }
            break;
          case PowerUpType.SPEED_BOOST:
            // Reset speed (will be handled by normal game logic)
            break;
          case PowerUpType.SLOW_MOTION:
            // Reset speed (will be handled by normal game logic)
            break;
        }
        return false;
      }
      
      return true;
    });
  }

  /**
   * Update additional balls from multi-ball power-up
   */
  private static updateAdditionalBalls(gameState: any, canvas: HTMLCanvasElement, statusDiv: HTMLElement | null, aiInterval: number): void {
    gameState.activeBalls = gameState.activeBalls.filter((ball: any) => {
      // Update ball position
      ball.x += ball.vx;
      ball.y += ball.vy;
      
      // Ball collision with top/bottom
      if (ball.y < 10 || ball.y > canvas.height - 10) {
        ball.vy *= -1;
      }
      
      // Ball collision with left paddle
      if (
        ball.x - 10 < 30 &&
        ball.y + 10 > gameState.leftPaddleY &&
        ball.y - 10 < gameState.leftPaddleY + gameState.leftPaddleHeight &&
        ball.vx < 0
      ) {
        PongEngine.handleBallPaddleCollision(ball, gameState, canvas, 'left');
      }
      
      // Ball collision with right paddle
      if (
        ball.x + 10 > canvas.width - 30 &&
        ball.y + 10 > gameState.rightPaddleY &&
        ball.y - 10 < gameState.rightPaddleY + gameState.rightPaddleHeight &&
        ball.vx > 0
      ) {
        PongEngine.handleBallPaddleCollision(ball, gameState, canvas, 'right');
      }
      
      // Check if ball scored (remove it, don't respawn)
      if (ball.x < 0) {
        gameState.rightScore++;
        if (statusDiv) {
          statusDiv.textContent = `Right Player scores! Score: ${gameState.leftScore} - ${gameState.rightScore}`;
        }
        if (gameState.rightScore >= gameState.pointsToWin) {
          PongEngine.endGame(gameState, 'loss', statusDiv, aiInterval);
        }
        return false; // Remove this ball
      } else if (ball.x > canvas.width) {
        gameState.leftScore++;
        if (statusDiv) {
          statusDiv.textContent = `Left Player scores! Score: ${gameState.leftScore} - ${gameState.rightScore}`;
        }
        if (gameState.leftScore >= gameState.pointsToWin) {
          PongEngine.endGame(gameState, 'win', statusDiv, aiInterval);
        }
        return false; // Remove this ball
      }
      
      return true; // Keep this ball
    });
  }

  /**
   * Handle ball-paddle collision for additional balls
   */
  private static handleBallPaddleCollision(ball: any, gameState: any, canvas: HTMLCanvasElement, side: 'left' | 'right'): void {
    if (side === 'left') {
      ball.x = 30 + 10;
      const hitPos = ((ball.y - gameState.leftPaddleY) / gameState.leftPaddleHeight) * 2 - 1;
      let speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
      const angle = hitPos * Math.PI / 4;
      ball.vx = Math.abs(speed * Math.cos(angle));
      ball.vy = speed * Math.sin(angle);
    } else {
      ball.x = canvas.width - 30 - 10;
      const hitPos = ((ball.y - gameState.rightPaddleY) / gameState.rightPaddleHeight) * 2 - 1;
      let speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
      const angle = hitPos * Math.PI / 4;
      ball.vx = -Math.abs(speed * Math.cos(angle));
      ball.vy = speed * Math.sin(angle);
    }
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