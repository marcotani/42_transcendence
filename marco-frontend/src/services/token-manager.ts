// JWT Token Manager - Handles JWT token storage, validation, and API authorization
export interface TokenData {
  token: string;
  userId: number;
  username: string;
  expiresAt: number;
}

export class TokenManager {
  private static readonly TOKEN_KEY = 'auth_token';

  /**
   * Store JWT token with expiration information
   */
  static storeToken(token: string, userId: number, username: string, expiresInSec: number = 86400): void {
    const tokenData: TokenData = {
      token,
      userId,
      username,
      expiresAt: Date.now() + (expiresInSec * 1000)
    };
    localStorage.setItem(TokenManager.TOKEN_KEY, JSON.stringify(tokenData));
  }

  /**
   * Get stored token data
   */
  static getTokenData(): TokenData | null {
    const stored = localStorage.getItem(TokenManager.TOKEN_KEY);
    if (!stored) return null;

    try {
      const tokenData: TokenData = JSON.parse(stored);
      
      // Check if token is expired
      if (Date.now() >= tokenData.expiresAt) {
        TokenManager.clearToken();
        return null;
      }

      return tokenData;
    } catch (error) {
      console.error('Invalid token data in localStorage:', error);
      TokenManager.clearToken();
      return null;
    }
  }

  /**
   * Get just the token string
   */
  static getToken(): string | null {
    const tokenData = TokenManager.getTokenData();
    return tokenData ? tokenData.token : null;
  }

  /**
   * Check if user is authenticated with valid token
   */
  static isAuthenticated(): boolean {
    return TokenManager.getTokenData() !== null;
  }

  /**
   * Get authorization header for API requests
   */
  static getAuthHeader(): { Authorization: string } | {} {
    const token = TokenManager.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * Clear stored token (logout)
   */
  static clearToken(): void {
    localStorage.removeItem(TokenManager.TOKEN_KEY);
  }

  /**
   * Get time remaining until token expires (in seconds)
   */
  static getTimeToExpiration(): number {
    const tokenData = TokenManager.getTokenData();
    if (!tokenData) return 0;
    
    const remaining = Math.max(0, tokenData.expiresAt - Date.now());
    return Math.floor(remaining / 1000);
  }

  /**
   * Check if token will expire soon (within 2 hours)
   */
  static isTokenExpiringSoon(): boolean {
    return TokenManager.getTimeToExpiration() < 7200; // 2 hours
  }

  /**
   * Auto-refresh token if needed (placeholder for future implementation)
   */
  static async refreshTokenIfNeeded(): Promise<boolean> {
    // This would call a refresh endpoint if the backend supports it
    // For now, just check if token is still valid
    return TokenManager.isAuthenticated();
  }
}