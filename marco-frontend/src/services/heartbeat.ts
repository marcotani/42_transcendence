// Heartbeat service for tracking online status
import { HEARTBEAT_INTERVAL_MS } from '../config/constants.js';
import { ApiClient } from './api-client.js';

export class HeartbeatService {
  private static interval: number | null = null;
  private static updateFriendsCallback: (() => void) | null = null;

  static setUpdateFriendsCallback(callback: () => void): void {
    this.updateFriendsCallback = callback;
  }

  /**
   * Send heartbeat using ApiClient so the JWT Authorization header is included.
   */
  private static async sendHeartbeat(loggedInUser: string): Promise<void> {
    if (!loggedInUser) return;

    try {
      // Get the user object (public endpoint)
      const userRes = await ApiClient.get(`/users/${loggedInUser}`);
      if (!userRes.success || !userRes.data) return;
      const user = userRes.data as any;
      if (!user || !user.id) return;

      // POST heartbeat using ApiClient so token is attached
      await ApiClient.post('/api/heartbeat', { userId: user.id });

      // Update friends count to keep the UI synced
      if (this.updateFriendsCallback) {
        this.updateFriendsCallback();
      }
    } catch (error) {
      console.error('Failed to send heartbeat:', error);
    }
  }

  static start(loggedInUser: string): void {
    if (this.interval) return; // Already running

    if (loggedInUser) {
      // Send initial heartbeat immediately
      this.sendHeartbeat(loggedInUser);

      // Set up periodic heartbeat
      this.interval = window.setInterval(() => {
        this.sendHeartbeat(loggedInUser);
      }, HEARTBEAT_INTERVAL_MS);
    }
  }

  static stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}