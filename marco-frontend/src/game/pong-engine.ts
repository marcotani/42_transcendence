import { API_BASE } from '../config/constants.js';
import { getT } from '../config/translations.js';
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

export interface GameConfig {
  mode: 'ai' | 'player';
  player1: { username: string; profile?: any; id?: number };
  player2?: { username: string; id: number; profile?: any } | null;
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
    const t = getT();
    const powerUpConfig = {
      [PowerUpType.EXTENDED_PADDLE]: { color: '#4CAF50', name: t.powerupExtendedName, description: t.powerupExtendedDesc },
      [PowerUpType.MULTI_BALL]: { color: '#FF9800', name: t.powerupMultiName, description: t.powerupMultiDesc },
      [PowerUpType.SPEED_BOOST]: { color: '#F44336', name: t.powerupSpeedName, description: t.powerupSpeedDesc },
      [PowerUpType.SLOW_MOTION]: { color: '#2196F3', name: t.powerupSlowName, description: t.powerupSlowDesc }
    };

    const config = powerUpConfig[type];
    
    // Ensure horizontal movement - minimum 1.5 speed horizontally
    const horizontalSpeed = (Math.random() > 0.5 ? 1 : -1) * (1.5 + Math.random() * 2); // 1.5 to 3.5
    const verticalSpeed = (Math.random() - 0.5) * 3; // -1.5 to 1.5
    
