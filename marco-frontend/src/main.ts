// Import extracted modules
import { translations } from './config/translations.js';
import { API_BASE, HEARTBEAT_INTERVAL_MS } from './config/constants.js';
import { showStatus, accessibilityTogglesUI } from './utils/dom-helpers.js';
import { GameSettings, GameSettingsService } from './services/game-settings.js';
import { StorageService, Language } from './services/storage.js';
import { HeartbeatService } from './services/heartbeat.js';
import { MatchHistoryManager } from './features/match-history.js';
import { ProfileManager } from './features/profile.js';
import { LanguageManager } from './features/language.js';
import { PongEngine } from './game/pong-engine.js';

// SPA navigation logic
const routes: { [key: string]: string } = {
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
    <button id='back-home-edit-profile' class='mt-6 w-full px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded focus:outline-none focus:ring-4 focus:ring-gray-400'>Back to Home</button>
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

let loggedInUser: string | null = StorageService.getLoggedInUser();
// Store avatar URL for logged-in user
let loggedInUserAvatar: string | null = StorageService.getLoggedInUserAvatar();

// Expose on window for other modules
(window as any).loggedInUser = loggedInUser;

// Store current friends counts to avoid flashing 0s during page navigation
let currentOnlineFriendsCount: number = StorageService.getCurrentOnlineFriendsCount();
let currentPendingRequestsCount: number = StorageService.getCurrentPendingRequestsCount();

export function setLoggedInUser(username: string | null, newAvatarUrl?: string, skipRender: boolean = false) {
  loggedInUser = username;
  (window as any).loggedInUser = username; // Keep window in sync
  if (username) {
    StorageService.setLoggedInUser(username);
    
    // Start heartbeat for logged-in user
    HeartbeatService.start(username);
    
    // Update friends count
    setTimeout(() => updateFriendsCount(), 1000);
    
    // If a new avatar URL is explicitly provided, use it immediately
    if (newAvatarUrl !== undefined) {
      loggedInUserAvatar = newAvatarUrl;
      StorageService.setLoggedInUserAvatar(newAvatarUrl);
      // Update cache buster for immediate avatar refresh
      if (newAvatarUrl && newAvatarUrl.includes('/uploads/')) {
        StorageService.setAvatarCacheBuster();
      }
      // Re-render to update avatar immediately (unless skipRender is true)
      if (!skipRender) {
        render(window.location.hash.replace('#', ''));
      }
      return;
    }
    
    // Fetch avatar URL for the user with cache-busting
    const cacheBuster = Date.now();
    fetch(`${API_BASE}/users/${username}?_t=${cacheBuster}`)
      .then(res => res.json())
      .then(user => {
        const avatarUrl = user.profile?.avatarUrl || null;
        loggedInUserAvatar = avatarUrl;
        StorageService.setLoggedInUserAvatar(avatarUrl);
        // Re-render to update avatar if needed
        render(window.location.hash.replace('#', ''));
      })
      .catch(() => {
        loggedInUserAvatar = null;
        StorageService.setLoggedInUserAvatar(null);
        render(window.location.hash.replace('#', ''));
      });
  } else {
    // Stop heartbeat when logging out
    HeartbeatService.stop();
    StorageService.clearUserData();
    loggedInUserAvatar = null;
    currentOnlineFriendsCount = 0;
    currentPendingRequestsCount = 0;
  }
}

// Expose setLoggedInUser on window for other modules
(window as any).setLoggedInUser = setLoggedInUser;

function initializeOptionsPage(): void {
  const settings = GameSettingsService.load();
  
  const ballSpeedSlider = document.getElementById('ball-speed') as HTMLInputElement;
  const ballSpeedValue = document.getElementById('ball-speed-value') as HTMLSpanElement;
  const paddleSpeedSlider = document.getElementById('paddle-speed') as HTMLInputElement;
  const paddleSpeedValue = document.getElementById('paddle-speed-value') as HTMLSpanElement;
  const pointsSelect = document.getElementById('points-to-win') as HTMLSelectElement;
  const saveButton = document.getElementById('save-options') as HTMLButtonElement;
  const saveStatus = document.getElementById('save-status') as HTMLDivElement;
  
  if (ballSpeedSlider && ballSpeedValue) {
    ballSpeedSlider.value = settings.ballSpeed.toString();
    ballSpeedValue.textContent = settings.ballSpeed.toString();
    ballSpeedSlider.addEventListener('input', () => {
      ballSpeedValue.textContent = ballSpeedSlider.value;
    });
  }
  
  if (paddleSpeedSlider && paddleSpeedValue) {
    paddleSpeedSlider.value = settings.paddleSpeed.toString();
    paddleSpeedValue.textContent = settings.paddleSpeed.toString();
    paddleSpeedSlider.addEventListener('input', () => {
      paddleSpeedValue.textContent = paddleSpeedSlider.value;
    });
  }
  
  if (pointsSelect) {
    pointsSelect.value = settings.pointsToWin.toString();
  }
  
  if (saveButton) {
    saveButton.addEventListener('click', () => {
      const newSettings: GameSettings = {
        ballSpeed: parseInt(ballSpeedSlider?.value || '3'),
        paddleSpeed: parseInt(paddleSpeedSlider?.value || '5'),
        pointsToWin: parseInt(pointsSelect?.value || '11')
      };
      
      GameSettingsService.save(newSettings);
      
      if (saveStatus) {
        saveStatus.textContent = 'Settings saved successfully!';
        setTimeout(() => {
          saveStatus.textContent = '';
        }, 3000);
      }
    });
  }
}

// Friends page functionality
async function initializeFriendsPage() {
  if (!loggedInUser) return;

  // Load initial data
  loadPendingRequests();
  loadFriendsList();
  updateFriendsCount();

  // Set up form listeners
  const sendRequestForm = document.getElementById('send-friend-request-form') as HTMLFormElement;
  const backButton = document.getElementById('back-home-friends') as HTMLButtonElement;

  if (sendRequestForm) {
    sendRequestForm.addEventListener('submit', handleSendFriendRequest);
  }

  if (backButton) {
    backButton.addEventListener('click', () => {
      window.location.hash = '';
    });
  }
}

async function handleSendFriendRequest(e: Event) {
  e.preventDefault();
  if (!loggedInUser) return;

  const form = e.target as HTMLFormElement;
  const usernameInput = document.getElementById('friend-username') as HTMLInputElement;
  const statusDiv = document.getElementById('send-request-status') as HTMLDivElement;
  const toUsername = usernameInput.value.trim();

  if (!toUsername) {
    showStatus(statusDiv, 'Please enter a username', 'error');
    return;
  }

  try {
    // Get current user's password (we'll need a simpler auth method in the future)
    const password = prompt('Enter your password to send friend request:');
    if (!password) return;

    const response = await fetch(`${API_BASE}/friends/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fromUsername: loggedInUser,
        currentPassword: password,
        toUsername: toUsername
      })
    });

    const result = await response.json();

    if (response.ok) {
      showStatus(statusDiv, 'Friend request sent successfully!', 'success');
      usernameInput.value = '';
      loadPendingRequests(); // Refresh pending requests
    } else {
      showStatus(statusDiv, result.error || 'Failed to send friend request', 'error');
    }
  } catch (error) {
    showStatus(statusDiv, 'Error sending friend request', 'error');
    console.error('Error:', error);
  }
}

async function loadPendingRequests() {
  if (!loggedInUser) return;

  const container = document.getElementById('pending-requests');
  if (!container) return;

  try {
    const response = await fetch(`${API_BASE}/friends/requests?for=${loggedInUser}`);
    const data = await response.json();

    if (response.ok) {
      const { incoming, outgoing } = data;
      let html = '';

      if (incoming.length === 0 && outgoing.length === 0) {
        html = '<p class="text-gray-400 text-center">No pending requests</p>';
      } else {
        if (incoming.length > 0) {
          html += '<h4 class="font-semibold mb-2">Incoming Requests</h4>';
          incoming.forEach((req: any) => {
            html += `
              <div class="flex items-center justify-between p-3 bg-gray-700 rounded mb-2">
                <span>${req.fromUser.username}</span>
                <div class="space-x-2">
                  <button class="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm" onclick="acceptFriendRequest(${req.id})">Accept</button>
                  <button class="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm" onclick="rejectFriendRequest(${req.id})">Reject</button>
                </div>
              </div>
            `;
          });
        }

        if (outgoing.length > 0) {
          html += '<h4 class="font-semibold mb-2 mt-4">Outgoing Requests</h4>';
          outgoing.forEach((req: any) => {
            html += `
              <div class="flex items-center justify-between p-3 bg-gray-700 rounded mb-2">
                <span>${req.toUser.username}</span>
                <div class="flex items-center space-x-2">
                  <span class="text-gray-400 text-sm">Pending...</span>
                  <button class="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm" onclick="cancelFriendRequest(${req.id})">Cancel</button>
                </div>
              </div>
            `;
          });
        }
      }

      container.innerHTML = html;
    }
  } catch (error) {
    console.error('Error loading pending requests:', error);
    container.innerHTML = '<p class="text-red-400 text-center">Error loading requests</p>';
  }
}

async function loadFriendsList() {
  if (!loggedInUser) return;

  const container = document.getElementById('friends-list');
  if (!container) return;

  try {
    const response = await fetch(`${API_BASE}/friends/${loggedInUser}`);
    const data = await response.json();

    if (response.ok) {
      const { friends } = data;
      let html = '';

      if (friends.length === 0) {
        html = '<p class="text-gray-400 text-center">No friends yet</p>';
      } else {
        // Sort friends to prioritize online users first
        const sortedFriends = friends.sort((a: any, b: any) => {
          const isAOnline = a.online === 'online' && a.heartbeat && 
                           new Date(a.heartbeat) > new Date(Date.now() - 2 * 60 * 1000);
          const isBOnline = b.online === 'online' && b.heartbeat && 
                           new Date(b.heartbeat) > new Date(Date.now() - 2 * 60 * 1000);
          
          // Online friends first, then offline friends
          if (isAOnline && !isBOnline) return -1;
          if (!isAOnline && isBOnline) return 1;
          
          // If both have same online status, sort alphabetically by username
          return a.username.localeCompare(b.username);
        });

        sortedFriends.forEach((friend: any) => {
          const avatarUrl = friend.avatarUrl 
            ? (friend.avatarUrl.startsWith('/') ? API_BASE + friend.avatarUrl : friend.avatarUrl)
            : `${API_BASE}/static/default_avatar.png`;
          
          // Determine online status with proper logic
          const isOnline = friend.online === 'online' && friend.heartbeat && 
                          new Date(friend.heartbeat) > new Date(Date.now() - 2 * 60 * 1000);
          
          const onlineIndicator = isOnline 
            ? '<span class="w-2 h-2 bg-green-500 rounded-full" title="Online"></span>'
            : '<span class="w-2 h-2 bg-gray-500 rounded-full" title="Offline"></span>';
          
          const onlineText = isOnline ? 'Online' : 'Offline';
          
          html += `
            <div class="flex items-center justify-between p-3 bg-gray-700 rounded mb-2">
              <div class="flex items-center space-x-3">
                <img src="${avatarUrl}" alt="Avatar" class="w-8 h-8 rounded-full object-cover bg-gray-600" />
                <div>
                  <button class="text-blue-400 hover:text-blue-300 font-medium" onclick="viewProfile('${friend.username}')">${friend.username}</button>
                  ${friend.alias ? `<p class="text-gray-400 text-sm">${friend.alias}</p>` : ''}
                </div>
              </div>
              <div class="flex items-center space-x-2">
                <div class="flex items-center space-x-1">
                  ${onlineIndicator}
                  <span class="text-xs text-gray-400">${onlineText}</span>
                </div>
                <button class="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm" onclick="removeFriend('${friend.username}')">Remove</button>
              </div>
            </div>
          `;
        });
      }

      container.innerHTML = html;
    }
  } catch (error) {
    console.error('Error loading friends list:', error);
    container.innerHTML = '<p class="text-red-400 text-center">Error loading friends</p>';
  }
}

async function acceptFriendRequest(requestId: number) {
  if (!loggedInUser) return;

  try {
    const password = prompt('Enter your password to accept friend request:');
    if (!password) return;

    const response = await fetch(`${API_BASE}/friends/requests/${requestId}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: loggedInUser,
        currentPassword: password
      })
    });

    if (response.ok) {
      loadPendingRequests(); // Refresh pending requests
      loadFriendsList(); // Refresh friends list
      updateFriendsCount(); // Update friends count
    } else {
      const error = await response.json();
      alert(error.error || 'Failed to accept friend request');
    }
  } catch (error) {
    console.error('Error accepting friend request:', error);
    alert('Error accepting friend request');
  }
}

