var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { API_BASE } from './config/constants.js';
import { showStatus } from './utils/dom-helpers.js';
import { GameSettingsService } from './services/game-settings.js';
import { StorageService } from './services/storage.js';
import { HeartbeatService } from './services/heartbeat.js';
import { MatchHistoryManager } from './features/match-history.js';
import { LanguageManager } from './features/language.js';
import { PongEngine } from './game/pong-engine.js';
import { Router } from './routing/router.js';
let loggedInUser = StorageService.getLoggedInUser();
// Store avatar URL for logged-in user
let loggedInUserAvatar = StorageService.getLoggedInUserAvatar();
// Expose on window for other modules
window.loggedInUser = loggedInUser;
// Store current friends counts to avoid flashing 0s during page navigation
let currentOnlineFriendsCount = StorageService.getCurrentOnlineFriendsCount();
let currentPendingRequestsCount = StorageService.getCurrentPendingRequestsCount();
export function setLoggedInUser(username, newAvatarUrl, skipRender = false) {
    loggedInUser = username;
    window.loggedInUser = username; // Keep window in sync
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
            var _a;
            const avatarUrl = ((_a = user.profile) === null || _a === void 0 ? void 0 : _a.avatarUrl) || null;
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
    }
    else {
        // Stop heartbeat when logging out
        HeartbeatService.stop();
        StorageService.clearUserData();
        loggedInUserAvatar = null;
        currentOnlineFriendsCount = 0;
        currentPendingRequestsCount = 0;
    }
}
// Expose setLoggedInUser on window for other modules
window.setLoggedInUser = setLoggedInUser;
function initializeOptionsPage() {
    const settings = GameSettingsService.load();
    const ballSpeedSlider = document.getElementById('ball-speed');
    const ballSpeedValue = document.getElementById('ball-speed-value');
    const paddleSpeedSlider = document.getElementById('paddle-speed');
    const paddleSpeedValue = document.getElementById('paddle-speed-value');
    const pointsSelect = document.getElementById('points-to-win');
    const saveButton = document.getElementById('save-options');
    const saveStatus = document.getElementById('save-status');
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
            const newSettings = {
                ballSpeed: parseInt((ballSpeedSlider === null || ballSpeedSlider === void 0 ? void 0 : ballSpeedSlider.value) || '3'),
                paddleSpeed: parseInt((paddleSpeedSlider === null || paddleSpeedSlider === void 0 ? void 0 : paddleSpeedSlider.value) || '5'),
                pointsToWin: parseInt((pointsSelect === null || pointsSelect === void 0 ? void 0 : pointsSelect.value) || '11')
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
function initializeFriendsPage() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!loggedInUser)
            return;
        // Load initial data
        loadPendingRequests();
        loadFriendsList();
        updateFriendsCount();
        // Set up form listeners
        const sendRequestForm = document.getElementById('send-friend-request-form');
        const backButton = document.getElementById('back-home-friends');
        if (sendRequestForm) {
            sendRequestForm.addEventListener('submit', handleSendFriendRequest);
        }
        if (backButton) {
            backButton.addEventListener('click', () => {
                window.location.hash = '';
            });
        }
    });
}
function handleSendFriendRequest(e) {
    return __awaiter(this, void 0, void 0, function* () {
        e.preventDefault();
        if (!loggedInUser)
            return;
        const form = e.target;
        const usernameInput = document.getElementById('friend-username');
        const statusDiv = document.getElementById('send-request-status');
        const toUsername = usernameInput.value.trim();
        if (!toUsername) {
            showStatus(statusDiv, 'Please enter a username', 'error');
            return;
        }
        try {
            // Get current user's password (we'll need a simpler auth method in the future)
            const password = prompt('Enter your password to send friend request:');
            if (!password)
                return;
            const response = yield fetch(`${API_BASE}/friends/requests`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fromUsername: loggedInUser,
                    currentPassword: password,
                    toUsername: toUsername
                })
            });
            const result = yield response.json();
            if (response.ok) {
                showStatus(statusDiv, 'Friend request sent successfully!', 'success');
                usernameInput.value = '';
                loadPendingRequests(); // Refresh pending requests
            }
            else {
                showStatus(statusDiv, result.error || 'Failed to send friend request', 'error');
            }
        }
        catch (error) {
            showStatus(statusDiv, 'Error sending friend request', 'error');
            console.error('Error:', error);
        }
    });
}
function loadPendingRequests() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!loggedInUser)
            return;
        const container = document.getElementById('pending-requests');
        if (!container)
            return;
        try {
            const response = yield fetch(`${API_BASE}/friends/requests?for=${loggedInUser}`);
            const data = yield response.json();
            if (response.ok) {
                const { incoming, outgoing } = data;
                let html = '';
                if (incoming.length === 0 && outgoing.length === 0) {
                    html = '<p class="text-gray-400 text-center">No pending requests</p>';
                }
                else {
                    if (incoming.length > 0) {
                        html += '<h4 class="font-semibold mb-2">Incoming Requests</h4>';
                        incoming.forEach((req) => {
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
                        outgoing.forEach((req) => {
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
        }
        catch (error) {
            console.error('Error loading pending requests:', error);
            container.innerHTML = '<p class="text-red-400 text-center">Error loading requests</p>';
        }
    });
}
function loadFriendsList() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!loggedInUser)
            return;
        const container = document.getElementById('friends-list');
        if (!container)
            return;
        try {
            const response = yield fetch(`${API_BASE}/friends/${loggedInUser}`);
            const data = yield response.json();
            if (response.ok) {
                const { friends } = data;
                let html = '';
                if (friends.length === 0) {
                    html = '<p class="text-gray-400 text-center">No friends yet</p>';
                }
                else {
                    // Sort friends to prioritize online users first
                    const sortedFriends = friends.sort((a, b) => {
                        const isAOnline = a.online === 'online' && a.heartbeat &&
                            new Date(a.heartbeat) > new Date(Date.now() - 2 * 60 * 1000);
                        const isBOnline = b.online === 'online' && b.heartbeat &&
                            new Date(b.heartbeat) > new Date(Date.now() - 2 * 60 * 1000);
                        // Online friends first, then offline friends
                        if (isAOnline && !isBOnline)
                            return -1;
                        if (!isAOnline && isBOnline)
                            return 1;
                        // If both have same online status, sort alphabetically by username
                        return a.username.localeCompare(b.username);
                    });
                    sortedFriends.forEach((friend) => {
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
        }
        catch (error) {
            console.error('Error loading friends list:', error);
            container.innerHTML = '<p class="text-red-400 text-center">Error loading friends</p>';
        }
    });
}
function acceptFriendRequest(requestId) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!loggedInUser)
            return;
        try {
            const password = prompt('Enter your password to accept friend request:');
            if (!password)
                return;
            const response = yield fetch(`${API_BASE}/friends/requests/${requestId}/accept`, {
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
            }
            else {
                const error = yield response.json();
                alert(error.error || 'Failed to accept friend request');
            }
        }
        catch (error) {
            console.error('Error accepting friend request:', error);
            alert('Error accepting friend request');
        }
    });
}
function rejectFriendRequest(requestId) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!loggedInUser)
            return;
        const confirmed = confirm('Are you sure you want to reject this friend request?');
        if (!confirmed)
            return;
        try {
            const password = prompt('Enter your password to reject friend request:');
            if (!password)
                return;
            const response = yield fetch(`${API_BASE}/friends/requests/${requestId}`, {
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
            }
            else {
                const error = yield response.json();
                alert(error.error || 'Failed to reject friend request');
            }
        }
        catch (error) {
            console.error('Error rejecting friend request:', error);
            alert('Error rejecting friend request');
        }
    });
}
function cancelFriendRequest(requestId) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!loggedInUser)
            return;
        const confirmed = confirm('Are you sure you want to cancel this friend request?');
        if (!confirmed)
            return;
        try {
            const password = prompt('Enter your password to cancel friend request:');
            if (!password)
                return;
            const response = yield fetch(`${API_BASE}/friends/requests/${requestId}`, {
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
            }
            else {
                const error = yield response.json();
                alert(error.error || 'Failed to cancel friend request');
            }
        }
        catch (error) {
            console.error('Error canceling friend request:', error);
            alert('Error canceling friend request');
        }
    });
}
function removeFriend(friendUsername) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!loggedInUser)
            return;
        const confirmed = confirm(`Are you sure you want to remove ${friendUsername} from your friends?`);
        if (!confirmed)
            return;
        try {
            const password = prompt('Enter your password to remove friend:');
            if (!password)
                return;
            const response = yield fetch(`${API_BASE}/friends/${friendUsername}`, {
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
            }
            else {
                const error = yield response.json();
                alert(error.error || 'Failed to remove friend');
            }
        }
        catch (error) {
            console.error('Error removing friend:', error);
            alert('Error removing friend');
        }
    });
}
function viewProfile(username) {
    window.location.hash = `#profile/${username}`;
}
function updateFriendsCount() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!loggedInUser)
            return;
        try {
            // Get pending requests count
            const requestsResponse = yield fetch(`${API_BASE}/friends/requests?for=${loggedInUser}`);
            const requestsData = yield requestsResponse.json();
            // Get friends list with online status
            const friendsResponse = yield fetch(`${API_BASE}/friends/${loggedInUser}`);
            const friendsData = yield friendsResponse.json();
            if (requestsResponse.ok && friendsResponse.ok) {
                const pendingCount = requestsData.incoming.length;
                const friends = friendsData.friends || [];
                // Count online friends (those with recent heartbeat)
                const onlineFriendsCount = friends.filter((friend) => {
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
                    }
                    else {
                        friendsBtn.className = friendsBtn.className.replace('bg-orange-600 hover:bg-orange-700', 'bg-purple-600 hover:bg-purple-700');
                    }
                }
            }
        }
        catch (error) {
            console.error('Error updating friends count:', error);
        }
    });
}
// Make functions globally available for onclick handlers
window.acceptFriendRequest = acceptFriendRequest;
window.rejectFriendRequest = rejectFriendRequest;
window.cancelFriendRequest = cancelFriendRequest;
window.removeFriend = removeFriend;
window.viewProfile = viewProfile;
function generateViewProfilePage(username) {
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
function loadUserProfile(username) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
        try {
            // Fetch user profile, stats, and match history
            const [userResponse, statsResponse, matchHistoryResponse] = yield Promise.all([
                fetch(`${API_BASE}/users/${username}`),
                fetch(`${API_BASE}/stats/${username}`),
                fetch(`${API_BASE}/matches/history/${username}`)
            ]);
            if (!userResponse.ok) {
                throw new Error('User not found');
            }
            const userData = yield userResponse.json();
            const statsData = statsResponse.ok ? yield statsResponse.json() : null;
            const matchHistoryData = matchHistoryResponse.ok ? yield matchHistoryResponse.json() : null;
            // Update the profile page content
            const container = document.getElementById('view-profile-page');
            if (container) {
                // Avatar HTML - matching the exact format from "my profile"
                let avatarUrl = ((_a = userData.profile) === null || _a === void 0 ? void 0 : _a.avatarUrl) || '';
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
                  <div class='text-2xl font-bold'>${(_b = statsData.botWins) !== null && _b !== void 0 ? _b : 0}</div>
                  <div class='text-gray-400 text-sm'>Wins</div>
                </div>
                <div class='text-center'>
                  <div class='text-2xl font-bold'>${(_c = statsData.botLosses) !== null && _c !== void 0 ? _c : 0}</div>
                  <div class='text-gray-400 text-sm'>Losses</div>
                </div>
              </div>
            </div>
            <div class='bg-gray-800 rounded-lg p-4 flex flex-col items-center'>
              <div class='text-lg font-semibold text-blue-400'>Player</div>
              <div class='flex space-x-4 mt-2'>
                <div class='text-center'>
                  <div class='text-2xl font-bold'>${(_d = statsData.playerWins) !== null && _d !== void 0 ? _d : 0}</div>
                  <div class='text-gray-400 text-sm'>Wins</div>
                </div>
                <div class='text-center'>
                  <div class='text-2xl font-bold'>${(_e = statsData.playerLosses) !== null && _e !== void 0 ? _e : 0}</div>
                  <div class='text-gray-400 text-sm'>Losses</div>
                </div>
              </div>
            </div>
          </div>
          <div class='bg-gray-800 rounded-lg p-4 flex flex-col items-center'>
            <div class='text-lg font-semibold text-yellow-400'>Tournament Wins</div>
            <div class='text-3xl font-bold mt-2'>${(_f = statsData.tournamentWins) !== null && _f !== void 0 ? _f : 0}</div>
          </div>
        </div>
      ` : '';
                // Match History HTML
                const matchHistoryHtml = matchHistoryData ? MatchHistoryManager.generateMatchHistoryHtml(matchHistoryData.matches || [], username) : '';
                container.innerHTML = `
        <div class='flex flex-col items-center'>
          <div class='mb-4'>${avatarHtml}</div>
          <div class='text-2xl font-bold mb-2'>${((_g = userData.profile) === null || _g === void 0 ? void 0 : _g.alias) || userData.username}</div>
          <div class='text-gray-400 mb-2'>@${userData.username}</div>
          ${((_h = userData.profile) === null || _h === void 0 ? void 0 : _h.emailVisible) && userData.email && userData.email !== '*************' ? `<div class='text-gray-400 mb-4'>${userData.email}</div>` : ''}
          ${((_j = userData.profile) === null || _j === void 0 ? void 0 : _j.bio) ? `<div class='text-base text-white mb-6'>${userData.profile.bio}</div>` : ''}
          ${statsHtml}
          ${matchHistoryHtml}
          <button id='back-home-view-profile' class='mt-2 w-full px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded focus:outline-none focus:ring-4 focus:ring-gray-400'>Back to Friends</button>
        </div>
      `;
                // Attach back button listener to go to friends page
                (_k = document.getElementById('back-home-view-profile')) === null || _k === void 0 ? void 0 : _k.addEventListener('click', () => {
                    window.location.hash = 'friends';
                });
            }
        }
        catch (error) {
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
                (_l = document.getElementById('back-home-view-profile')) === null || _l === void 0 ? void 0 : _l.addEventListener('click', () => {
                    window.location.hash = 'friends';
                });
            }
        }
    });
}
function render(route) {
    Router.render(route, loggedInUser, loggedInUserAvatar, currentOnlineFriendsCount, currentPendingRequestsCount, generateViewProfilePage);
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
function attachPageSpecificListeners(route) {
    Router.attachPageSpecificListeners(route, loadUserProfile, loadLeaderboards, initializeOptionsPage, initializeFriendsPage);
}
function clearPageSpecificListeners() {
    Router.clearPageSpecificListeners();
}
function attachMenuListeners() {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    (_a = document.getElementById('start-game')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', () => {
        window.location.hash = '#pong';
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
    (_e = document.getElementById('friends-btn')) === null || _e === void 0 ? void 0 : _e.addEventListener('click', () => {
        window.location.hash = '#friends';
    });
    (_f = document.getElementById('login-btn')) === null || _f === void 0 ? void 0 : _f.addEventListener('click', () => {
        window.location.hash = '#login';
    });
    (_g = document.getElementById('register-btn')) === null || _g === void 0 ? void 0 : _g.addEventListener('click', () => {
        window.location.hash = '#register';
    });
    (_h = document.getElementById('edit-profile-btn')) === null || _h === void 0 ? void 0 : _h.addEventListener('click', () => {
        window.location.hash = '#edit-profile';
    });
}
function attachLangListener() {
    LanguageManager.attachLangListener(() => render(window.location.hash.replace('#', '')));
}
function attachAccessibilityListeners() {
    var _a, _b;
    (_a = document.getElementById('toggle-contrast')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', () => {
        document.body.classList.toggle('high-contrast');
    });
    (_b = document.getElementById('toggle-textsize')) === null || _b === void 0 ? void 0 : _b.addEventListener('click', () => {
        document.body.classList.toggle('text-large');
    });
}
function attachLoginListeners() {
    var _a, _b;
    (_a = document.getElementById('back-home-login')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', () => {
        window.location.hash = '';
    });
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => __awaiter(this, void 0, void 0, function* () {
            e.preventDefault();
            const username = document.getElementById('login-username').value.trim();
            const password = document.getElementById('login-password').value;
            const errorDiv = document.getElementById('login-error');
            if (!username || !password) {
                if (errorDiv) {
                    errorDiv.textContent = 'Username and password required.';
                    errorDiv.classList.remove('hidden');
                }
                return;
            }
            if (errorDiv)
                errorDiv.classList.add('hidden');
            try {
                const response = yield fetch(`${API_BASE}/api/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                const data = yield response.json();
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
            }
            catch (err) {
                if (errorDiv) {
                    errorDiv.textContent = 'Network error.';
                    errorDiv.classList.remove('hidden');
                }
            }
        }));
    }
    (_b = document.getElementById('back-home-register')) === null || _b === void 0 ? void 0 : _b.addEventListener('click', () => {
        window.location.hash = '';
    });
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => __awaiter(this, void 0, void 0, function* () {
            e.preventDefault();
            const username = document.getElementById('register-username').value.trim();
            const email = document.getElementById('register-email').value.trim();
            const password = document.getElementById('register-password').value;
            const errorDiv = document.getElementById('register-error');
            if (!username || !email || !password) {
                if (errorDiv) {
                    errorDiv.textContent = 'Username, email and password required.';
                    errorDiv.classList.remove('hidden');
                }
                return;
            }
            if (errorDiv)
                errorDiv.classList.add('hidden');
            try {
                const response = yield fetch(`${API_BASE}/api/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password })
                });
                const data = yield response.json();
                if (!response.ok) {
                    if (errorDiv) {
                        errorDiv.textContent = data.message || 'Registration failed.';
                        errorDiv.classList.remove('hidden');
                    }
                    return;
                }
                alert('Registered as ' + username);
                window.location.hash = '';
            }
            catch (err) {
                if (errorDiv) {
                    errorDiv.textContent = 'Network error.';
                    errorDiv.classList.remove('hidden');
                }
            }
        }));
    }
}
function attachUserDropdownListeners() {
    var _a, _b;
    const btn = document.getElementById('user-dropdown-btn');
    const menu = document.getElementById('user-dropdown-menu');
    if (!btn || !menu)
        return;
    let open = false;
    function openMenu() {
        var _a;
        if (!btn || !menu)
            return;
        menu.classList.remove('hidden');
        btn.setAttribute('aria-expanded', 'true');
        (_a = menu.querySelector('button')) === null || _a === void 0 ? void 0 : _a.focus();
        open = true;
    }
    function closeMenu() {
        if (!btn || !menu)
            return;
        menu.classList.add('hidden');
        btn.setAttribute('aria-expanded', 'false');
        open = false;
    }
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (open) {
            closeMenu();
        }
        else {
            openMenu();
        }
    });
    btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openMenu();
        }
        if (e.key === 'Escape')
            closeMenu();
    });
    menu.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeMenu();
            btn === null || btn === void 0 ? void 0 : btn.focus();
        }
    });
    document.addEventListener('click', (e) => {
        if (open && !(menu === null || menu === void 0 ? void 0 : menu.contains(e.target)) && e.target !== btn) {
            closeMenu();
        }
    });
    (_a = document.getElementById('dropdown-my-profile')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', () => {
        closeMenu();
        window.location.hash = '#profile';
    });
    (_b = document.getElementById('dropdown-logout')) === null || _b === void 0 ? void 0 : _b.addEventListener('click', () => {
        closeMenu();
        setLoggedInUser(null);
        window.location.hash = '';
        render('');
    });
}
// Function to create leaderboard table HTML
function createLeaderboardTable(title, data, emptyMessage) {
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
function loadLeaderboards() {
    return __awaiter(this, void 0, void 0, function* () {
        const contentDiv = document.getElementById('leaderboard-content');
        if (!contentDiv)
            return;
        try {
            // Fetch all three leaderboards in parallel
            const [botWinsRes, playerWinsRes, tournamentWinsRes] = yield Promise.all([
                fetch(`${API_BASE}/stats/leaderboard/bot-wins`),
                fetch(`${API_BASE}/stats/leaderboard/player-wins`),
                fetch(`${API_BASE}/stats/leaderboard/tournament-wins`)
            ]);
            const [botWinsData, playerWinsData, tournamentWinsData] = yield Promise.all([
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
        }
        catch (error) {
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
    });
}
// Make loadLeaderboards available globally
window.loadLeaderboards = loadLeaderboards;
function attachPongListeners() {
    var _a, _b;
    (_a = document.getElementById('pong')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', () => {
        window.location.hash = '#pong';
    });
    (_b = document.getElementById('back-home-pong')) === null || _b === void 0 ? void 0 : _b.addEventListener('click', () => {
        window.location.hash = '';
    });
    const startBtn = document.getElementById('pong-start');
    const canvas = document.getElementById('pong-canvas');
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