    const powerUp: PowerUp = {
      id: gameState.powerUpIdCounter++,
      type,
      x: Math.random() * (canvas.width - 200) + 100, // Keep away from edges
      y: Math.random() * (canvas.height - 100) + 50,
      vx: horizontalSpeed,
      vy: verticalSpeed,
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
        // Check if extended paddle is already active for this side
        const hasExtendedPaddle = gameState.activeEffects.some((effect: ActiveEffect) => 
          effect.type === PowerUpType.EXTENDED_PADDLE && effect.side === side
        );
        
        if (!hasExtendedPaddle) {
          if (side === 'left') {
            gameState.leftPaddleHeight = gameState.basePaddleHeight * 1.5;
          } else if (side === 'right') {
            gameState.rightPaddleHeight = gameState.basePaddleHeight * 1.5;
          }
        }
        PongEngine.addActiveEffect(gameState, { type: powerUp.type, side }, effectDuration);
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
        // Check if speed boost is already active
        const hasSpeedBoost = gameState.activeEffects.some((effect: ActiveEffect) => effect.type === PowerUpType.SPEED_BOOST);
        if (!hasSpeedBoost) {
          // Increase main ball speed temporarily - more pronounced effect
          const speedMultiplier = 2.0; // Increased from 1.5 to 2.0
          gameState.ballVX *= speedMultiplier;
          gameState.ballVY *= speedMultiplier;
        }
        PongEngine.addActiveEffect(gameState, { type: powerUp.type }, effectDuration);
        break;
        
      case PowerUpType.SLOW_MOTION:
        // Check if slow motion is already active
        const hasSlowMotion = gameState.activeEffects.some((effect: ActiveEffect) => effect.type === PowerUpType.SLOW_MOTION);
        if (!hasSlowMotion) {
          // Slow down everything temporarily - more pronounced effect
          gameState.ballVX *= 0.4; // Reduced from 0.6 to 0.4
          gameState.ballVY *= 0.4;
          gameState.activeBalls.forEach((ball: any) => {
            ball.vx *= 0.4;
            ball.vy *= 0.4;
          });
        }
        PongEngine.addActiveEffect(gameState, { type: powerUp.type }, effectDuration);
        break;
    }
  }

  /**
   * Add active effect
   */
  private static addActiveEffect(gameState: any, effectData: { type: PowerUpType; side?: 'left' | 'right' }, duration: number): void {
    // Check if there's already an active effect of the same type and side
    const existingEffectIndex = gameState.activeEffects.findIndex((effect: ActiveEffect) => 
      effect.type === effectData.type && effect.side === effectData.side
    );
    
    if (existingEffectIndex !== -1) {
      // Extend the duration of the existing effect
      const existingEffect = gameState.activeEffects[existingEffectIndex];
      const remainingTime = Math.max(0, existingEffect.duration - (Date.now() - existingEffect.startTime));
      existingEffect.startTime = Date.now();
      existingEffect.duration = duration + remainingTime; // Add remaining time to new duration
    } else {
      // Create new effect if none exists
      gameState.activeEffects.push({
        type: effectData.type,
        side: effectData.side,
        duration,
        startTime: Date.now()
      });
    }
  }

  /**
   * Start a new Pong game
   */
  static startGame(canvas: HTMLCanvasElement, statusDiv: HTMLElement | null, gameConfig?: GameConfig): void {
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
      aiLeftPressed: false,
      aiRightPressed: false,
      userPaddleColor: '#FFFFFF',
      player2PaddleColor: '#FFFFFF', // Player 2 paddle color
      matchStart: new Date(),
      ballRespawning: true, // Flag to indicate ball is in respawn state
      
      // Power-up system
      powerUps: [] as PowerUp[],
      activeBalls: [] as any[], // Additional balls for multi-ball power-up
      activeEffects: [] as ActiveEffect[],
      powerUpIdCounter: 0,
      lastPowerUpSpawn: Date.now(),
      gameSettings: gameSettings,
      
      // Game configuration
      gameConfig: gameConfig || { mode: 'ai', player1: { username: 'Guest' } },
      
      // Player 2 controls (for local multiplayer)
      wPressed: false,
      sPressed: false,
      
      // Paddle tilting controls
      aPressed: false, // Player 1 tilt left
      dPressed: false, // Player 1 tilt right
      leftPressed: false, // Player 2 tilt left  
      rightPressed: false, // Player 2 tilt right
      
      // Paddle angles (in radians)
      leftPaddleAngle: 0,
      rightPaddleAngle: 0,
      maxPaddleAngle: Math.PI / 6, // 30 degrees max tilt
      
      // Shooting mechanics
      spacePressed: false, // Player 1 shoot
      enterPressed: false, // Player 2 shoot
      projectiles: [] as any[],
      projectileIdCounter: 0,
      lastShotTime: { left: 0, right: 0 }, // Cooldown tracking
      shotCooldown: 1000, // 1 second cooldown between shots
      
      // Paddle stunning
      leftPaddleStunned: false,
      rightPaddleStunned: false,
      leftPaddleStunEnd: 0,
      rightPaddleStunEnd: 0
    };

    // Start ball movement after initial 1-second delay
    setTimeout(() => {
      if (!gameState.gameOver && !gameState.gameAborted) {
        gameState.ballRespawning = false;
        gameState.ballVX = (Math.random() > 0.5 ? 1 : -1) * gameSettings.ballSpeed;
        gameState.ballVY = 0; // Start horizontal only
      }
    }, 1000);

    // Initialize paddle colors
    // For tournaments and when profile data is available in gameConfig, use that directly
    if (gameState.gameConfig.player1?.profile?.skinColor) {
      gameState.userPaddleColor = gameState.gameConfig.player1.profile.skinColor;
      console.log('Set player1 paddle color from config:', gameState.userPaddleColor, 'for player:', gameState.gameConfig.player1.username);
    } else {
      // Fallback to fetching logged-in user data for regular games
      const loggedInUser = (window as any).loggedInUser;
      if (loggedInUser) {
        fetch(`${API_BASE}/users/${loggedInUser}`)
          .then(res => res.json())
          .then(user => {
            gameState.userPaddleColor = user.profile?.skinColor || '#FFFFFF';
            console.log('Set player1 paddle color from API:', gameState.userPaddleColor);
          });
      }
    }
    
    // Initialize Player 2 paddle color for player vs player mode
    if (gameState.gameConfig.mode === 'player' && gameState.gameConfig.player2) {
      if (gameState.gameConfig.player2.profile?.skinColor) {
        gameState.player2PaddleColor = gameState.gameConfig.player2.profile.skinColor;
        console.log('Set player2 paddle color from config:', gameState.player2PaddleColor, 'for player:', gameState.gameConfig.player2.username);
      } else {
        // Fallback to fetching user data for regular games
        fetch(`${API_BASE}/users/${gameState.gameConfig.player2.username}`)
          .then(res => res.json())
          .then(user => {
            gameState.player2PaddleColor = user.profile?.skinColor || '#FFFFFF';
            console.log('Set player2 paddle color from API:', gameState.player2PaddleColor);
          });
      }
    }

    // Start AI (only for AI mode) and game loop
  const aiInterval = gameState.gameConfig.mode === 'ai' ? PongEngine.startAI(gameState, canvas) : 0;
  PongEngine.initializeControls(gameState);

  // If running on a touch device, request fullscreen and show on-screen controls
  try {
    // Detect touch-capable device. Also fallback to small screens (likely mobile) if touch detection is unreliable.
    const isTouch = ('ontouchstart' in window)
      || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0)
      || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches)
      || window.innerWidth <= 900;
    if (isTouch) {
      // Try to request fullscreen on the canvas parent or the canvas itself
      const target = canvas.parentElement || canvas;

      // Show touch controls overlay (will be removed on cleanup/end). Append to target so they are visible in fullscreen.
      PongEngine.showTouchControls(canvas, gameState, target);

      try {
        const req: any = (target as any).requestFullscreen || (target as any).webkitRequestFullscreen || (target as any).msRequestFullscreen;
        if (typeof req === 'function') {
          req.call(target);
        }
      } catch (e) { /* ignore fullscreen failures */ }

      // When fullscreen changes, resize canvas to fill available area and ensure overlay is inside the fullscreen element
      const fsHandler = () => {
        try {
          const used = document.fullscreenElement || target;
          if (used && canvas) {
            const w = (used as HTMLElement).clientWidth || window.innerWidth;
            const h = (used as HTMLElement).clientHeight || window.innerHeight;
            try {
              // Set CSS to fill the container and also set canvas resolution
              canvas.style.width = '100%';
              canvas.style.height = '100%';
            } catch (e) { /* ignore */ }
            try { canvas.width = w; } catch (e) { /* ignore */ }
            try { canvas.height = h; } catch (e) { /* ignore */ }
          }

          // Move touch overlay into fullscreen element if present so it remains visible
          try {
            const overlay = document.getElementById('touch-controls-overlay');
            if (overlay && used) {
              // If fullscreen element is a canvas, append overlay to its parent (canvas can't host HTML reliably)
              const appendTarget = (used.tagName === 'CANVAS') ? (used.parentElement || document.body) : used;
              try { appendTarget.appendChild(overlay); } catch (e) { document.body.appendChild(overlay); }
              try { console.log('PongEngine: moved touch overlay into fullscreen element', { appendTarget: appendTarget ? (appendTarget as Element).tagName : null }); } catch (e) { /* ignore */ }
            }
          } catch (e) { /* ignore */ }

          // Attempt to lock orientation to landscape while in fullscreen (best-effort)
          try {
            const screenAny: any = screen;
            if (screenAny && screenAny.orientation && typeof screenAny.orientation.lock === 'function') {
              screenAny.orientation.lock('landscape').catch(() => { /* ignore */ });
            }
          } catch (e) { /* ignore */ }
        } catch (e) { /* ignore */ }
      };
      document.addEventListener('fullscreenchange', fsHandler);
      // store for cleanup
      (gameState as any)._touchFsHandler = fsHandler;
    }
  } catch (e) { /* ignore */ }
  // No mobile-specific overlays: keep behavior identical to desktop (no on-screen touch buttons)
    
      if (statusDiv) {
      const t = getT();
      const controlsText = gameState.gameConfig.mode === 'player' 
        ? 'P1: WASD+Space | P2: Arrows+Enter | Tilt to aim!'
        : 'Tank Controls: WS=Move, AD=Tilt, Space=Shoot';
      statusDiv.textContent = `🚀 TANK BATTLE! Score: ${gameState.leftScore} - ${gameState.rightScore}. ${controlsText}`;
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
      
      // AI Tilting Strategy
      const ballDirection = gameState.ballVX > 0 ? 'incoming' : 'outgoing';
      const ballSpeed = Math.sqrt(gameState.ballVX * gameState.ballVX + gameState.ballVY * gameState.ballVY);
      
      if (ballDirection === 'incoming' && Math.abs(gameState.ballX - (canvas.width - 30)) < 100) {
        // Ball is incoming - tilt to aim ball toward player's goal
        const targetY = canvas.height * 0.3; // Aim for difficult spots
        const currentBallY = gameState.ballY;
        
        if (currentBallY > canvas.height / 2) {
          // Ball is in lower half, tilt up to send it to upper corner
          gameState.aiLeftPressed = true;
          gameState.aiRightPressed = false;
        } else {
          // Ball is in upper half, tilt down to send it to lower corner
          gameState.aiLeftPressed = false;
          gameState.aiRightPressed = true;
        }
      } else {
        // Return to neutral when ball is not incoming
        gameState.aiLeftPressed = false;
        gameState.aiRightPressed = false;
      }
      
      // AI Shooting Strategy
      const currentTime = Date.now();
      const timeSinceLastShot = currentTime - (gameState.lastShotTime?.right || 0);
      const canShoot = timeSinceLastShot > gameState.shotCooldown;
      
      // Shoot when ball is coming toward AI and it's a good opportunity
      if (canShoot && !gameState.rightPaddleStunned && ballDirection === 'incoming') {
        const distanceToBall = Math.abs(gameState.ballX - (canvas.width - 30));
        const ballIsInRange = distanceToBall < 150 && distanceToBall > 50;
        
        // Strategic shooting conditions
        const shouldShoot = ballIsInRange && (
          ballSpeed > 6 || // Fast ball - try to slow it down
          Math.abs(gameState.ballY - paddleCenter) > 40 || // Ball not centered - try to hit it
          Math.random() < 0.3 // 30% random aggression
        );
        
        if (shouldShoot) {
          PongEngine.handleShooting(gameState, canvas, 'right');
        }
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
      // Player 1 controls (WASD + Space)
      if (e.key === 'w' || e.key === 'W') gameState.wPressed = true;
      if (e.key === 's' || e.key === 'S') gameState.sPressed = true;
      if (e.key === 'a' || e.key === 'A') gameState.aPressed = true;
      if (e.key === 'd' || e.key === 'D') gameState.dPressed = true;
      if (e.key === ' ') {
        e.preventDefault();
        gameState.spacePressed = true;
      }
      
      // Player 2 controls (arrow keys + Enter) - only for player vs player mode
      if (gameState.gameConfig.mode === 'player') {
        if (e.key === 'ArrowUp') gameState.upPressed = true;
        if (e.key === 'ArrowDown') gameState.downPressed = true;
        if (e.key === 'ArrowLeft') gameState.leftPressed = true;
        if (e.key === 'ArrowRight') gameState.rightPressed = true;
        if (e.key === 'Enter') {
          e.preventDefault();
          gameState.enterPressed = true;
        }
      }
    };
    
    const keyUpHandler = (e: KeyboardEvent) => {
      // Player 1 controls (WASD + Space)
      if (e.key === 'w' || e.key === 'W') gameState.wPressed = false;
      if (e.key === 's' || e.key === 'S') gameState.sPressed = false;
      if (e.key === 'a' || e.key === 'A') gameState.aPressed = false;
      if (e.key === 'd' || e.key === 'D') gameState.dPressed = false;
      if (e.key === ' ') {
        e.preventDefault();
        gameState.spacePressed = false;
      }
      
      // Player 2 controls (arrow keys + Enter) - only for player vs player mode
      if (gameState.gameConfig.mode === 'player') {
        if (e.key === 'ArrowUp') gameState.upPressed = false;
        if (e.key === 'ArrowDown') gameState.downPressed = false;
        if (e.key === 'ArrowLeft') gameState.leftPressed = false;
        if (e.key === 'ArrowRight') gameState.rightPressed = false;
        if (e.key === 'Enter') {
          e.preventDefault();
          gameState.enterPressed = false;
        }
      }
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
    if (gameState.wPressed && gameState.leftPaddleY > 0 && !gameState.leftPaddleStunned) {
      gameState.leftPaddleY -= gameState.paddleSpeed;
    }
    if (gameState.sPressed && gameState.leftPaddleY < canvas.height - gameState.leftPaddleHeight && !gameState.leftPaddleStunned) {
      gameState.leftPaddleY += gameState.paddleSpeed;
    }
    gameState.paddleVY = gameState.leftPaddleY - prevPaddleY;
    
    // Update paddle tilting
    const tiltSpeed = 0.05;
    if (gameState.aPressed && !gameState.leftPaddleStunned) {
      gameState.leftPaddleAngle = Math.max(gameState.leftPaddleAngle - tiltSpeed, -gameState.maxPaddleAngle);
    } else if (gameState.dPressed && !gameState.leftPaddleStunned) {
      gameState.leftPaddleAngle = Math.min(gameState.leftPaddleAngle + tiltSpeed, gameState.maxPaddleAngle);
    } else {
      // Return to center when no tilt key is pressed
      if (gameState.leftPaddleAngle > 0) {
        gameState.leftPaddleAngle = Math.max(0, gameState.leftPaddleAngle - tiltSpeed);
      } else if (gameState.leftPaddleAngle < 0) {
        gameState.leftPaddleAngle = Math.min(0, gameState.leftPaddleAngle + tiltSpeed);
      }
    }
    
    // Handle shooting for Player 1
    if (gameState.spacePressed && !gameState.leftPaddleStunned) {
      PongEngine.handleShooting(gameState, canvas, 'left');
      gameState.spacePressed = false; // Prevent continuous shooting
    }
    
    // Update paddle stunning
    const currentTime = Date.now();
    if (gameState.leftPaddleStunned && currentTime > gameState.leftPaddleStunEnd) {
      gameState.leftPaddleStunned = false;
    }
    if (gameState.rightPaddleStunned && currentTime > gameState.rightPaddleStunEnd) {
      gameState.rightPaddleStunned = false;
    }
    
    // Update right paddle (AI or Player 2)
    if (gameState.gameConfig.mode === 'player') {
      // Player 2 controls (arrow keys)
      if (gameState.upPressed && gameState.rightPaddleY > 0 && !gameState.rightPaddleStunned) {
        gameState.rightPaddleY -= gameState.paddleSpeed;
      }
      if (gameState.downPressed && gameState.rightPaddleY < canvas.height - gameState.rightPaddleHeight && !gameState.rightPaddleStunned) {
        gameState.rightPaddleY += gameState.paddleSpeed;
      }
      
      // Player 2 tilting
      if (gameState.leftPressed && !gameState.rightPaddleStunned) {
        gameState.rightPaddleAngle = Math.max(gameState.rightPaddleAngle - tiltSpeed, -gameState.maxPaddleAngle);
      } else if (gameState.rightPressed && !gameState.rightPaddleStunned) {
        gameState.rightPaddleAngle = Math.min(gameState.rightPaddleAngle + tiltSpeed, gameState.maxPaddleAngle);
      } else {
        // Return to center when no tilt key is pressed
        if (gameState.rightPaddleAngle > 0) {
          gameState.rightPaddleAngle = Math.max(0, gameState.rightPaddleAngle - tiltSpeed);
        } else if (gameState.rightPaddleAngle < 0) {
          gameState.rightPaddleAngle = Math.min(0, gameState.rightPaddleAngle + tiltSpeed);
        }
      }
      
      // Handle shooting for Player 2
      if (gameState.enterPressed && !gameState.rightPaddleStunned) {
        PongEngine.handleShooting(gameState, canvas, 'right');
        gameState.enterPressed = false; // Prevent continuous shooting
      }
    } else {
      // AI controls (now with tilting and shooting!)
      if (gameState.aiUpPressed && gameState.rightPaddleY > 0 && !gameState.rightPaddleStunned) {
        gameState.rightPaddleY -= gameState.paddleSpeed;
      }
      if (gameState.aiDownPressed && gameState.rightPaddleY < canvas.height - gameState.rightPaddleHeight && !gameState.rightPaddleStunned) {
        gameState.rightPaddleY += gameState.paddleSpeed;
      }
      
      // AI tilting (same logic as player 2 but using AI controls)
      if (gameState.aiLeftPressed && !gameState.rightPaddleStunned) {
        gameState.rightPaddleAngle = Math.max(gameState.rightPaddleAngle - tiltSpeed, -gameState.maxPaddleAngle);
      } else if (gameState.aiRightPressed && !gameState.rightPaddleStunned) {
        gameState.rightPaddleAngle = Math.min(gameState.rightPaddleAngle + tiltSpeed, gameState.maxPaddleAngle);
      } else {
        // Return to center when no tilt key is pressed
        if (gameState.rightPaddleAngle > 0) {
          gameState.rightPaddleAngle = Math.max(0, gameState.rightPaddleAngle - tiltSpeed);
        } else if (gameState.rightPaddleAngle < 0) {
          gameState.rightPaddleAngle = Math.min(0, gameState.rightPaddleAngle + tiltSpeed);
        }
      }
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
    
    // Update projectiles
    PongEngine.updateProjectiles(gameState, canvas);
    
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
      const baseAngle = hitPos * Math.PI / 4;
      const paddleAngle = gameState.leftPaddleAngle; // Tank tilt affects ball trajectory significantly
      const finalAngle = baseAngle + paddleAngle * 1.5; // Amplify tilt effect
      gameState.ballVX = Math.abs(speed * Math.cos(finalAngle));
      gameState.ballVY = speed * Math.sin(finalAngle);
      gameState.ballVY += gameState.paddleVY * 0.7; // Add spin
    } else {
      gameState.ballX = canvas.width - 30 - 10;
      const hitPos = ((gameState.ballY - gameState.rightPaddleY) / gameState.rightPaddleHeight) * 2 - 1;
      let speed = Math.sqrt(gameState.ballVX * gameState.ballVX + gameState.ballVY * gameState.ballVY);
      const baseAngle = hitPos * Math.PI / 4;
      const paddleAngle = gameState.rightPaddleAngle; // Tank tilt affects ball trajectory significantly
      const finalAngle = baseAngle - paddleAngle * 1.5; // Opposite direction for right paddle, amplify tilt effect
      gameState.ballVX = -Math.abs(speed * Math.cos(finalAngle));
      gameState.ballVY = speed * Math.sin(finalAngle);
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
   * Handle shooting mechanics
   */
  private static handleShooting(gameState: any, canvas: HTMLCanvasElement, side: 'left' | 'right'): void {
    const currentTime = Date.now();
    const lastShot = gameState.lastShotTime[side];
    
    // Check cooldown
    if (currentTime - lastShot < gameState.shotCooldown) {
      return; // Still on cooldown
    }
    
    const projectileSpeed = 6; // Slower projectiles
    const paddleY = side === 'left' ? gameState.leftPaddleY : gameState.rightPaddleY;
    const paddleHeight = side === 'left' ? gameState.leftPaddleHeight : gameState.rightPaddleHeight;
    const paddleAngle = side === 'left' ? gameState.leftPaddleAngle : gameState.rightPaddleAngle;
    
    const projectile = {
      id: gameState.projectileIdCounter++,
      x: side === 'left' ? 35 : canvas.width - 35, // Start from paddle edge
      y: paddleY + paddleHeight / 2, // Start from paddle center
      vx: side === 'left' ? projectileSpeed * Math.cos(paddleAngle) : -projectileSpeed * Math.cos(paddleAngle),
      vy: side === 'left' ? projectileSpeed * Math.sin(paddleAngle) : -projectileSpeed * Math.sin(paddleAngle),
      side: side,
      radius: 6 // Bigger projectiles
    };
    
    gameState.projectiles.push(projectile);
    gameState.lastShotTime[side] = currentTime; // Update cooldown
    console.log(`${side} tank fired projectile at angle ${paddleAngle}, cooldown applied`);
  }

  /**
   * Update projectiles
   */
  private static updateProjectiles(gameState: any, canvas: HTMLCanvasElement): void {
    for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
      const projectile = gameState.projectiles[i];
      
      // Update position
      projectile.x += projectile.vx;
      projectile.y += projectile.vy;
      
      // Bounce off top/bottom walls
      if (projectile.y - projectile.radius < 0 || projectile.y + projectile.radius > canvas.height) {
        projectile.vy *= -1;
      }
      
      // Remove projectiles that go off the sides
      if (projectile.x < -20 || projectile.x > canvas.width + 20) {
        gameState.projectiles.splice(i, 1);
        continue;
      }
      
      // Check collision with ball
      const ballDistance = Math.sqrt(
        (projectile.x - gameState.ballX) ** 2 + (projectile.y - gameState.ballY) ** 2
      );
      if (ballDistance < projectile.radius + 10 && !gameState.ballRespawning) {
        // More nuanced physics: combine projectile direction with impact position
        const currentBallSpeed = Math.sqrt(gameState.ballVX ** 2 + gameState.ballVY ** 2);
        
        // Get projectile's normalized direction
        const projectileSpeed = Math.sqrt(projectile.vx ** 2 + projectile.vy ** 2);
        const projectileDirX = projectile.vx / projectileSpeed;
        const projectileDirY = projectile.vy / projectileSpeed;
        
        // Calculate where on the ball the projectile hit (impact offset)
        const impactOffsetX = (projectile.x - gameState.ballX) / 10; // Normalize by ball radius
        const impactOffsetY = (projectile.y - gameState.ballY) / 10;
        
        // The ball's new direction is influenced by both projectile direction and impact position
        // Projectile direction has more influence (70%), impact position has some influence (30%)
        const influenceRatio = 0.7;
        const newDirX = projectileDirX * influenceRatio + impactOffsetX * (1 - influenceRatio);
        const newDirY = projectileDirY * influenceRatio + impactOffsetY * (1 - influenceRatio);
        
        // Normalize the new direction
        const newDirLength = Math.sqrt(newDirX * newDirX + newDirY * newDirY);
        const finalDirX = newDirX / newDirLength;
        const finalDirY = newDirY / newDirLength;
        
        // Apply new speed and direction
        const newSpeed = Math.min(currentBallSpeed * 1.3, 15);
        gameState.ballVX = newSpeed * finalDirX;
        gameState.ballVY = newSpeed * finalDirY;
        
        // Remove projectile
        gameState.projectiles.splice(i, 1);
        console.log(`Projectile hit ball - projectile dir: (${Math.round(projectileDirX*100)/100}, ${Math.round(projectileDirY*100)/100}), impact: (${Math.round(impactOffsetX*100)/100}, ${Math.round(impactOffsetY*100)/100}), final: (${Math.round(finalDirX*100)/100}, ${Math.round(finalDirY*100)/100})`);
        continue;
      }
      
      // Check collision with paddles
      // Left paddle collision
      if (projectile.x - projectile.radius < 30 && 
          projectile.y > gameState.leftPaddleY && 
          projectile.y < gameState.leftPaddleY + gameState.leftPaddleHeight &&
          projectile.side !== 'left') {
        // Stun left paddle
        gameState.leftPaddleStunned = true;
        gameState.leftPaddleStunEnd = Date.now() + 2000; // 2 seconds
        gameState.projectiles.splice(i, 1);
        console.log('Left paddle stunned by projectile');
        continue;
      }
      
      // Right paddle collision
      if (projectile.x + projectile.radius > canvas.width - 30 && 
          projectile.y > gameState.rightPaddleY && 
          projectile.y < gameState.rightPaddleY + gameState.rightPaddleHeight &&
          projectile.side !== 'right') {
        // Stun right paddle
        gameState.rightPaddleStunned = true;
        gameState.rightPaddleStunEnd = Date.now() + 2000; // 2 seconds
        gameState.projectiles.splice(i, 1);
        console.log('Right paddle stunned by projectile');
        continue;
      }
    }
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
        const t = getT();
        statusDiv.textContent = `${t.rightPlayerScores}${gameState.leftScore} - ${gameState.rightScore}`;
      }
      
      if (gameState.rightScore >= gameState.pointsToWin) {
        PongEngine.endGame(gameState, 'loss', statusDiv, aiInterval);
      } else {
        PongEngine.resetBall(gameState, canvas);
        if (statusDiv) {
          const t = getT();
          statusDiv.textContent = t.ballRespawning;
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
            const t = getT();
            statusDiv.textContent = `${t.leftPlayerScores}${gameState.leftScore} - ${gameState.rightScore}`;
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
    console.log('=== GAME ENDED ===');
    console.log('Game result:', result);
    console.log('Game config:', gameState.gameConfig);
    console.log('Final scores:', { left: gameState.leftScore, right: gameState.rightScore });
    
    gameState.gameOver = true;
    PongEngine.isGameRunning = false;
    if (aiInterval) clearInterval(aiInterval); // Only clear if there's an AI interval

    // Remove touch controls and exit fullscreen immediately on game end to restore UI
    try {
      PongEngine.removeTouchControls(gameState);
    } catch (e) { /* ignore */ }
    try {
      if ((gameState as any)._touchFsHandler) {
        document.removeEventListener('fullscreenchange', (gameState as any)._touchFsHandler);
        try { delete (gameState as any)._touchFsHandler; } catch (e) { /* ignore */ }
      }
    } catch (e) { /* ignore */ }
    try {
      const doc: any = document;
      if (doc.fullscreenElement && typeof doc.exitFullscreen === 'function') {
        doc.exitFullscreen();
      }
    } catch (e) { /* ignore */ }
    
    const isPlayerVsPlayer = gameState.gameConfig.mode === 'player';
    const player1Name = gameState.gameConfig.player1.username;
    const player2Name = isPlayerVsPlayer ? gameState.gameConfig.player2?.username : 'AI';
    
    console.log('Is player vs player:', isPlayerVsPlayer);
    console.log('Player 1:', player1Name);
    console.log('Player 2:', player2Name);
    console.log('Player 2 data:', gameState.gameConfig.player2);
    
    // Check if this is a tournament match
    const isTournamentMode = sessionStorage.getItem('tournamentMode') === 'true';
    
    const t = getT();
    const winner = result === 'win' ? player1Name : player2Name;
    const winnerScore = result === 'win' ? gameState.leftScore : gameState.rightScore;
    const loserScore = result === 'win' ? gameState.rightScore : gameState.leftScore;
    const template = t.gameOverWinnerTemplate || 'Game Over! {winner} wins {winnerScore}-{loserScore}!';
    const message = template.replace('{winner}', winner).replace('{winnerScore}', String(winnerScore)).replace('{loserScore}', String(loserScore));

    if (statusDiv) statusDiv.textContent = message;
    
    PongEngine.resetStartButton();
    
    // Send match result
    const matchEnd = new Date();
    
    if (isTournamentMode && isPlayerVsPlayer) {
      console.log('Tournament match completed, processing...');
      
      // Check for tournament callback
      const tournamentCallback = (window as any).tournamentCallback;
      const tournamentPlayers = (window as any).tournamentPlayers;
      
      if (tournamentCallback && tournamentPlayers) {
        const winnerName = result === 'win' ? tournamentPlayers.player1 : tournamentPlayers.player2;
        setTimeout(() => {
          tournamentCallback(winnerName);
        }, 2000); // Give time to show the win message
      }
      
      // Skip the old processTournamentMatchResult since we handle it in the router now
      return;
    } else if (isPlayerVsPlayer) {
      console.log('Sending player vs player match result...');
      // Send results for both players in player vs player mode
      PongEngine.sendPlayerVsPlayerMatchResult({
        player1: gameState.gameConfig.player1,
        player2: gameState.gameConfig.player2,
        player1Score: gameState.leftScore,
        player2Score: gameState.rightScore,
        winnerId: result === 'win' ? 1 : 2,
        startedAt: gameState.matchStart.toISOString(),
        endedAt: matchEnd.toISOString(),
        duration: Math.round((matchEnd.getTime() - gameState.matchStart.getTime()) / 1000)
      });
    } else {
      console.log('Sending bot match result...');
      // Send result for single player vs AI
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
    
    // Draw paddles as tanks
    PongEngine.drawTankPaddle(ctx, 20, gameState.leftPaddleY, gameState.leftPaddleHeight, gameState.leftPaddleAngle, gameState.userPaddleColor, gameState.leftPaddleStunned, 'left');
    
    // Use player 2 color for player vs player mode, otherwise white for AI
    const rightPaddleColor = gameState.gameConfig.mode === 'player' ? gameState.player2PaddleColor : '#fff';
    PongEngine.drawTankPaddle(ctx, canvas.width - 30, gameState.rightPaddleY, gameState.rightPaddleHeight, gameState.rightPaddleAngle, rightPaddleColor, gameState.rightPaddleStunned, 'right');
    
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
    
    // Draw projectiles
    gameState.projectiles.forEach((projectile: any) => {
      ctx.beginPath();
      ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#fd8f00ff'; // Inner color
      ctx.fill();
      ctx.strokeStyle = '#f10000ff'; // Border color
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.closePath();
    });
  }

  /**
   * Draw a tank-style paddle with tilting
   */
  private static drawTankPaddle(
    ctx: CanvasRenderingContext2D, 
    x: number, 
    y: number, 
    height: number, 
    angle: number, 
    color: string, 
    stunned: boolean, 
    side: 'left' | 'right'
  ): void {
    ctx.save();
    
    const centerX = x + 5; // Center of paddle
    const centerY = y + height / 2;
    const paddleWidth = 10;
    
    // Draw tank base (main body) - tilted according to angle
    ctx.translate(centerX, centerY);
    ctx.rotate(angle * 0.3); // Tank body tilts less than the turret
    
    // Tank body color with stunning effects
    let bodyColor = color;
    if (stunned) {
      const flashRate = 150; // Fast blinking when stunned
      const shouldFlash = Math.floor(Date.now() / flashRate) % 2 === 0;
      bodyColor = shouldFlash ? '#ff4444' : '#666';
    }
    
    // Draw main tank body (thicker and more tank-like)
    ctx.fillStyle = bodyColor;
    ctx.fillRect(-paddleWidth/2, -height/2, paddleWidth, height);
    
    // Draw tank tracks/treads
    ctx.fillStyle = '#333';
    ctx.fillRect(-paddleWidth/2 - 2, -height/2, 2, height); // Left track
    ctx.fillRect(paddleWidth/2, -height/2, 2, height); // Right track
    
    // Draw track details (small rectangles)
    ctx.fillStyle = '#555';
    for (let i = -height/2 + 5; i < height/2; i += 8) {
      ctx.fillRect(-paddleWidth/2 - 1, i, 1, 3);
      ctx.fillRect(paddleWidth/2 + 1, i, 1, 3);
    }
    
    // Reset rotation for turret (turret rotates independently)
    ctx.rotate(-angle * 0.3);
    ctx.rotate(angle); // Now apply full turret rotation
    
    // Draw turret base (circular)
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fillStyle = stunned ? '#666' : color;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Draw cannon barrel (much more prominent)
    ctx.strokeStyle = stunned ? '#666' : '#fff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    
    if (side === 'left') {
      ctx.moveTo(0, 0);
      ctx.lineTo(20, 0); // Longer cannon
      // Draw cannon tip
      ctx.arc(20, 0, 2, 0, Math.PI * 2);
    } else {
      ctx.moveTo(0, 0);
      ctx.lineTo(-20, 0); // Longer cannon
      // Draw cannon tip
      ctx.arc(-20, 0, 2, 0, Math.PI * 2);
    }
    
    ctx.stroke();
    
    // Draw cannon muzzle (dark circle at tip)
    ctx.beginPath();
    if (side === 'left') {
      ctx.arc(20, 0, 1, 0, Math.PI * 2);
    } else {
      ctx.arc(-20, 0, 1, 0, Math.PI * 2);
    }
    ctx.fillStyle = '#000';
    ctx.fill();
    
    ctx.restore();
    
    // Draw stunning effect (dashed blinking circle around the tank)
    if (stunned) {
      const blinkRate = 200;
      const shouldShowCircle = Math.floor(Date.now() / blinkRate) % 2 === 0;
      if (shouldShowCircle) {
        ctx.save();
        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]); // Dashed line
        ctx.beginPath();
        ctx.arc(centerX, centerY, Math.max(height/2, paddleWidth) + 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]); // Reset dash
        ctx.restore();
      }
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
   * Send match result for player vs player games
   */
  private static async sendPlayerVsPlayerMatchResult(params: {
    player1: { username: string };
    player2: { username: string; id: number };
    player1Score: number;
    player2Score: number;
    winnerId: 1 | 2;
    startedAt: string;
    endedAt: string;
    duration: number;
  }): Promise<void> {
    console.log('=== sendPlayerVsPlayerMatchResult called ===');
    console.log('Full params object:', params);
    console.log('params.player1:', params.player1);
    console.log('params.player2:', params.player2);
    console.log('params.player2?.id:', params.player2?.id);
    
    try {
      // Check if player2 is valid
      if (!params.player2 || !params.player2.id) {
        console.error('ERROR: player2 is missing or has no ID!', params.player2);
        return;
      }
      
      // Get player 1 ID
      console.log('Fetching player 1 data for username:', params.player1.username);
      const player1Res = await fetch(`${API_BASE}/users/${params.player1.username}`);
      const player1Data = await player1Res.json();
      console.log('Player 1 API response:', player1Data);
      
      if (!player1Data || !player1Data.id) {
        console.error('Player 1 data not found:', player1Data);
        return;
      }
      
      const winnerId = params.winnerId === 1 ? player1Data.id : params.player2.id;
      
      const matchPayload = {
        player1Id: player1Data.id,
        player2Id: params.player2.id,
        player1Score: params.player1Score,
        player2Score: params.player2Score,
        winnerId,
        matchType: 'player'
      };
      
      console.log('=== Final match payload being sent ===');
      console.log('Match payload:', matchPayload);
      
      // Record the match
      const response = await fetch(`${API_BASE}/matches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(matchPayload)
      });
      
      const result = await response.json();
      console.log('Match recording result:', result);
      
      if (!response.ok) {
        console.error('Failed to record match:', result);
      }
    } catch (e) {
      console.error('Failed to send player vs player match result:', e);
    }
  }

  /**
   * Reset the start button
   */
  private static resetStartButton(): void {
    const startBtn = document.getElementById('pong-start') as HTMLButtonElement | null;
    if (startBtn) {
      startBtn.disabled = false;
      const t = getT();
      startBtn.textContent = t.startGame;
      // Ensure the start button is visible again after the match
      startBtn.style.display = 'block';
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
      // Remove touch controls overlay if present
      try {
        PongEngine.removeTouchControls(gameState);
      } catch (e) { /* ignore */ }

      // Remove fullscreenchange handler if stored
      try {
        if ((gameState as any)._touchFsHandler) {
          document.removeEventListener('fullscreenchange', (gameState as any)._touchFsHandler);
          try { delete (gameState as any)._touchFsHandler; } catch (e) { /* ignore */ }
        }
      } catch (e) { /* ignore */ }

      // Exit fullscreen if we are inside it
      try {
        const doc: any = document;
        if (doc.fullscreenElement && typeof doc.exitFullscreen === 'function') {
          doc.exitFullscreen();
        }
      } catch (e) { /* ignore */ }
    };

    // Clean up on navigation
    window.addEventListener('hashchange', cleanup, { once: true });
    
    // Clean up on page unload
    window.addEventListener('beforeunload', cleanup, { once: true });
  }

  // Mobile on-screen controls removed: mobile should behave identically to desktop.

  /**
   * Create and attach touch controls overlay for touch devices.
   * Buttons will toggle the same boolean flags used by keyboard handlers.
   */
  private static showTouchControls(canvas: HTMLCanvasElement, gameState: any, container?: Element | null): void {
    try {
      // If already attached, skip
      if (gameState.touchControlsElement) return;

      const overlay = document.createElement('div');
      overlay.id = 'touch-controls-overlay';
      // Basic styles to place controls over the bottom area
      overlay.style.position = 'fixed';
      overlay.style.left = '0';
      overlay.style.right = '0';
      overlay.style.bottom = '0';
      overlay.style.height = '34%';
      overlay.style.display = 'flex';
      overlay.style.justifyContent = 'space-between';
      overlay.style.alignItems = 'flex-end';
      overlay.style.pointerEvents = 'auto';
      overlay.style.zIndex = '9999';
      overlay.style.userSelect = 'none';

      const makePanel = (side: 'left' | 'right') => {
        const panel = document.createElement('div');
        panel.style.width = '50%';
        panel.style.display = 'flex';
        panel.style.flexDirection = 'column';
        panel.style.alignItems = side === 'left' ? 'flex-start' : 'flex-end';
        panel.style.padding = '8px';
        panel.style.boxSizing = 'border-box';
        return panel;
      };

      const makeButton = (label: string, aria: string) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = label;
        btn.setAttribute('aria-label', aria);
        btn.style.width = '64px';
        btn.style.height = '64px';
        btn.style.margin = '6px';
        btn.style.borderRadius = '12px';
        btn.style.border = 'none';
        btn.style.background = 'rgba(255,255,255,0.12)';
        btn.style.color = '#fff';
        btn.style.fontSize = '20px';
        btn.style.backdropFilter = 'blur(4px)';
        btn.style.touchAction = 'none';
        return btn;
      };

      const leftPanel = makePanel('left');
      const rightPanel = makePanel('right');

      // Player 1 controls (left side)
      const p1Up = makeButton('▲', 'Move up');
      const p1Down = makeButton('▼', 'Move down');
      const p1TiltL = makeButton('⟲', 'Tilt left');
      const p1TiltR = makeButton('⟳', 'Tilt right');
      const p1Shoot = makeButton('●', 'Shoot');

      // Player 2 controls (right side)
      const p2Up = makeButton('▲', 'Move up (P2)');
      const p2Down = makeButton('▼', 'Move down (P2)');
      const p2TiltL = makeButton('⟲', 'Tilt left (P2)');
      const p2TiltR = makeButton('⟳', 'Tilt right (P2)');
      const p2Shoot = makeButton('●', 'Shoot (P2)');

      // Helper to attach press/release handlers
      const bindToggle = (el: HTMLElement, setTrue: () => void, setFalse: () => void) => {
        const down = (ev: Event) => { try { ev.preventDefault(); } catch (e) {} ; setTrue(); };
        const up = (ev: Event) => { try { ev.preventDefault(); } catch (e) {} ; setFalse(); };
        el.addEventListener('pointerdown', down as any, { passive: false });
        el.addEventListener('pointerup', up as any);
        el.addEventListener('pointercancel', up as any);
        // Also support touchstart/touchend for older browsers
        el.addEventListener('touchstart', down as any, { passive: false });
        el.addEventListener('touchend', up as any);
      };

      bindToggle(p1Up, () => gameState.wPressed = true, () => gameState.wPressed = false);
      bindToggle(p1Down, () => gameState.sPressed = true, () => gameState.sPressed = false);
      bindToggle(p1TiltL, () => gameState.aPressed = true, () => gameState.aPressed = false);
      bindToggle(p1TiltR, () => gameState.dPressed = true, () => gameState.dPressed = false);
      // shoot: set true on down, set false on up
      bindToggle(p1Shoot, () => gameState.spacePressed = true, () => gameState.spacePressed = false);

      bindToggle(p2Up, () => gameState.upPressed = true, () => gameState.upPressed = false);
      bindToggle(p2Down, () => gameState.downPressed = true, () => gameState.downPressed = false);
      bindToggle(p2TiltL, () => gameState.leftPressed = true, () => gameState.leftPressed = false);
      bindToggle(p2TiltR, () => gameState.rightPressed = true, () => gameState.rightPressed = false);
      bindToggle(p2Shoot, () => gameState.enterPressed = true, () => gameState.enterPressed = false);

      // Layout: movement row on top, action row (tilt/shoot) below
      const p1MoveRow = document.createElement('div');
      p1MoveRow.style.display = 'flex';
      p1MoveRow.appendChild(p1Up);
      p1MoveRow.appendChild(p1Down);

      const p1ActionRow = document.createElement('div');
      p1ActionRow.style.display = 'flex';
      p1ActionRow.appendChild(p1TiltL);
      p1ActionRow.appendChild(p1Shoot);
      p1ActionRow.appendChild(p1TiltR);

      leftPanel.appendChild(p1MoveRow);
      leftPanel.appendChild(p1ActionRow);

      const p2MoveRow = document.createElement('div');
      p2MoveRow.style.display = 'flex';
      p2MoveRow.appendChild(p2Up);
      p2MoveRow.appendChild(p2Down);

      const p2ActionRow = document.createElement('div');
      p2ActionRow.style.display = 'flex';
      p2ActionRow.appendChild(p2TiltL);
      p2ActionRow.appendChild(p2Shoot);
      p2ActionRow.appendChild(p2TiltR);

      rightPanel.appendChild(p2MoveRow);
      rightPanel.appendChild(p2ActionRow);

      overlay.appendChild(leftPanel);
      overlay.appendChild(rightPanel);

      // If single-player (AI), hide right panel
      if (gameState.gameConfig.mode !== 'player') {
        rightPanel.style.display = 'none';
      }

      // If a container is provided (for fullscreen), append there so controls are visible in fullscreen.
      const appendTarget = container || document.body;
      try { appendTarget.appendChild(overlay); } catch (e) { document.body.appendChild(overlay); }
      gameState.touchControlsElement = overlay;
      try { console.log('PongEngine: showTouchControls attached overlay', { overlayId: overlay.id, appendTarget: (appendTarget as Element).tagName }); } catch (e) { /* ignore */ }
    } catch (e) { /* ignore */ }
  }

  /**
   * Remove touch controls overlay if present
   */
  private static removeTouchControls(gameState: any): void {
    try {
      const el = gameState?.touchControlsElement || document.getElementById('touch-controls-overlay');
      const node = el as HTMLElement | null;
      if (node && node.parentElement) {
        node.parentElement.removeChild(node);
      }
      try { delete gameState.touchControlsElement; } catch (e) { /* ignore */ }
    } catch (e) { /* ignore */ }
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
          const t = getT();
          statusDiv.textContent = `${t.rightPlayerScores}${gameState.leftScore} - ${gameState.rightScore}`;
        }
        if (gameState.rightScore >= gameState.pointsToWin) {
          PongEngine.endGame(gameState, 'loss', statusDiv, aiInterval);
        }
        return false; // Remove this ball
      } else if (ball.x > canvas.width) {
        gameState.leftScore++;
        if (statusDiv) {
          const t = getT();
          statusDiv.textContent = `${t.leftPlayerScores}${gameState.leftScore} - ${gameState.rightScore}`;
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
        const t = getT();
        startBtn.textContent = t.gameRunning;
        PongEngine.startGame(canvas, statusDiv);
      });
    }
  }

  /**
   * Process tournament match result and advance tournament
   */
  private static processTournamentMatchResult(
    result: 'win' | 'loss',
    player1Name: string,
    player2Name: string,
    gameState: any
  ): void {
    try {
      const tournamentState = JSON.parse(sessionStorage.getItem('tournamentState') || '{}');
      const currentMatchIndex = parseInt(sessionStorage.getItem('currentMatchIndex') || '0');
      
      // Determine winner
      const winnerName = result === 'win' ? player1Name : player2Name;
      
      // Find and update the current match
      const currentRound = tournamentState.rounds[tournamentState.currentRound];
      if (currentRound && currentRound[currentMatchIndex]) {
        const match = currentRound[currentMatchIndex];
        match.winner = match.player1.username === winnerName ? match.player1 : match.player2;
        
        // Update next round with winner
        if (tournamentState.currentRound < tournamentState.rounds.length - 1) {
          const nextRound = tournamentState.rounds[tournamentState.currentRound + 1];
          const nextMatchIndex = Math.floor(currentMatchIndex / 2);
          if (nextRound[nextMatchIndex]) {
            if (currentMatchIndex % 2 === 0) {
              nextRound[nextMatchIndex].player1 = match.winner;
            } else {
              nextRound[nextMatchIndex].player2 = match.winner;
            }
          }
        }
      }
      
      // Update sessionStorage with new state
      sessionStorage.setItem('tournamentState', JSON.stringify(tournamentState));
      sessionStorage.setItem('currentMatchIndex', (currentMatchIndex + 1).toString());
      
      // Show match result for 3 seconds then return to tournament (do not manipulate tournamentMode here)
      setTimeout(() => {
        // Return to tournament page
        window.location.hash = '#tournament';
        // After a brief delay, continue tournament
        setTimeout(() => {
          (window as any).continueTournament?.();
        }, 100);
      }, 3000);
      
    } catch (error) {
      console.error('Error processing tournament match result:', error);
      // Fallback: return to tournament page
      setTimeout(() => {
        window.location.hash = '#tournament';
      }, 3000);
    }
  }

  /**
   * Create a tournament game instance
   */
  static createTournamentGame(canvas: HTMLCanvasElement, options: {
    player1: any; // Full player object with profile data
    player2: any; // Full player object with profile data
    onGameEnd: (winner: string) => void;
  }): { start: () => void } {
    console.log('=== CREATING TOURNAMENT GAME ===');
    console.log('Player 1:', options.player1.username, 'Color:', options.player1.profile?.skinColor);
    console.log('Player 2:', options.player2.username, 'Color:', options.player2.profile?.skinColor);
    
    // Store tournament callback globally for endGame to access
    (window as any).tournamentCallback = options.onGameEnd;
    (window as any).tournamentPlayers = { player1: options.player1.username, player2: options.player2.username };
    
    // Create game configuration with profile data
    const gameConfig: GameConfig = {
      mode: 'player',
      player1: { 
        username: options.player1.username,
        profile: options.player1.profile,
        id: options.player1.id
      },
      player2: { 
        username: options.player2.username, 
        profile: options.player2.profile,
        id: options.player2.id || 0
      }
    };
    
    console.log('GameConfig created:', gameConfig);
    
    return {
      start: () => {
        PongEngine.startGame(canvas, null, gameConfig);
      }
    };
  }
}