async function rejectFriendRequest(requestId: number) {
  if (!loggedInUser) return;

  const confirmed = confirm('Are you sure you want to reject this friend request?');
  if (!confirmed) return;

  try {
    const password = prompt('Enter your password to reject friend request:');
    if (!password) return;

    const response = await fetch(`${API_BASE}/friends/requests/${requestId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: loggedInUser,
        currentPassword: password
      })
    });

    if (response.ok) {
      loadPendingRequests(); // Refresh pending requests
      updateFriendsCount(); // Update friends count
    } else {
      const error = await response.json();
      alert(error.error || 'Failed to reject friend request');
    }
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    alert('Error rejecting friend request');
  }
}

async function cancelFriendRequest(requestId: number) {
  if (!loggedInUser) return;

  const confirmed = confirm('Are you sure you want to cancel this friend request?');
  if (!confirmed) return;

  try {
    const password = prompt('Enter your password to cancel friend request:');
    if (!password) return;

    const response = await fetch(`${API_BASE}/friends/requests/${requestId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: loggedInUser,
        currentPassword: password
      })
    });

    if (response.ok) {
      loadPendingRequests(); // Refresh pending requests
      updateFriendsCount(); // Update friends count
    } else {
      const error = await response.json();
      alert(error.error || 'Failed to cancel friend request');
    }
  } catch (error) {
    console.error('Error canceling friend request:', error);
    alert('Error canceling friend request');
  }
}

