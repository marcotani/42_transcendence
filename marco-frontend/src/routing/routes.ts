// Route definitions for the application
export const routes: { [key: string]: (t: any) => string } = {
  'home': (t) => `<h1 class="text-4xl font-bold mb-4">${t.title}</h1>
  <div class="flex flex-col items-center justify-center space-y-4 mt-8">
    <button class="w-48 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-green-400" id="start-game">${t.startGame}</button>
    <button class="w-48 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-orange-400" id="tournament">${t.tournament}</button>
    <button class="w-48 px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded focus:outline-none focus:ring-2 focus:ring-gray-400" id="options">${t.options}</button>
    <button class="w-48 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-purple-400" id="leaderboard">${t.leaderboard}</button>
      <div class="flex space-x-4 mt-8">
      <button class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded focus:outline-none focus:ring-4 focus:ring-blue-400" id="login-btn">${t.login}</button>
      <button class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded focus:outline-none focus:ring-4 focus:ring-green-400" id="register-btn">${t.register}</button>
    </div>
  </div>`,
  'tournament': (t) => `
    <div class='max-w-4xl mx-auto mt-8 p-6 bg-gray-900 rounded-lg shadow-lg'>
      <h2 class='text-3xl font-bold mb-6 text-center' id="tournament-main-title">${t.tournamentTitle}</h2>
      
      <!-- Tournament Setup Phase -->
      <div id="tournament-setup" class="mb-6">
        <h3 class="text-xl mb-4 text-center">${t.selectPlayers || 'Select Number of Players'}</h3>
        <div class="flex justify-center space-x-4 mb-6">
          <button id="players-4" class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold">
            ${t.players4}
          </button>
          <button id="players-6" class="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold">
            ${t.players6}
          </button>
          <button id="players-8" class="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold">
            ${t.players8}
          </button>
        </div>
      </div>

      <!-- Player Registration Phase -->
      <div id="player-registration" class="hidden mb-6">
  <h3 class="text-xl mb-4 text-center">${t.registerTournamentPlayers}</h3>
        <div id="player-forms" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Player forms will be generated here -->
        </div>
            <div class="text-center mt-6">
          <button id="start-tournament" class="px-8 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold text-lg disabled:opacity-50" disabled>
            ${t.startTournament}
          </button>
        </div>
      </div>

      <!-- Tournament Bracket -->
      <div id="tournament-bracket" class="hidden mb-6">
  <h3 class="text-xl mb-4 text-center">${t.tournamentBracketTitle}</h3>
        <div id="bracket-display" class="bg-gray-800 p-4 rounded-lg">
          <!-- Bracket will be generated here -->
        </div>
      </div>

      <!-- Current Match Display -->
      <div id="current-match" class="hidden mb-6">
        <!-- Tournament Bracket Visualization -->
        <div id="bracket-visualization" class="mb-6">
          <h3 class="text-xl mb-4 text-center">🏆 Tournament Bracket</h3>
          <div id="bracket-tree" class="bg-gray-800 p-4 rounded-lg overflow-x-auto">
            <!-- Bracket tree will be generated here -->
          </div>
        </div>
        
  <h3 class="text-xl mb-4 text-center">${t.currentMatch}</h3>
        <div class="bg-gray-800 p-6 rounded-lg text-center">
          <div class="flex justify-between items-center mb-4">
            <div class="flex-1">
              <h4 class="text-lg font-bold" id="match-player1">${t.player1}</h4>
              <p class="text-sm text-gray-400">${t.leftSide}</p>
            </div>
            <div class="text-2xl font-bold text-orange-400">VS</div>
            <div class="flex-1">
              <h4 class="text-lg font-bold" id="match-player2">${t.player2}</h4>
              <p class="text-sm text-gray-400">${t.rightSide}</p>
            </div>
          </div>
          <button id="start-match" class="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold">
            ${t.startMatch || '🚀 Start Match!'}
          </button>
        </div>
      </div>

      <!-- Tournament Game Area -->
      <div id="tournament-game" class="hidden mb-6">
        <h3 class="text-xl mb-4 text-center">Tournament Match</h3>
        <div class="bg-gray-800 p-4 rounded-lg">
          <div class="flex justify-between items-center mb-4">
            <div class="text-lg font-bold" id="game-player1">${t.player1}</div>
            <div class="text-xl text-orange-400">VS</div>
            <div class="text-lg font-bold" id="game-player2">${t.player2}</div>
          </div>
          <div class='relative mb-4'>
            <canvas id="tournament-canvas" width="600" height="400" class="border border-gray-600 bg-black mx-auto block rounded"></canvas>
          </div>
            <div class="text-center mt-4">
            <button id="start-tournament-game" class="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold mb-2">
              ${t.startGame}
            </button>
            <div id="tournament-game-status" class="text-lg mb-2">${t.readyToStart || 'Ready to start...'}</div>
            <button id="return-to-bracket" class="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold hidden">
              ${t.backToMain}
            </button>
          </div>
        </div>
      </div>

      <!-- Tournament Winner -->
      <div id="tournament-winner" class="hidden mb-6">
        <h3 class="text-2xl mb-4 text-center text-yellow-400">🏆 ${t.tournamentWinnerTitle} 🏆</h3>
        <div class="bg-gradient-to-r from-yellow-600 to-orange-600 p-6 rounded-lg text-center">
          <h4 class="text-3xl font-bold text-white" id="winner-name">${t.champion}</h4>
          <p class="text-lg text-yellow-100 mt-2">${t.tournamentWinnerText}</p>
        </div>
      </div>

      <button id='back-home-tournament' class='mt-6 w-full px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded focus:outline-none focus:ring-4 focus:ring-gray-400'>
        ${t.backToHome || 'Back to Home'}
      </button>
    </div>`,
  'options': (t) => `
    <h2 class="text-2xl font-bold mb-4">${t.optionsTitle || 'Options'}</h2>
    <div style="max-width: 600px; margin: 0 auto; background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; color: white;">
      <div style="margin-bottom: 20px;">
  <label for="ball-speed" style="display: block; margin-bottom: 5px;">${t.ballSpeedLabel}</label>
        <input type="range" id="ball-speed" min="1" max="10" value="3" style="width: 100%; margin-bottom: 5px;">
        <span id="ball-speed-value" style="font-size: 14px; color: #ccc;">3</span>
      </div>
      <div style="margin-bottom: 20px;">
  <label for="paddle-speed" style="display: block; margin-bottom: 5px;">${t.paddleSpeedLabel}</label>
        <input type="range" id="paddle-speed" min="1" max="10" value="5" style="width: 100%; margin-bottom: 5px;">
        <span id="paddle-speed-value" style="font-size: 14px; color: #ccc;">5</span>
      </div>
      <div style="margin-bottom: 20px;">
  <label for="points-to-win" style="display: block; margin-bottom: 5px;">${t.pointsToWinLabel}</label>
        <select id="points-to-win" style="width: 100%; padding: 5px; border-radius: 5px; background: #333; color: white; border: 1px solid #555;">
          <option value="3" selected>${t.pointsToWinOption3}</option>
          <option value="5">${t.pointsToWinOption5}</option>
          <option value="11">${t.pointsToWinOption11}</option>
          <option value="21">${t.pointsToWinOption21}</option>
        </select>
      </div>
      <div style="margin-bottom: 20px;">
          <label style="display: flex; align-items: center; cursor: pointer;">
          <input type="checkbox" id="power-ups-enabled" style="margin-right: 10px; transform: scale(1.2);">
          <span>${t.enablePowerups}</span>
        </label>
        <div id="power-up-settings" style="margin-top: 10px; margin-left: 30px;">
          <label for="power-up-interval" style="display: block; margin-bottom: 5px;">${t.powerupSpawnIntervalLabel}</label>
          <input type="range" id="power-up-interval" min="5" max="30" value="15" style="width: 100%; margin-bottom: 5px;">
          <span id="power-up-interval-value" style="font-size: 14px; color: #ccc;">15</span>
        </div>
      </div>
  <button id="save-options" style="width: 100%; padding: 10px; background: #007acc; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; margin-bottom: 10px;">${t.saveSettings}</button>
      <div style="display: flex; gap: 10px;">
  <button id="reset-defaults" style="flex: 1; padding: 10px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">${t.resetDefaults}</button>
  <button id="back-to-main" style="flex: 1; padding: 10px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">${t.backToMain}</button>
      </div>
      <div id="save-status" style="margin-top: 10px; text-align: center; font-size: 14px; color: #4CAF50;"></div>
    </div>
  `,
  'login': (t) => `<div class='max-w-md mx-auto mt-16 p-8 bg-gray-900 rounded-lg shadow-lg'>
    <h2 class='text-2xl font-bold mb-6 text-center' tabindex='0'>${t.login}</h2>
    <form id='login-form' class='space-y-4'>
      <div>
        <label for='login-username' class='block mb-1'>${t.usernameLabel}</label>
        <input type='text' id='login-username' name='username' class='w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400' required autocomplete='username' />
      </div>
      <div>
        <label for='login-password' class='block mb-1'>${t.passwordLabel}</label>
        <input type='password' id='login-password' name='password' class='w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400' required autocomplete='current-password' />
      </div>
      <button type='submit' class='w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded focus:outline-none focus:ring-4 focus:ring-blue-400'>${t.login}</button>
      <div id='login-error' class='text-red-500 mt-2 hidden'></div>
    </form>
    <button id='back-home-login' class='mt-6 w-full px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded focus:outline-none focus:ring-4 focus:ring-gray-400'>${t.backToHome || 'Back to Home'}</button>
  </div>`,
  'register': (t) => `<div class='max-w-md mx-auto mt-16 p-8 bg-gray-900 rounded-lg shadow-lg'>
  <h2 class='text-2xl font-bold mb-6 text-center' tabindex='0'>${t.register}</h2>
    <form id='register-form' class='space-y-4'>
      <div>
        <label for='register-username' class='block mb-1'>${t.usernameLabel}</label>
        <input type='text' id='register-username' name='username' class='w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-400' required autocomplete='username' />
      </div>
      <div>
        <label for='register-email' class='block mb-1'>${t.emailLabel}</label>
        <input type='email' id='register-email' name='email' class='w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-400' required autocomplete='email' />
      </div>
      <div>
        <label for='register-password' class='block mb-1'>${t.passwordLabel}</label>
        <input type='password' id='register-password' name='password' class='w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-400' required autocomplete='new-password' />
      </div>
      <div class='flex items-start mb-2'>
        <input id='register-gdpr' name='gdpr' type='checkbox' class='mt-1 mr-2' required />
        <label for='register-gdpr' class='text-sm text-gray-300'>I have read and accept the <a href="/public/static/GDPR_Compliance.pdf" target="_blank" class="underline text-blue-400 hover:text-blue-600">privacy policy</a>.</label>
      </div>
  <button type='submit' class='w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded focus:outline-none focus:ring-4 focus:ring-green-400'>${t.register}</button>
      <div id='register-error' class='text-red-500 mt-2 hidden'></div>
    </form>
    <button id='back-home-register' class='mt-6 w-full px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded focus:outline-none focus:ring-4 focus:ring-gray-400'>${t.backToHome || 'Back to Home'}</button>
  </div>`,
  'pong': (t) => `<div class='flex flex-col items-center justify-center min-h-screen'>
    <h2 class='text-3xl font-bold mb-6'>${t.pong || t.title || 'Pong Game'}</h2>
    
    <!-- Game Mode Selection -->
    <div id='game-mode-selection' class='bg-gray-800 rounded-lg shadow-lg p-6 mb-4'>
  <h3 class='text-xl font-semibold mb-4 text-center'>${t.selectGameMode}</h3>
      <div class='flex space-x-4'>
        <button id='vs-ai-mode' class='px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded focus:outline-none focus:ring-4 focus:ring-blue-400'>
          <div class='text-center'>
            <div class='text-lg font-semibold'>${t.vsAi}</div>
            <div class='text-sm text-gray-300'>${t.playAgainstComputer}</div>
          </div>
        </button>
        <button id='vs-player-mode' class='px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded focus:outline-none focus:ring-4 focus:ring-purple-400'>
          <div class='text-center'>
            <div class='text-lg font-semibold'>${t.vsPlayer}</div>
            <div class='text-sm text-gray-300'>${t.localMultiplayer}</div>
          </div>
        </button>
      </div>
    </div>

    <!-- Player 2 Login (hidden by default) -->
  <div id='player2-login' class='bg-gray-800 rounded-lg shadow-lg p-6 mb-4 hidden'>
  <h3 class='text-xl font-semibold mb-4 text-center'>${t.player2LoginTitle}</h3>
      <form id='player2-login-form' class='space-y-4'>
        <div>
          <label for='player2-username' class='block mb-1'>Username</label>
          <input type='text' id='player2-username' class='w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-400' required />
        </div>
        <div>
          <label for='player2-password' class='block mb-1'>Password</label>
          <input type='password' id='player2-password' class='w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-400' required />
        </div>
        <div id='player2-login-error' class='text-red-500 text-sm min-h-[20px] flex items-center' style='visibility: hidden;'></div>
        <div class='flex space-x-2'>
          <button type='submit' class='flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded focus:outline-none focus:ring-4 focus:ring-green-400'>${t.loginPlayer2Button}</button>
          <button type='button' id='cancel-player2-login' class='flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded focus:outline-none focus:ring-4 focus:ring-gray-400'>${t.cancelButton}</button>
        </div>
      </form>
    </div>

    <!-- Game Area -->
  <div id='game-area' class='bg-gray-800 rounded-lg shadow-lg p-4 flex flex-col items-center hidden'>
  <div id='players-info' class='mb-4 text-center'>
        <div class='flex justify-between items-center w-96'>
          <div class='text-left'>
            <div class='text-lg font-semibold text-blue-400'>${t.player1}</div>
            <div id='player1-name' class='text-sm text-gray-300'></div>
            <div class='text-xs text-gray-400'>${t.controlsLabel}</div>
          </div>
          <div class='text-center text-2xl font-bold'>VS</div>
          <div class='text-right'>
            <div id='player2-info' class='text-lg font-semibold text-red-400'>AI</div>
            <div id='player2-name' class='text-sm text-gray-300'></div>
            <div id='player2-controls' class='text-xs text-gray-400'></div>
          </div>
        </div>
      </div>
      <div class='relative mb-4'>
        <canvas id='pong-canvas' width='600' height='400' class='bg-black rounded block'></canvas>
  <button id='pong-start' class='absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded focus:outline-none focus:ring-4 focus:ring-green-400'>${t.startGame}</button>
      </div>
      <div id='pong-status' class='text-white mt-2'></div>
    </div>
    
    <button id='back-home-pong' class='mt-8 px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded focus:outline-none focus:ring-4 focus:ring-gray-400'>${t.backToHome || 'Back to Home'}</button>
  </div>`,
  'friends': (t) => `<div class='max-w-4xl mx-auto mt-8 p-6 bg-gray-900 rounded-lg shadow-lg'>
    <h2 class='text-3xl font-bold mb-6 text-center'>${t.friends || 'Friends'}</h2>
    
    <!-- Send Friend Request Section -->
    <div class='mb-8 p-4 bg-gray-800 rounded-lg'>
        <h3 class='text-xl font-semibold mb-4'>${t.sendFriendRequestTitle}</h3>
      <form id='send-friend-request-form' class='flex space-x-2'>
  <input type='text' id='friend-username' placeholder='${t.enterUsernamePlaceholder}' class='flex-1 px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-400' required />
  <button type='submit' class='px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded focus:outline-none focus:ring-4 focus:ring-purple-400'>${t.sendRequestButton}</button>
      </form>
      <div id='send-request-status' class='mt-2 text-sm'></div>
    </div>

    <!-- Pending Friend Requests Section -->
    <div class='mb-8 p-4 bg-gray-800 rounded-lg'>
  <h3 class='text-xl font-semibold mb-4'>${t.pendingRequestsTitle}</h3>
      <div id='pending-requests'>
        <div class='text-center py-4'>
          <div class='inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-white'></div>
          <p class='mt-2 text-gray-400'>${t.loadingRequests}</p>
        </div>
      </div>
    </div>

    <!-- Friends List Section -->
    <div class='p-4 bg-gray-800 rounded-lg'>
  <h3 class='text-xl font-semibold mb-4'>${t.yourFriendsTitle}</h3>
      <div id='friends-list'>
        <div class='text-center py-4'>
          <div class='inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-white'></div>
          <p class='mt-2 text-gray-400'>${t.loadingFriends}</p>
        </div>
      </div>
    </div>

    <button id='back-home-friends' class='mt-6 w-full px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded focus:outline-none focus:ring-4 focus:ring-gray-400'>${t.backToHome || 'Back to Home'}</button>
  </div>`,
  'edit-profile': (t) => `<div class='max-w-md mx-auto mt-16 p-8 bg-gray-900 rounded-lg shadow-lg'>
    <h2 class='text-2xl font-bold mb-6 text-center' tabindex='0' data-i18n='myProfile'>${t.myProfile || 'Edit Profile'}</h2>
  <form id='edit-profile-form' class='space-y-4' method='POST' enctype='multipart/form-data'>
      <div>
  <label for='edit-avatar' class='block mb-1' data-i18n='avatarImageLabel'>${t.avatarImageLabel}</label>
        <input type='file' id='edit-avatar' name='avatar' accept='image/png,image/jpeg,image/webp' class='w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-400' />
        <div id='edit-avatar-preview' class='mt-2'></div>
      </div>
      <div>
  <label for='edit-alias' class='block mb-1' data-i18n='aliasLabel'>${t.aliasLabel}</label>
        <input type='text' id='edit-alias' name='alias' class='w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-400' required />
      </div>
      <div>
  <label for='edit-username' class='block mb-1' data-i18n='usernameLabel'>${t.usernameLabel}</label>
        <input type='text' id='edit-username' name='username' class='w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-400' required />
      </div>
      <div>
  <label for='edit-email' class='block mb-1' data-i18n='emailLabel'>${t.emailLabel}</label>
        <input type='email' id='edit-email' name='email' class='w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-400' required />
      </div>
      <div class='flex items-center space-x-2'>
        <input type='checkbox' id='edit-email-visible' name='emailVisible' class='rounded bg-gray-800 border border-gray-700 text-green-600 focus:outline-none focus:ring-2 focus:ring-green-400' />
        <label for='edit-email-visible' class='text-gray-300'>${t.showEmailPublicly}</label>
      </div>
      <div>
  <label for='edit-bio' class='block mb-1' data-i18n='biographyLabel'>${t.biographyLabel}</label>
        <textarea id='edit-bio' name='bio' rows='3' class='w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-400'></textarea>
      </div>
      
      <!-- Two-Factor Authentication Section -->
      <div class='border-t border-gray-700 pt-4 mt-6'>
  <h3 class='text-lg font-semibold mb-3 text-blue-400' data-i18n='twoFactorTitle'>🔐 Two-Factor Authentication</h3>
  <p class='text-sm text-gray-400 mb-4' data-i18n='twoFactorDescription'>Add an extra layer of security to your account with TOTP-based 2FA using apps like Google Authenticator or Authy.</p>
        
        <div id='2fa-status' class='mb-4'>
          <div id='2fa-disabled' class='hidden'>
            <div class='flex items-center space-x-2 mb-3'>
              <span class='text-red-400'>❌</span>
              <span class='text-gray-300' data-i18n='twoFactorDisabled'>${t.twoFactorDisabled}</span>
            </div>
            <button type='button' id='enable-2fa-btn' class='w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded focus:outline-none focus:ring-4 focus:ring-blue-400'>
              <span data-i18n='enable2FA'>${t.enable2FA}</span>
            </button>
          </div>
          
          <div id='2fa-enabled' class='hidden'>
            <div class='flex items-center space-x-2 mb-3'>
              <span class='text-green-400'>✅</span>
              <span class='text-gray-300' data-i18n='twoFactorEnabled'>${t.twoFactorEnabled}</span>
            </div>
            <button type='button' id='disable-2fa-btn' class='w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded focus:outline-none focus:ring-4 focus:ring-red-400'>
              <span data-i18n='disable2FA'>${t.disable2FA}</span>
            </button>
          </div>
        </div>
      </div>
      
      <div>
  <label for='edit-password' class='block mb-1' data-i18n='newPasswordLabel'>${t.newPasswordLabel}</label>
        <input type='password' id='edit-password' name='password' class='w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-400' autocomplete='new-password' />
      </div>
      <div>
  <label for='edit-current-password' class='block mb-1' data-i18n='currentPasswordLabel'>${t.currentPasswordLabel} <span class='text-yellow-500'>*</span> <small class='text-gray-400'>(Required only for username, email and password changes)</small></label>
        <input type='password' id='edit-current-password' name='currentPassword' class='w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-400' autocomplete='current-password' />
      </div>
  <button type='submit' id='edit-profile-submit' data-i18n='editProfileLoading' class='w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded focus:outline-none focus:ring-4 focus:ring-green-400 disabled:opacity-50 disabled:cursor-not-allowed'>${t.editProfileLoading}</button>
      <div id='edit-profile-error' class='text-red-500 mt-2 hidden'></div>
      <div id='edit-profile-success' class='text-green-500 mt-2 hidden'></div>
    </form>
  <button id='back-home-edit-profile' data-i18n='backToProfile' class='mt-6 w-full px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded focus:outline-none focus:ring-4 focus:ring-gray-400'>${t.backToProfile}</button>
  </div>`,

  // Profile page for logged-in user
  'profile': (t) => `<div class='max-w-md mx-auto mt-16 p-8 bg-gray-900 rounded-lg shadow-lg' id='profile-page'>
    <div class='flex flex-col items-center'>
      <div id='profile-avatar' class='mb-4'></div>
      <div class='text-2xl font-bold mb-2' id='profile-alias'></div>
      <div class='text-gray-400 mb-2' id='profile-username'></div>
      <div class='text-gray-400 mb-4' id='profile-email'></div>
      <div class='text-base text-white mb-6' id='profile-bio'></div>
      <div id='profile-stats-counters' class='w-full mb-6'></div>
      <div id='profile-match-history' class='w-full mb-6'></div>
  <div class='w-full mb-6' id='profile-skinColor-container'>
        <label for='profile-skinColor' id='profile-skinColor-label' class='block mb-1' data-i18n='paddleColorLabel'>${t.paddleColorLabel}</label>
        <select id='profile-skinColor' name='skinColor' class='w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400'>
          <option data-i18n='colorRed' value="#FF0000" style="color:#FF0000">${t.colorRed}</option>
          <option data-i18n='colorGreen' value="#00FF00" style="color:#00FF00">${t.colorGreen}</option>
          <option data-i18n='colorBlue' value="#0000FF" style="color:#0000FF">${t.colorBlue}</option>
          <option data-i18n='colorYellow' value="#FFFF00" style="color:#FFFF00">${t.colorYellow}</option>
          <option data-i18n='colorMagenta' value="#FF00FF" style="color:#FF00FF">${t.colorMagenta}</option>
          <option data-i18n='colorWhite' value="#FFFFFF" style="color:#FFFFFF">${t.colorWhite}</option>
        </select>
  <button id='profile-skinColor-confirm' data-i18n='confirmColor' class='mt-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-green-400'>${t.confirmColor}</button>
        <div id='profile-skinColor-success' class='text-green-500 mt-2 hidden'></div>
        <div id='profile-skinColor-error' class='text-red-500 mt-2 hidden'></div>
      </div>
  <button id='edit-profile-btn' data-i18n='editProfileButton' class='w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded focus:outline-none focus:ring-4 focus:ring-green-400 mb-2'>${t.editProfileButton}</button>
  <a href="/public/static/GDPR_Compliance.pdf" target="_blank" class="w-full block mb-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded focus:outline-none focus:ring-4 focus:ring-blue-400 text-center" data-i18n='viewPrivacyPolicy'>${t.viewPrivacyPolicy}</a>
  <button id='delete-profile-btn' data-i18n='deleteProfile' class='w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded focus:outline-none focus:ring-4 focus:ring-red-400 mb-2'>${t.deleteProfile}</button>
      <div id='delete-profile-error' class='text-red-500 mb-2 hidden'></div>
  <button id='back-home-profile' data-i18n='backToHome' class='mt-2 w-full px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded focus:outline-none focus:ring-4 focus:ring-gray-400'>${t.backToHome || 'Back to Home'}</button>
    </div>
  </div>`
};