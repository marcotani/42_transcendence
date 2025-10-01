// User Session Management - Handles user authentication state and session management
import { API_BASE } from '../config/constants.js';
import { StorageService } from './storage.js';
import { HeartbeatService } from './heartbeat.js';
import { Router } from '../routing/router.js';
import { FriendsManager } from '../features/friends-manager.js';

export class UserSession {
  private static loggedInUser: string | null = StorageService.getLoggedInUser();
  private static loggedInUserAvatar: string | null = StorageService.getLoggedInUserAvatar();
  private static currentOnlineFriendsCount: number = StorageService.getCurrentOnlineFriendsCount();
  private static currentPendingRequestsCount: number = StorageService.getCurrentPendingRequestsCount();
  private static renderCallback: ((route: string) => void) | null = null;

  /**
   * Initialize user session with render callback
   */
  static initialize(renderCallback: (route: string) => void) {
    UserSession.renderCallback = renderCallback;
    // Expose current user on window for other modules
    (window as any).loggedInUser = UserSession.loggedInUser;
    // Expose setLoggedInUser on window for other modules
    (window as any).setLoggedInUser = UserSession.setLoggedInUser;
  }

  /**
   * Get current logged in user
   */
  static getCurrentUser(): string | null {
    return UserSession.loggedInUser;
  }

  /**
   * Get current user avatar
   */
  static getCurrentUserAvatar(): string | null {
    return UserSession.loggedInUserAvatar;
  }

  /**
   * Get current online friends count
   */
  static getCurrentOnlineFriendsCount(): number {
    return UserSession.currentOnlineFriendsCount;
  }

  /**
   * Get current pending requests count
   */
  static getCurrentPendingRequestsCount(): number {
    return UserSession.currentPendingRequestsCount;
  }

  /**
   * Set logged in user and handle session state
   */
  static setLoggedInUser(username: string | null, newAvatarUrl?: string, skipRender: boolean = false) {
    UserSession.loggedInUser = username;
    (window as any).loggedInUser = username; // Keep window in sync
    
    if (username) {
      StorageService.setLoggedInUser(username);
      
      // Start heartbeat for logged-in user
      HeartbeatService.start(username);
      
      // Update friends count
      setTimeout(() => FriendsManager.updateFriendsCount(), 1000);
      
      // If a new avatar URL is explicitly provided, use it immediately
      if (newAvatarUrl !== undefined) {
        UserSession.loggedInUserAvatar = newAvatarUrl;
        StorageService.setLoggedInUserAvatar(newAvatarUrl);
        // Update cache buster for immediate avatar refresh
        if (newAvatarUrl && newAvatarUrl.includes('/uploads/')) {
          StorageService.setAvatarCacheBuster();
        }
        // Re-render to update avatar immediately (unless skipRender is true)
        if (!skipRender && UserSession.renderCallback) {
          UserSession.renderCallback(window.location.hash.replace('#', ''));
        }
        return;
      }
      
      // Fetch avatar URL for the user with cache-busting
      UserSession.fetchUserAvatar(username);
    } else {
      // Stop heartbeat when logging out
      HeartbeatService.stop();
      StorageService.clearUserData();
      UserSession.loggedInUserAvatar = null;
      UserSession.currentOnlineFriendsCount = 0;
      UserSession.currentPendingRequestsCount = 0;
    }
  }

  /**
   * Fetch user avatar from API
   */
  private static async fetchUserAvatar(username: string) {
    try {
      const cacheBuster = Date.now();
      const response = await fetch(`${API_BASE}/users/${username}?_t=${cacheBuster}`);
      const user = await response.json();
      
      const avatarUrl = user.profile?.avatarUrl || null;
      UserSession.loggedInUserAvatar = avatarUrl;
      StorageService.setLoggedInUserAvatar(avatarUrl);
      
      // Re-render to update avatar if needed
      if (UserSession.renderCallback) {
        UserSession.renderCallback(window.location.hash.replace('#', ''));
      }
    } catch (error) {
      console.error('Error fetching user avatar:', error);
      UserSession.loggedInUserAvatar = null;
      StorageService.setLoggedInUserAvatar(null);
      
      if (UserSession.renderCallback) {
        UserSession.renderCallback(window.location.hash.replace('#', ''));
      }
    }
  }

  /**
   * Update friends counts
   */
  static updateFriendsCount(onlineCount: number, pendingCount: number) {
    UserSession.currentOnlineFriendsCount = onlineCount;
    UserSession.currentPendingRequestsCount = pendingCount;
  }
}