async function removeFriend(friendUsername: string) {
  if (!loggedInUser) return;

  const confirmed = confirm(`Are you sure you want to remove ${friendUsername} from your friends?`);
  if (!confirmed) return;

  try {
    const password = prompt('Enter your password to remove friend:');
    if (!password) return;

    const response = await fetch(`${API_BASE}/friends/${friendUsername}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: loggedInUser,
        currentPassword: password
      })
    });

    if (response.ok) {
      loadFriendsList(); // Refresh friends list
      updateFriendsCount(); // Update friends count
    } else {
      const error = await response.json();
      alert(error.error || 'Failed to remove friend');
    }
  } catch (error) {
    console.error('Error removing friend:', error);
    alert('Error removing friend');
  }
}

function viewProfile(username: string) {
  window.location.hash = `#profile/${username}`;
}

async function updateFriendsCount() {
  if (!loggedInUser) return;

  try {
    // Get pending requests count
    const requestsResponse = await fetch(`${API_BASE}/friends/requests?for=${loggedInUser}`);
    const requestsData = await requestsResponse.json();
    
    // Get friends list with online status
    const friendsResponse = await fetch(`${API_BASE}/friends/${loggedInUser}`);
    const friendsData = await friendsResponse.json();
    
    if (requestsResponse.ok && friendsResponse.ok) {
      const pendingCount = requestsData.incoming.length;
      const friends = friendsData.friends || [];
      
      // Count online friends (those with recent heartbeat)
      const onlineFriendsCount = friends.filter((friend: any) => {
        return friend.online === 'online' && friend.heartbeat && 
               new Date(friend.heartbeat) > new Date(Date.now() - 2 * 60 * 1000);
      }).length;
      
      // Store the counts in global variables and localStorage to avoid flashing 0s
      currentOnlineFriendsCount = onlineFriendsCount;
      currentPendingRequestsCount = pendingCount;
      StorageService.setCurrentOnlineFriendsCount(onlineFriendsCount);
      StorageService.setCurrentPendingRequestsCount(pendingCount);
      
      // Update both counts
      const pendingElement = document.getElementById('pending-requests-count');
      const onlineElement = document.getElementById('friends-online-count');
      
      if (pendingElement) {
        pendingElement.textContent = pendingCount.toString();
      }
      
      if (onlineElement) {
        onlineElement.textContent = onlineFriendsCount.toString();
      }
      
      // Change button color if there are pending requests
      const friendsBtn = document.getElementById('friends-btn');
      if (friendsBtn) {
        if (pendingCount > 0) {
          friendsBtn.className = friendsBtn.className.replace('bg-purple-600 hover:bg-purple-700', 'bg-orange-600 hover:bg-orange-700');
        } else {
          friendsBtn.className = friendsBtn.className.replace('bg-orange-600 hover:bg-orange-700', 'bg-purple-600 hover:bg-purple-700');
        }
      }
    }
  } catch (error) {
    console.error('Error updating friends count:', error);
  }
}

// Make functions globally available for onclick handlers
(window as any).acceptFriendRequest = acceptFriendRequest;
(window as any).rejectFriendRequest = rejectFriendRequest;
(window as any).cancelFriendRequest = cancelFriendRequest;
(window as any).removeFriend = removeFriend;
(window as any).viewProfile = viewProfile;

function generateViewProfilePage(username: string): string {
  return `<div class='max-w-md mx-auto mt-16 p-8 bg-gray-900 rounded-lg shadow-lg' id='view-profile-page'>
    <div class='flex flex-col items-center'>
      <div class='text-center py-8'>
        <div class='inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white'></div>
        <p class='mt-2 text-gray-400'>Loading profile...</p>
      </div>
      <button id='back-home-view-profile' class='mt-6 w-full px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded focus:outline-none focus:ring-4 focus:ring-gray-400'>Back to Home</button>
    </div>
  </div>`;
}

async function loadUserProfile(username: string) {
  try {
    // Fetch user profile, stats, and match history
    const [userResponse, statsResponse, matchHistoryResponse] = await Promise.all([
      fetch(`${API_BASE}/users/${username}`),
      fetch(`${API_BASE}/stats/${username}`),
      fetch(`${API_BASE}/matches/history/${username}`)
    ]);

    if (!userResponse.ok) {
      throw new Error('User not found');
    }

    const userData = await userResponse.json();
    const statsData = statsResponse.ok ? await statsResponse.json() : null;
    const matchHistoryData = matchHistoryResponse.ok ? await matchHistoryResponse.json() : null;

    // Update the profile page content
    const container = document.getElementById('view-profile-page');
    if (container) {
      // Avatar HTML - matching the exact format from "my profile"
      let avatarUrl = userData.profile?.avatarUrl || '';
      if (avatarUrl.startsWith('/uploads') || avatarUrl.startsWith('/static')) {
        avatarUrl = API_BASE + avatarUrl;
      }
      
      const avatarHtml = avatarUrl
        ? `<img src='${avatarUrl}' alt='avatar' class='w-32 h-32 rounded-full border-4 border-gray-600 bg-gray-700 object-cover mb-2' onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" /><span class='w-32 h-32 rounded-full bg-gray-700 border-4 border-gray-600 flex items-center justify-center mb-2' style='display:none;'><svg width='64' height='64' fill='none' viewBox='0 0 24 24'><circle cx='12' cy='8' r='4' fill='#bbb'/><ellipse cx='12' cy='18' rx='7' ry='4' fill='#bbb'/></svg></span>`
        : `<span class='w-32 h-32 rounded-full bg-gray-700 border-4 border-gray-600 flex items-center justify-center mb-2'><svg width='64' height='64' fill='none' viewBox='0 0 24 24'><circle cx='12' cy='8' r='4' fill='#bbb'/><ellipse cx='12' cy='18' rx='7' ry='4' fill='#bbb'/></svg></span>`;

      // Stats HTML - matching the exact format from "my profile"
      const statsHtml = statsData ? `
        <div class='w-full mb-6'>
          <div class='grid grid-cols-2 gap-4 mb-2'>
            <div class='bg-gray-800 rounded-lg p-4 flex flex-col items-center'>
              <div class='text-lg font-semibold text-green-400'>Bot</div>
              <div class='flex space-x-4 mt-2'>
                <div class='text-center'>
                  <div class='text-2xl font-bold'>${statsData.botWins ?? 0}</div>
                  <div class='text-gray-400 text-sm'>Wins</div>
                </div>
                <div class='text-center'>
                  <div class='text-2xl font-bold'>${statsData.botLosses ?? 0}</div>
                  <div class='text-gray-400 text-sm'>Losses</div>
                </div>
              </div>
            </div>
            <div class='bg-gray-800 rounded-lg p-4 flex flex-col items-center'>
              <div class='text-lg font-semibold text-blue-400'>Player</div>
              <div class='flex space-x-4 mt-2'>
                <div class='text-center'>
                  <div class='text-2xl font-bold'>${statsData.playerWins ?? 0}</div>
                  <div class='text-gray-400 text-sm'>Wins</div>
                </div>
                <div class='text-center'>
                  <div class='text-2xl font-bold'>${statsData.playerLosses ?? 0}</div>
                  <div class='text-gray-400 text-sm'>Losses</div>
                </div>
              </div>
            </div>
          </div>
          <div class='bg-gray-800 rounded-lg p-4 flex flex-col items-center'>
            <div class='text-lg font-semibold text-yellow-400'>Tournament Wins</div>
            <div class='text-3xl font-bold mt-2'>${statsData.tournamentWins ?? 0}</div>
          </div>
        </div>
      ` : '';

      // Match History HTML
      const matchHistoryHtml = matchHistoryData ? MatchHistoryManager.generateMatchHistoryHtml(matchHistoryData.matches || [], username) : '';

      container.innerHTML = `
        <div class='flex flex-col items-center'>
          <div class='mb-4'>${avatarHtml}</div>
          <div class='text-2xl font-bold mb-2'>${userData.profile?.alias || userData.username}</div>
          <div class='text-gray-400 mb-2'>@${userData.username}</div>
          ${userData.profile?.emailVisible && userData.email && userData.email !== '*************' ? `<div class='text-gray-400 mb-4'>${userData.email}</div>` : ''}
          ${userData.profile?.bio ? `<div class='text-base text-white mb-6'>${userData.profile.bio}</div>` : ''}
          ${statsHtml}
          ${matchHistoryHtml}
          <button id='back-home-view-profile' class='mt-2 w-full px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded focus:outline-none focus:ring-4 focus:ring-gray-400'>Back to Friends</button>
        </div>
      `;
      
      // Attach back button listener to go to friends page
      document.getElementById('back-home-view-profile')?.addEventListener('click', () => {
        window.location.hash = 'friends';
      });
    }
  } catch (error) {
    console.error('Error loading user profile:', error);
    const container = document.getElementById('view-profile-page');
    if (container) {
      container.innerHTML = `
        <div class='flex flex-col items-center'>
          <div class='text-red-400 mb-4'>Failed to load profile</div>
          <p class='text-gray-400 mb-6 text-center'>User not found or an error occurred.</p>
          <button id='back-home-view-profile' class='w-full px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded focus:outline-none focus:ring-4 focus:ring-gray-400'>Back to Friends</button>
        </div>
      `;
      
      document.getElementById('back-home-view-profile')?.addEventListener('click', () => {
        window.location.hash = 'friends';
      });
    }
  }
}

function render(route: string) {
  const lang = LanguageManager.getLang();
  const t = translations[lang];
  const app = document.getElementById('app');
  if (!app) return;
  let content = '';
  // Fix: ensure route is parsed correctly from hash
  if (!route && window.location.hash) {
    route = window.location.hash.replace('#', '');
  }
  if (routes[route]) {
    content = routes[route];
  } else if (route.startsWith('profile/')) {
    // Handle viewing other user's profile
    const username = route.split('/')[1];
    content = generateViewProfilePage(username);
  } else if (route === 'multiplayer') {
    content = `<h2 class='text-2xl font-bold mb-4' tabindex='0' aria-label='${t.multiplayerTitle}'>${t.multiplayerTitle}</h2><p>${t.multiplayerDesc}</p>`;
  } else if (route === 'options') {
    content = `<h2 class='text-2xl font-bold mb-4' tabindex='0' aria-label='${t.optionsTitle}'>${t.optionsTitle}</h2><p>${t.optionsDesc}</p>`;
  } else if (route === 'leaderboard') {
    content = `<h2 class='text-2xl font-bold mb-4' tabindex='0' aria-label='${t.leaderboardTitle}'>${t.leaderboardTitle}</h2>
      <div id='leaderboard-content' class='mt-6 w-full max-w-6xl mx-auto'>
        <div class='text-center py-8'>
          <div class='inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white'></div>
          <p class='mt-2 text-gray-400'>Loading leaderboards...</p>
        </div>
      </div>`;
  } else {
    content = `<h1 class='text-4xl font-bold mb-4' tabindex='0' aria-label='${t.title}'>${t.title}</h1>
      <div class='flex flex-col items-center justify-center space-y-4 mt-8'>
        <button class='w-48 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded focus:outline-none focus:ring-4 focus:ring-green-400' id='start-game' aria-label='${t.startGame}' tabindex='0'>${t.startGame}</button>
        <button class='w-48 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded focus:outline-none focus:ring-4 focus:ring-yellow-400' id='multiplayer' aria-label='${t.multiplayer}' tabindex='0'>${t.multiplayer}</button>
        <button class='w-48 px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded focus:outline-none focus:ring-4 focus:ring-gray-400' id='options' aria-label='${t.options}' tabindex='0'>${t.options}</button>
        <button class='w-48 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded focus:outline-none focus:ring-4 focus:ring-purple-400' id='leaderboard' aria-label='${t.leaderboard}' tabindex='0'>${t.leaderboard}</button>
      </div>`;
  }
  let topRightUI = '';
  if (loggedInUser) {
    // Show avatar if available, else fallback to SVG icon
    let avatarImg = '';
    if (loggedInUserAvatar) {
      let avatarUrl = loggedInUserAvatar;
      if (avatarUrl.startsWith('/uploads') || avatarUrl.startsWith('/static')) {
        avatarUrl = API_BASE + avatarUrl;
      }
      // Add cache-busting for uploaded avatars only
      if (avatarUrl.includes('/uploads/')) {
        const cacheBuster = StorageService.getAvatarCacheBuster();
        avatarUrl += (avatarUrl.includes('?') ? '&' : '?') + 'v=' + cacheBuster;
      }
      avatarImg = `<img src='${avatarUrl}' alt='' class='inline-block w-8 h-8 rounded-full mr-2 border border-gray-600 bg-gray-700 object-cover' style='vertical-align:middle;' onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-block';" /><span class='inline-block w-8 h-8 rounded-full mr-2 bg-gray-700 border border-gray-600 flex items-center justify-center' style='vertical-align:middle; display:none;'><svg width='24' height='24' fill='none' viewBox='0 0 24 24'><circle cx='12' cy='8' r='4' fill='#bbb'/><ellipse cx='12' cy='18' rx='7' ry='4' fill='#bbb'/></svg></span>`;
    } else {
      // Show SVG icon only when no avatar URL is available
      avatarImg = `<span class='inline-block w-8 h-8 rounded-full mr-2 bg-gray-700 border border-gray-600 flex items-center justify-center' style='vertical-align:middle;'><svg width='24' height='24' fill='none' viewBox='0 0 24 24'><circle cx='12' cy='8' r='4' fill='#bbb'/><ellipse cx='12' cy='18' rx='7' ry='4' fill='#bbb'/></svg></span>`;
    }
    topRightUI = `<div class='fixed top-4 right-4 z-50 flex items-center space-x-2'>
      <button id='friends-btn' class='px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded border border-purple-500 focus:outline-none focus:ring-4 focus:ring-purple-400 flex items-center space-x-2' aria-label='Friends'>
        <div class='flex items-center space-x-1'>
          <img src='/public/static/icons/friends_online.svg' alt='Friends' class='w-6 h-6' />
          <span id='friends-online-count'>${currentOnlineFriendsCount}</span>
        </div>
        <div class='flex items-center space-x-1'>
          <img src='/public/static/icons/notification.svg' alt='Notifications' class='w-6 h-6' />
          <span id='pending-requests-count'>${currentPendingRequestsCount}</span>
        </div>
      </button>
      <div class='relative'>
        <button id='user-dropdown-btn' class='px-4 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:outline-none focus:ring-4 focus:ring-yellow-400 flex items-center' aria-haspopup='true' aria-expanded='false' aria-controls='user-dropdown-menu'>${avatarImg}<span>${loggedInUser}</span></button>
        <div id='user-dropdown-menu' class='absolute right-0 top-full mt-1 w-40 bg-gray-900 border border-gray-700 rounded shadow-lg hidden' role='menu' aria-label='User menu'>
          <button id='dropdown-my-profile' class='block w-full text-left px-4 py-2 hover:bg-gray-800 text-white rounded focus:outline-none' role='menuitem'>My Profile</button>
          <button id='dropdown-logout' class='block w-full text-left px-4 py-2 hover:bg-gray-800 text-white rounded focus:outline-none' role='menuitem'>Logout</button>
        </div>
      </div>
    </div>`;
  } else {
    topRightUI = `<div class='fixed top-4 right-4 z-50 flex space-x-2'>
      <button class='px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded focus:outline-none focus:ring-4 focus:ring-blue-400' aria-label='${t.login}' tabindex='0' id='login-btn'>${t.login}</button>
      <button class='px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded focus:outline-none focus:ring-4 focus:ring-green-400' aria-label='Register' tabindex='0' id='register-btn'>Register</button>
    </div>`;
  }
  app.innerHTML = LanguageManager.langSwitcherUI(lang) + accessibilityTogglesUI() + topRightUI + content;
  attachMenuListeners();
  attachLangListener();
  attachAccessibilityListeners();
  attachLoginListeners();
  attachUserDropdownListeners();
  attachPongListeners();
  
  // Update friends count after rendering to restore correct values
  if (loggedInUser) {
    setTimeout(() => updateFriendsCount(), 100);
  }
  
  // Always check for page-specific listeners after rendering
  attachPageSpecificListeners(route);
}

// Track which page-specific listeners are already attached
let attachedListeners = new Set<string>();

function attachPageSpecificListeners(route: string) {
  // Attach page-specific listeners based on current route
  if (route === 'edit-profile' && !attachedListeners.has('edit-profile')) {
    attachedListeners.add('edit-profile');
    setTimeout(() => ProfileManager.attachEditProfilePageListeners(), 0);
  }
  if (route === 'profile' && !attachedListeners.has('profile')) {
    attachedListeners.add('profile');
    setTimeout(() => ProfileManager.attachProfilePageListeners(), 0);
  }
  if (route.startsWith('profile/') && !attachedListeners.has(`view-${route}`)) {
    attachedListeners.add(`view-${route}`);
    const username = route.split('/')[1];
    setTimeout(() => loadUserProfile(username), 0);
  }
  if (route === 'leaderboard' && !attachedListeners.has('leaderboard')) {
    attachedListeners.add('leaderboard');
    setTimeout(() => loadLeaderboards(), 0);
  }
  if (route === 'options' && !attachedListeners.has('options')) {
    attachedListeners.add('options');
    setTimeout(() => initializeOptionsPage(), 0);
  }
  if (route === 'friends' && !attachedListeners.has('friends')) {
    attachedListeners.add('friends');
    setTimeout(() => initializeFriendsPage(), 0);
  }
}

function clearPageSpecificListeners() {
  attachedListeners.clear();
}

function attachMenuListeners() {
  document.getElementById('start-game')?.addEventListener('click', () => {
    window.location.hash = '#pong';
  });
  document.getElementById('multiplayer')?.addEventListener('click', () => {
    window.location.hash = '#multiplayer';
  });
  document.getElementById('options')?.addEventListener('click', () => {
    window.location.hash = '#options';
  });
  document.getElementById('leaderboard')?.addEventListener('click', () => {
    window.location.hash = '#leaderboard';
  });
  document.getElementById('friends-btn')?.addEventListener('click', () => {
    window.location.hash = '#friends';
  });
  document.getElementById('login-btn')?.addEventListener('click', () => {
    window.location.hash = '#login';
  });
  document.getElementById('register-btn')?.addEventListener('click', () => {
    window.location.hash = '#register';
  });
  document.getElementById('edit-profile-btn')?.addEventListener('click', () => {
    window.location.hash = '#edit-profile';
  });
}

function attachLangListener() {
  LanguageManager.attachLangListener(() => render(window.location.hash.replace('#', '')));
}

function attachAccessibilityListeners() {
  document.getElementById('toggle-contrast')?.addEventListener('click', () => {
    document.body.classList.toggle('high-contrast');
  });
  document.getElementById('toggle-textsize')?.addEventListener('click', () => {
    document.body.classList.toggle('text-large');
  });
}

function attachLoginListeners() {
  document.getElementById('back-home-login')?.addEventListener('click', () => {
    window.location.hash = '';
  });
  const loginForm = document.getElementById('login-form') as HTMLFormElement | null;
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = (document.getElementById('login-username') as HTMLInputElement).value.trim();
      const password = (document.getElementById('login-password') as HTMLInputElement).value;
      const errorDiv = document.getElementById('login-error');
      if (!username || !password) {
        if (errorDiv) {
          errorDiv.textContent = 'Username and password required.';
          errorDiv.classList.remove('hidden');
        }
        return;
      }
      if (errorDiv) errorDiv.classList.add('hidden');
      try {
        const response = await fetch(`${API_BASE}/api/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        if (!response.ok) {
          if (errorDiv) {
            errorDiv.textContent = data.error || 'Authentication failed.';
            errorDiv.classList.remove('hidden');
          }
          return;
        }
        setLoggedInUser(data.user.username);
        alert('Logged in as ' + loggedInUser);
        window.location.hash = '';
        render('');
      } catch (err) {
        if (errorDiv) {
          errorDiv.textContent = 'Network error.';
          errorDiv.classList.remove('hidden');
        }
      }
    });
  }
  document.getElementById('back-home-register')?.addEventListener('click', () => {
    window.location.hash = '';
  });
  const registerForm = document.getElementById('register-form') as HTMLFormElement | null;
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = (document.getElementById('register-username') as HTMLInputElement).value.trim();
      const email = (document.getElementById('register-email') as HTMLInputElement).value.trim();
      const password = (document.getElementById('register-password') as HTMLInputElement).value;
      const errorDiv = document.getElementById('register-error');
      if (!username || !email || !password) {
        if (errorDiv) {
          errorDiv.textContent = 'Username, email and password required.';
          errorDiv.classList.remove('hidden');
        }
        return;
      }
      if (errorDiv) errorDiv.classList.add('hidden');
      try {
        const response = await fetch(`${API_BASE}/api/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email, password })
        });
        const data = await response.json();
        if (!response.ok) {
          if (errorDiv) {
            errorDiv.textContent = data.message || 'Registration failed.';
            errorDiv.classList.remove('hidden');
          }
          return;
        }
        alert('Registered as ' + username);
        window.location.hash = '';
      } catch (err) {
        if (errorDiv) {
          errorDiv.textContent = 'Network error.';
          errorDiv.classList.remove('hidden');
        }
      }
    });
  }
}

