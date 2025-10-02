// Route definitions for the application
export const routes: { [key: string]: string } = {
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
  'options': `
    <h2 class="text-2xl font-bold mb-4">Options</h2>
    <div style="max-width: 600px; margin: 0 auto; background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; color: white;">
      <div style="margin-bottom: 20px;">
        <label for="ball-speed" style="display: block; margin-bottom: 5px;">Ball Speed:</label>
        <input type="range" id="ball-speed" min="1" max="10" value="3" style="width: 100%; margin-bottom: 5px;">
        <span id="ball-speed-value" style="font-size: 14px; color: #ccc;">3</span>
      </div>
      <div style="margin-bottom: 20px;">
        <label for="paddle-speed" style="display: block; margin-bottom: 5px;">Paddle Speed:</label>
        <input type="range" id="paddle-speed" min="1" max="10" value="5" style="width: 100%; margin-bottom: 5px;">
        <span id="paddle-speed-value" style="font-size: 14px; color: #ccc;">5</span>
      </div>
      <div style="margin-bottom: 20px;">
        <label for="points-to-win" style="display: block; margin-bottom: 5px;">Points to Win:</label>
        <select id="points-to-win" style="width: 100%; padding: 5px; border-radius: 5px; background: #333; color: white; border: 1px solid #555;">
          <option value="3">3 Points</option>
          <option value="5">5 Points</option>
          <option value="11" selected>11 Points</option>
          <option value="21">21 Points</option>
        </select>
      </div>
      <button id="save-options" style="width: 100%; padding: 10px; background: #007acc; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">Save Settings</button>
      <div id="save-status" style="margin-top: 10px; text-align: center; font-size: 14px; color: #4CAF50;"></div>
    </div>
  `,
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
      <div class='flex items-start mb-2'>
        <input id='register-gdpr' name='gdpr' type='checkbox' class='mt-1 mr-2' required />
        <label for='register-gdpr' class='text-sm text-gray-300'>I have read and accept the <a href="/public/static/GDPR_Compliance.pdf" target="_blank" class="underline text-blue-400 hover:text-blue-600">privacy policy</a>.</label>
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
  </div>`,
  'friends': `<div class='max-w-4xl mx-auto mt-8 p-6 bg-gray-900 rounded-lg shadow-lg'>
    <h2 class='text-3xl font-bold mb-6 text-center'>Friends</h2>
    
    <!-- Send Friend Request Section -->
    <div class='mb-8 p-4 bg-gray-800 rounded-lg'>
      <h3 class='text-xl font-semibold mb-4'>Send Friend Request</h3>
      <form id='send-friend-request-form' class='flex space-x-2'>
        <input type='text' id='friend-username' placeholder='Enter username' class='flex-1 px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-400' required />
        <button type='submit' class='px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded focus:outline-none focus:ring-4 focus:ring-purple-400'>Send Request</button>
      </form>
      <div id='send-request-status' class='mt-2 text-sm'></div>
    </div>

    <!-- Pending Friend Requests Section -->
    <div class='mb-8 p-4 bg-gray-800 rounded-lg'>
      <h3 class='text-xl font-semibold mb-4'>Pending Requests</h3>
      <div id='pending-requests'>
        <div class='text-center py-4'>
          <div class='inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-white'></div>
          <p class='mt-2 text-gray-400'>Loading requests...</p>
        </div>
      </div>
    </div>

    <!-- Friends List Section -->
    <div class='p-4 bg-gray-800 rounded-lg'>
      <h3 class='text-xl font-semibold mb-4'>Your Friends</h3>
      <div id='friends-list'>
        <div class='text-center py-4'>
          <div class='inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-white'></div>
          <p class='mt-2 text-gray-400'>Loading friends...</p>
        </div>
      </div>
    </div>

    <button id='back-home-friends' class='mt-6 w-full px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded focus:outline-none focus:ring-4 focus:ring-gray-400'>Back to Home</button>
  </div>`,
  'edit-profile': `<div class='max-w-md mx-auto mt-16 p-8 bg-gray-900 rounded-lg shadow-lg'>
    <h2 class='text-2xl font-bold mb-6 text-center' tabindex='0'>Edit Profile</h2>
  <form id='edit-profile-form' class='space-y-4' method='POST' enctype='multipart/form-data'>
      <div>
        <label for='edit-avatar' class='block mb-1'>Avatar Image</label>
        <input type='file' id='edit-avatar' name='avatar' accept='image/png,image/jpeg,image/webp' class='w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-400' />
        <div id='edit-avatar-preview' class='mt-2'></div>
      </div>
      <div>
        <label for='edit-alias' class='block mb-1'>Alias (Display Name)</label>
        <input type='text' id='edit-alias' name='alias' class='w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-400' required />
      </div>
      <div>
        <label for='edit-username' class='block mb-1'>Username</label>
        <input type='text' id='edit-username' name='username' class='w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-400' required />
      </div>
      <div>
        <label for='edit-email' class='block mb-1'>Email</label>
        <input type='email' id='edit-email' name='email' class='w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-400' required />
      </div>
      <div class='flex items-center space-x-2'>
        <input type='checkbox' id='edit-email-visible' name='emailVisible' class='rounded bg-gray-800 border border-gray-700 text-green-600 focus:outline-none focus:ring-2 focus:ring-green-400' />
        <label for='edit-email-visible' class='text-gray-300'>Show email publicly</label>
      </div>
      <div>
        <label for='edit-bio' class='block mb-1'>Biography</label>
        <textarea id='edit-bio' name='bio' rows='3' class='w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-400'></textarea>
      </div>
      
      <!-- Two-Factor Authentication Section -->
      <div class='border-t border-gray-700 pt-4 mt-6'>
        <h3 class='text-lg font-semibold mb-3 text-blue-400'>🔐 Two-Factor Authentication</h3>
        <p class='text-sm text-gray-400 mb-4'>Add an extra layer of security to your account with TOTP-based 2FA using apps like Google Authenticator or Authy.</p>
        
        <div id='2fa-status' class='mb-4'>
          <div id='2fa-disabled' class='hidden'>
            <div class='flex items-center space-x-2 mb-3'>
              <span class='text-red-400'>❌</span>
              <span class='text-gray-300'>Two-Factor Authentication is <strong>disabled</strong></span>
            </div>
            <button type='button' id='enable-2fa-btn' class='w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded focus:outline-none focus:ring-4 focus:ring-blue-400'>
              Enable 2FA
            </button>
          </div>
          
          <div id='2fa-enabled' class='hidden'>
            <div class='flex items-center space-x-2 mb-3'>
              <span class='text-green-400'>✅</span>
              <span class='text-gray-300'>Two-Factor Authentication is <strong>enabled</strong></span>
            </div>
            <button type='button' id='disable-2fa-btn' class='w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded focus:outline-none focus:ring-4 focus:ring-red-400'>
              Disable 2FA
            </button>
          </div>
        </div>
      </div>
      
      <div>
        <label for='edit-password' class='block mb-1'>New Password</label>
        <input type='password' id='edit-password' name='password' class='w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-400' autocomplete='new-password' />
      </div>
      <div>
        <label for='edit-current-password' class='block mb-1'>Current Password <span class='text-yellow-500'>*</span> <small class='text-gray-400'>(Required only for username, email and password changes)</small></label>
        <input type='password' id='edit-current-password' name='currentPassword' class='w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-400' autocomplete='current-password' />
      </div>
      <button type='submit' id='edit-profile-submit' class='w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded focus:outline-none focus:ring-4 focus:ring-green-400 disabled:opacity-50 disabled:cursor-not-allowed'>Loading...</button>
      <div id='edit-profile-error' class='text-red-500 mt-2 hidden'></div>
      <div id='edit-profile-success' class='text-green-500 mt-2 hidden'></div>
    </form>
    <button id='back-home-edit-profile' class='mt-6 w-full px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded focus:outline-none focus:ring-4 focus:ring-gray-400'>Back to Profile</button>
  </div>`,

  // Profile page for logged-in user
  'profile': `<div class='max-w-md mx-auto mt-16 p-8 bg-gray-900 rounded-lg shadow-lg' id='profile-page'>
    <div class='flex flex-col items-center'>
      <div id='profile-avatar' class='mb-4'></div>
      <div class='text-2xl font-bold mb-2' id='profile-alias'></div>
      <div class='text-gray-400 mb-2' id='profile-username'></div>
      <div class='text-gray-400 mb-4' id='profile-email'></div>
      <div class='text-base text-white mb-6' id='profile-bio'></div>
      <div id='profile-stats-counters' class='w-full mb-6'></div>
      <div id='profile-match-history' class='w-full mb-6'></div>
  <div class='w-full mb-6' id='profile-skinColor-container'>
        <label for='profile-skinColor' class='block mb-1'>Paddle Color</label>
        <select id='profile-skinColor' name='skinColor' class='w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400'>
          <option value="#FF0000" style="color:#FF0000">Red</option>
          <option value="#00FF00" style="color:#00FF00">Green</option>
          <option value="#0000FF" style="color:#0000FF">Blue</option>
          <option value="#FFFF00" style="color:#FFFF00">Yellow</option>
          <option value="#FF00FF" style="color:#FF00FF">Magenta</option>
          <option value="#FFFFFF" style="color:#FFFFFF">White</option>
        </select>
        <button id='profile-skinColor-confirm' class='mt-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-green-400'>Confirm Color</button>
        <div id='profile-skinColor-success' class='text-green-500 mt-2 hidden'></div>
        <div id='profile-skinColor-error' class='text-red-500 mt-2 hidden'></div>
      </div>
      <button id='edit-profile-btn' class='w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded focus:outline-none focus:ring-4 focus:ring-green-400 mb-2'>Edit Profile Information</button>
      <a href="/public/static/GDPR_Compliance.pdf" target="_blank" class="w-full block mb-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded focus:outline-none focus:ring-4 focus:ring-blue-400 text-center">View Privacy Policy</a>
      <button id='delete-profile-btn' class='w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded focus:outline-none focus:ring-4 focus:ring-red-400 mb-2'>Delete Profile</button>
      <div id='delete-profile-error' class='text-red-500 mb-2 hidden'></div>
      <button id='back-home-profile' class='mt-2 w-full px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded focus:outline-none focus:ring-4 focus:ring-gray-400'>Back to Home</button>
    </div>
  </div>`
};