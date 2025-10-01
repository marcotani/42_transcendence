// Heartbeat service for tracking online status
import { API_BASE, HEARTBEAT_INTERVAL_MS } from '../config/constants.js';

export class HeartbeatService {
  private static interval: number | null = null;
  private static updateFriendsCallback: (() => void) | null = null;

  static setUpdateFriendsCallback(callback: () => void): void {
    this.updateFriendsCallback = callback;
  }

  private static async sendHeartbeat(loggedInUser: string): Promise<void> {
    if (!loggedInUser) return;
    
    try {
      // First get the user ID
      const userRes = await fetch(`${API_BASE}/users/${loggedInUser}`);
      const user = await userRes.json();
      if (!user || !user.id) return;
      
      // Send heartbeat
      await fetch(`${API_BASE}/api/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      
      // Update friends count to keep the button updated across all pages
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