function attachUserDropdownListeners() {
  const btn = document.getElementById('user-dropdown-btn');
  const menu = document.getElementById('user-dropdown-menu');
  if (!btn || !menu) return;
  let open = false;
  function openMenu() {
    if (!btn || !menu) return;
    menu.classList.remove('hidden');
    btn.setAttribute('aria-expanded', 'true');
    menu.querySelector('button')?.focus();
    open = true;
  }
  function closeMenu() {
    if (!btn || !menu) return;
    menu.classList.add('hidden');
    btn.setAttribute('aria-expanded', 'false');
    open = false;
  }
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (open) {
      closeMenu();
    } else {
      openMenu();
    }
  });
  btn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openMenu();
    }
    if (e.key === 'Escape') closeMenu();
  });
  menu.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeMenu();
      btn?.focus();
    }
  });
  document.addEventListener('click', (e) => {
    if (open && !menu?.contains(e.target as Node) && e.target !== btn) {
      closeMenu();
    }
  });
  document.getElementById('dropdown-my-profile')?.addEventListener('click', () => {
    closeMenu();
    window.location.hash = '#profile';
  });
  document.getElementById('dropdown-logout')?.addEventListener('click', () => {
    closeMenu();
    setLoggedInUser(null);
    window.location.hash = '';
    render('');
  });
}

