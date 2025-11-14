// Authentication Module - Handles login and register form functionality
import { API_BASE } from '../config/constants.js';
import { TokenManager } from '../services/token-manager.js';
import { TwoFactorAuth, TwoFactorAuthCallbacks } from './two-factor-auth.js';
import { getT } from '../config/translations.js';
import { LanguageManager } from './language.js';

// Callback functions to be set by main.ts to avoid circular imports
type AuthCallbacks = {
  setLoggedInUser: (username: string) => void;
  render: (route: string) => void;
};

export class Authentication {
  private static callbacks: AuthCallbacks | null = null;

  /**
   * Set callback functions from main.ts
   */
  static setCallbacks(callbacks: AuthCallbacks) {
    Authentication.callbacks = callbacks;
    
    // Set up 2FA callbacks
    const twoFactorCallbacks: TwoFactorAuthCallbacks = {
      onTwoFactorSuccess: (token: string, userId: number, username: string) => {
        // Store JWT token
        TokenManager.storeToken(token, userId, username);
        
        // Update UI state
        if (Authentication.callbacks) {
          Authentication.callbacks.setLoggedInUser(username);
          const t = getT(LanguageManager.getLang());
          alert(t.loggedInWith2FA);
          window.location.hash = '';
          Authentication.callbacks.render('');
        }
      },
      onTwoFactorError: (error: string) => {
        const t = getT(LanguageManager.getLang());
        alert(t.twoFactorError + error);
      }
    };
    
    TwoFactorAuth.setCallbacks(twoFactorCallbacks);
  }

  /**
   * Initialize authentication form listeners
   */
  static initialize() {
    Authentication.initializeLoginForm();
    Authentication.initializeRegisterForm();
    Authentication.initializeNavigationButtons();
  }

  /**
   * Initialize login form handling
   */
  private static initializeLoginForm() {
    const loginForm = document.getElementById('login-form') as HTMLFormElement | null;
    if (loginForm) {
      loginForm.addEventListener('submit', Authentication.handleLogin);
    }
  }

  /**
   * Initialize register form handling
   */
  private static initializeRegisterForm() {
    const registerForm = document.getElementById('register-form') as HTMLFormElement | null;
    if (registerForm) {
      registerForm.addEventListener('submit', Authentication.handleRegister);
    }
  }

  /**
   * Initialize navigation buttons for auth pages
   */
  private static initializeNavigationButtons() {
    document.getElementById('back-home-login')?.addEventListener('click', () => {
      window.location.hash = '';
    });
    
    document.getElementById('back-home-register')?.addEventListener('click', () => {
      window.location.hash = '';
    });
    
    document.getElementById('back-home-edit-profile')?.addEventListener('click', () => {
      window.location.hash = '#profile';
    });
  }

  /**
   * Handle login form submission
   */
  private static async handleLogin(e: Event) {
    e.preventDefault();
    const t = getT(LanguageManager.getLang());
    
    const username = (document.getElementById('login-username') as HTMLInputElement).value.trim();
    const password = (document.getElementById('login-password') as HTMLInputElement).value;
    const errorDiv = document.getElementById('login-error');

    // Validation
    if (!username || !password) {
      Authentication.showError(errorDiv, t.missingFields);
      return;
    }

    Authentication.hideError(errorDiv);

    try {
      const response = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        // Prefer localized frontend message to ensure UI language consistency.
        // Log server-provided detail to console for debugging.
        console.warn('Login failed from server:', data.error || data.message || data);
        Authentication.showError(errorDiv, t.loginFailed);
        return;
      }

      // Check if user has 2FA enabled
      if (data.user && data.user.twoFactorEnabled) {
        // Show 2FA verification modal
        TwoFactorAuth.showTwoFactorVerification(username);
      } else {
        // For users without 2FA, we still need to get a JWT token
        // This will require backend modification to issue JWT on regular login
        if (data.token) {
          // Store JWT token
          TokenManager.storeToken(data.token, data.user.id, data.user.username);
        }
        
        // Use callbacks to avoid circular imports
        if (Authentication.callbacks) {
          Authentication.callbacks.setLoggedInUser(data.user.username);
          alert(t.loggedInAsPrefix + data.user.username);
          window.location.hash = '';
          Authentication.callbacks.render('');
        }
      }

    } catch (err) {
      Authentication.showError(errorDiv, t.networkErrorGeneric);
    }
  }

  /**
   * Handle register form submission
   */
  private static async handleRegister(e: Event) {
    e.preventDefault();
    const t = getT(LanguageManager.getLang());
    
    const username = (document.getElementById('register-username') as HTMLInputElement).value.trim();
    const email = (document.getElementById('register-email') as HTMLInputElement).value.trim();
    const password = (document.getElementById('register-password') as HTMLInputElement).value;
    const errorDiv = document.getElementById('register-error');

    // Validation
    if (!username || !email || !password) {
      Authentication.showError(errorDiv, t.missingFields);
      return;
    }

    Authentication.hideError(errorDiv);

    try {
      const response = await fetch(`${API_BASE}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        // Prefer server-provided errorCode -> map to localized messages when possible
        let userMsg = t.registrationFailed;
        if (data && typeof data === 'object' && 'errorCode' in data) {
          const code = (data as any).errorCode as string;
          switch (code) {
            case 'MISSING_FIELDS':
              userMsg = t.missingFields;
              break;
            case 'INVALID_USERNAME':
              userMsg = t.invalidUsernames || t.invalidUsernameOrPassword || t.registrationFailed;
              break;
            case 'INVALID_EMAIL':
              userMsg = t.invalidEmail;
              break;
            case 'USERNAME_OR_EMAIL_IN_USE':
              userMsg = t.usernameOrEmailInUse;
              break;
            case 'INTERNAL_SERVER_ERROR':
              userMsg = t.internalServerError;
              break;
            default:
              userMsg = (data as any).message || (data as any).error || t.registrationFailed;
          }
        } else {
          userMsg = data?.message || t.registrationFailed;
        }
        Authentication.showError(errorDiv, userMsg);
        return;
      }
      alert(t.registeredAsPrefix + username);
      window.location.hash = '';

    } catch (err) {
      Authentication.showError(errorDiv, t.networkErrorGeneric);
    }
  }

  /**
   * Show error message
   */
  private static showError(errorDiv: HTMLElement | null, message: string) {
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.classList.remove('hidden');
    }
  }

  /**
   * Hide error message
   */
  private static hideError(errorDiv: HTMLElement | null) {
    if (errorDiv) {
      errorDiv.classList.add('hidden');
    }
  }

  /**
   * Logout user and clear JWT token
   */
  static logout() {
    TokenManager.clearToken();
    
    if (Authentication.callbacks) {
      // Clear user session and redirect to home
      (window as any).loggedInUser = null;
      window.location.hash = '';
      Authentication.callbacks.render('');
    }
  }

  /**
   * Check if user is currently authenticated
   */
  static isAuthenticated(): boolean {
    return TokenManager.isAuthenticated();
  }

  /**
   * Get current authenticated user info
   */
  static getCurrentUser() {
    return TokenManager.getTokenData();
  }
}