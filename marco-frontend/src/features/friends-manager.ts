// Friends Manager - Handles friends-related functionality
// Starting with incremental extraction approach
import { API_BASE } from '../config/constants.js';
import { StorageService } from '../services/storage.js';
import { showStatus } from '../utils/dom-helpers.js';

export class FriendsManager {
  /**
   * Navigate to user profile page
   */
  static viewProfile(username: string): void {
    window.location.hash = `#profile/${username}`;
  }

  /**
   * Accept a friend request
   */
  static async acceptFriendRequest(requestId: number, refreshCallbacks?: {
    loadPendingRequests?: () => void;
    loadFriendsList?: () => void;
    updateFriendsCount?: () => void;
  }): Promise<void> {
    const loggedInUser = (window as any).loggedInUser;
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
        // Call provided refresh callbacks
        if (refreshCallbacks?.loadPendingRequests) {
          refreshCallbacks.loadPendingRequests();
        }
        if (refreshCallbacks?.loadFriendsList) {
          refreshCallbacks.loadFriendsList();
        }
        if (refreshCallbacks?.updateFriendsCount) {
          refreshCallbacks.updateFriendsCount();
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to accept friend request');
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
      alert('Error accepting friend request');
    }
  }

  /**
   * Reject a friend request
   */
  static async rejectFriendRequest(requestId: number, refreshCallbacks?: {
    loadPendingRequests?: () => void;
    updateFriendsCount?: () => void;
  }): Promise<void> {
    const loggedInUser = (window as any).loggedInUser;
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
        // Call provided refresh callbacks
        if (refreshCallbacks?.loadPendingRequests) {
          refreshCallbacks.loadPendingRequests();
        }
        if (refreshCallbacks?.updateFriendsCount) {
          refreshCallbacks.updateFriendsCount();
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to reject friend request');
      }
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      alert('Error rejecting friend request');
    }
  }

  /**
   * Remove a friend
   */
  static async removeFriend(friendUsername: string, refreshCallbacks?: {
    loadFriendsList?: () => void;
    updateFriendsCount?: () => void;
  }): Promise<void> {
    const loggedInUser = (window as any).loggedInUser;
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
        // Call provided refresh callbacks
        if (refreshCallbacks?.loadFriendsList) {
          refreshCallbacks.loadFriendsList();
        }
        if (refreshCallbacks?.updateFriendsCount) {
          refreshCallbacks.updateFriendsCount();
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to remove friend');
      }
    } catch (error) {
      console.error('Error removing friend:', error);
      alert('Error removing friend');
    }
  }

  /**
   * Update friends count and UI elements
   */
  static async updateFriendsCount(): Promise<void> {
    const loggedInUser = (window as any).loggedInUser;
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
        
        // Store the counts in localStorage and update global variables via window
        StorageService.setCurrentOnlineFriendsCount(onlineFriendsCount);
        StorageService.setCurrentPendingRequestsCount(pendingCount);
        (window as any).currentOnlineFriendsCount = onlineFriendsCount;
        (window as any).currentPendingRequestsCount = pendingCount;
        
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

  /**
   * Handle sending a friend request
   */
  static async handleSendFriendRequest(e: Event, refreshCallback?: () => void): Promise<void> {
    e.preventDefault();
    const loggedInUser = (window as any).loggedInUser;
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
        if (refreshCallback) {
          refreshCallback(); // Refresh pending requests
        }
      } else {
        showStatus(statusDiv, result.error || 'Failed to send friend request', 'error');
      }
    } catch (error) {
      showStatus(statusDiv, 'Error sending friend request', 'error');
      console.error('Error:', error);
    }
  }

  /**
   * Load and display pending friend requests
   */
  static async loadPendingRequests(): Promise<void> {
    const loggedInUser = (window as any).loggedInUser;
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

  /**
   * Load and display friends list
   */
  static async loadFriendsList(): Promise<void> {
    const loggedInUser = (window as any).loggedInUser;
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

  /**
   * Cancel a friend request
   */
  static async cancelFriendRequest(requestId: number, refreshCallbacks?: {
    loadPendingRequests?: () => void;
    updateFriendsCount?: () => void;
  }): Promise<void> {
    const loggedInUser = (window as any).loggedInUser;
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
        // Call provided refresh callbacks
        if (refreshCallbacks?.loadPendingRequests) {
          refreshCallbacks.loadPendingRequests();
        }
        if (refreshCallbacks?.updateFriendsCount) {
          refreshCallbacks.updateFriendsCount();
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to cancel friend request');
      }
    } catch (error) {
      console.error('Error canceling friend request:', error);
      alert('Error canceling friend request');
    }
  }
}