// Function to create leaderboard table HTML
function createLeaderboardTable(title: string, data: any[], emptyMessage: string) {
  const rows = data.length > 0 
    ? data.map(item => `
        <tr class='hover:bg-gray-700 transition-colors'>
          <td class='px-4 py-3 text-yellow-400 font-semibold'>#${item.rank}</td>
          <td class='px-4 py-3'>${item.displayName}</td>
          <td class='px-4 py-3 text-green-400 font-semibold'>${item.wins}</td>
        </tr>
      `).join('')
    : `<tr><td colspan='3' class='px-4 py-6 text-center text-gray-400'>${emptyMessage}</td></tr>`;

  return `
    <div class='bg-gray-800 rounded-lg overflow-hidden'>
      <h3 class='text-xl font-semibold p-4 bg-gray-700 text-center'>${title}</h3>
      <table class='w-full text-left'>
        <thead class='bg-gray-600'>
          <tr>
            <th class='px-4 py-3 text-yellow-400'>Rank</th>
            <th class='px-4 py-3'>Player</th>
            <th class='px-4 py-3 text-green-400'>Wins</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}

// Function to load and display leaderboards
async function loadLeaderboards() {
  const contentDiv = document.getElementById('leaderboard-content');
  if (!contentDiv) return;

  try {
    // Fetch all three leaderboards in parallel
    const [botWinsRes, playerWinsRes, tournamentWinsRes] = await Promise.all([
      fetch(`${API_BASE}/stats/leaderboard/bot-wins`),
      fetch(`${API_BASE}/stats/leaderboard/player-wins`),
      fetch(`${API_BASE}/stats/leaderboard/tournament-wins`)
    ]);

    const [botWinsData, playerWinsData, tournamentWinsData] = await Promise.all([
      botWinsRes.json(),
      playerWinsRes.json(),
      tournamentWinsRes.json()
    ]);

    // Create the three-column layout
    const leaderboardHtml = `
      <div class='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        ${createLeaderboardTable('🤖 Bot Wins', botWinsData, 'No bot matches played yet')}
        ${createLeaderboardTable('👥 Player Wins', playerWinsData, 'No player matches played yet')}
        ${createLeaderboardTable('🏆 Tournament Wins', tournamentWinsData, 'No tournaments won yet')}
      </div>
    `;

    contentDiv.innerHTML = leaderboardHtml;
  } catch (error) {
    console.error('Failed to load leaderboards:', error);
    contentDiv.innerHTML = `
      <div class='text-center py-8'>
        <p class='text-red-400 mb-2'>Failed to load leaderboards</p>
        <button onclick='window.loadLeaderboards()' class='px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-purple-400'>
          Try Again
        </button>
      </div>
    `;
  }
}

// Make loadLeaderboards available globally
(window as any).loadLeaderboards = loadLeaderboards;

function attachPongListeners() {
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
      startBtn.disabled = true;
      startBtn.textContent = 'Game Running...';
      PongEngine.startGame(canvas, statusDiv);
    });
  }
}

window.addEventListener('hashchange', () => {
  const newRoute = window.location.hash.replace('#', '');
  clearPageSpecificListeners(); // Clear previous listeners
  render(newRoute);
  // Note: attachPageSpecificListeners is now called within render(), so no need to duplicate here
});

// Cleanup heartbeat on page unload
window.addEventListener('beforeunload', () => {
  HeartbeatService.stop();
});

// Setup heartbeat callback for updateFriendsCount
HeartbeatService.setUpdateFriendsCallback(() => updateFriendsCount());

// Start heartbeat if user is already logged in
if (loggedInUser) {
  HeartbeatService.start(loggedInUser);
  // Update friends count after a short delay to ensure UI is loaded
  setTimeout(() => updateFriendsCount(), 1500);
}

// Initial render
render(window.location.hash.replace('#', ''));
