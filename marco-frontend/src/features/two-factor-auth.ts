// Two-Factor Authentication Components
import { API_BASE } from '../config/constants.js';
import { TokenManager } from '../services/token-manager.js';

export interface TwoFactorAuthCallbacks {
  onTwoFactorSuccess: (token: string, userId: number, username: string) => void;
  onTwoFactorError: (error: string) => void;
}

export class TwoFactorAuth {
  private static callbacks: TwoFactorAuthCallbacks | null = null;

  /**
   * Set callback functions for 2FA events
   */
  static setCallbacks(callbacks: TwoFactorAuthCallbacks) {
    TwoFactorAuth.callbacks = callbacks;
  }

  /**
   * Show 2FA verification modal for login
   */
  static showTwoFactorVerification(username: string): void {
    const modal = TwoFactorAuth.create2FAModal(username);
    document.body.appendChild(modal);
    
    // Focus on the code input
    const codeInput = modal.querySelector('#twofa-code') as HTMLInputElement;
    codeInput?.focus();
  }

  /**
   * Create 2FA verification modal
   */
  private static create2FAModal(username: string): HTMLElement {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.id = 'twofa-modal';
    
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4" style="color: #374151 !important;">
        <h2 class="text-xl font-bold mb-4" style="color: #1f2937 !important;">Two-Factor Authentication</h2>
        <p class="text-gray-600 mb-4" style="color: #4b5563 !important;">
          Please enter the 6-digit code from your authenticator app.
        </p>
        
        <form id="twofa-form" class="space-y-4">
          <div>
            <label for="twofa-code" class="block text-sm font-medium text-gray-700" style="color: #374151 !important;">
              Authentication Code
            </label>
            <input
              type="text"
              id="twofa-code"
              name="code"
              maxlength="6"
              pattern="[0-9]{6}"
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-center text-lg tracking-widest"
              style="color: #1f2937 !important; background-color: #ffffff !important;"
              placeholder="000000"
              required
            />
          </div>
          
          <div id="twofa-error" class="hidden text-red-600 text-sm"></div>
          
          <div class="flex space-x-3">
            <button
              type="submit"
              class="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Verify
            </button>
            <button
              type="button"
              id="cancel-twofa"
              class="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    `;

    // Add event listeners
    const form = modal.querySelector('#twofa-form') as HTMLFormElement;
    const cancelBtn = modal.querySelector('#cancel-twofa') as HTMLButtonElement;
    const codeInput = modal.querySelector('#twofa-code') as HTMLInputElement;

    form.addEventListener('submit', (e) => TwoFactorAuth.handleTwoFactorVerification(e, username));
    cancelBtn.addEventListener('click', () => TwoFactorAuth.closeTwoFactorModal());
    
    // Auto-format code input (only numbers)
    codeInput.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      target.value = target.value.replace(/\D/g, '');
    });

    return modal;
  }

  /**
   * Handle 2FA verification form submission
   */
  private static async handleTwoFactorVerification(e: Event, username: string): Promise<void> {
    e.preventDefault();
    
    const form = e.target as HTMLFormElement;
    const code = (form.querySelector('#twofa-code') as HTMLInputElement).value;
    const errorDiv = form.querySelector('#twofa-error') as HTMLElement;

    if (code.length !== 6) {
      TwoFactorAuth.show2FAError(errorDiv, 'Please enter a 6-digit code.');
      return;
    }

    TwoFactorAuth.hide2FAError(errorDiv);

    try {
      const response = await fetch(`${API_BASE}/users/${username}/2fa/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });

      const data = await response.json();

      if (!response.ok) {
        TwoFactorAuth.show2FAError(errorDiv, data.error || 'Invalid code.');
        return;
      }

      // Success - we have a JWT token
      if (data.success && data.token) {
        TwoFactorAuth.closeTwoFactorModal();
        
        // Parse JWT payload to get user info (simple base64 decode)
        const payload = JSON.parse(atob(data.token.split('.')[1]));
        
        if (TwoFactorAuth.callbacks) {
          TwoFactorAuth.callbacks.onTwoFactorSuccess(data.token, payload.userId, payload.username);
        }
      } else {
        TwoFactorAuth.show2FAError(errorDiv, 'Authentication failed.');
      }

    } catch (error) {
      TwoFactorAuth.show2FAError(errorDiv, 'Network error. Please try again.');
    }
  }

  /**
   * Close 2FA modal
   */
  static closeTwoFactorModal(): void {
    const modal = document.getElementById('twofa-modal');
    if (modal) {
      modal.remove();
    }
  }

  /**
   * Show 2FA setup modal for enabling 2FA
   */
  static async showTwoFactorSetup(): Promise<void> {
    if (!TokenManager.isAuthenticated()) {
      alert('Please log in first.');
      return;
    }

    try {
      const tokenData = TokenManager.getTokenData();
      if (!tokenData) return;

      const response = await fetch(`${API_BASE}/users/${tokenData.username}/2fa/enable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...TokenManager.getAuthHeader()
        },
        body: JSON.stringify({})
      });

      const data = await response.json();

      if (!response.ok) {
        alert('Failed to generate 2FA setup: ' + (data.error || 'Unknown error'));
        return;
      }

      TwoFactorAuth.showSetupModal(data.secret, data.qrcode, tokenData.username);

    } catch (error) {
      alert('Network error while setting up 2FA.');
    }
  }

  /**
   * Create and show 2FA setup modal with QR code
   */
  private static showSetupModal(secret: string, qrcode: string, username: string): void {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.id = 'twofa-setup-modal';
    
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto" style="color: #374151 !important;">
        <h2 class="text-xl font-bold mb-4" style="color: #1f2937 !important;">Enable Two-Factor Authentication</h2>
        
        <div class="space-y-4">
          <div class="text-center">
            <p class="text-sm text-gray-600 mb-3" style="color: #4b5563 !important;">
              Scan this QR code with your authenticator app:
            </p>
            <div class="bg-gray-100 p-3 rounded-lg inline-block">
              <img src="${qrcode}" alt="2FA QR Code" class="max-w-48 h-auto" />
            </div>
          </div>
          
          <div>
            <p class="text-sm text-gray-600 mb-2" style="color: #4b5563 !important;">
              Or enter this secret manually:
            </p>
            <div class="bg-gray-100 p-2 rounded text-center font-mono text-sm break-all" style="color: #1f2937 !important; background-color: #f3f4f6 !important;">
              ${secret}
            </div>
          </div>

          <form id="verify-setup-form" class="space-y-3">
            <div>
              <label for="verify-code" class="block text-sm font-medium text-gray-700" style="color: #374151 !important;">
                Enter verification code to confirm setup:
              </label>
              <input
                type="text"
                id="verify-code"
                maxlength="6"
                pattern="[0-9]{6}"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-center text-lg tracking-widest"
                style="color: #1f2937 !important; background-color: #ffffff !important;"
                placeholder="000000"
                required
              />
            </div>
            
            <div id="verify-error" class="hidden text-red-600 text-sm"></div>
            
            <div class="flex space-x-3">
              <button
                type="submit"
                class="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
              >
                Enable 2FA
              </button>
              <button
                type="button"
                id="cancel-setup"
                class="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Add event listeners
    const form = modal.querySelector('#verify-setup-form') as HTMLFormElement;
    const cancelBtn = modal.querySelector('#cancel-setup') as HTMLButtonElement;
    const codeInput = modal.querySelector('#verify-code') as HTMLInputElement;

    form.addEventListener('submit', (e) => TwoFactorAuth.handleSetupVerification(e, username));
    cancelBtn.addEventListener('click', () => TwoFactorAuth.closeSetupModal());
    
    codeInput.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      target.value = target.value.replace(/\D/g, '');
    });

    codeInput.focus();
  }

  /**
   * Handle 2FA setup verification
   */
  private static async handleSetupVerification(e: Event, username: string): Promise<void> {
    e.preventDefault();
    
    const form = e.target as HTMLFormElement;
    const code = (form.querySelector('#verify-code') as HTMLInputElement).value;
    const errorDiv = form.querySelector('#verify-error') as HTMLElement;

    if (code.length !== 6) {
      TwoFactorAuth.show2FAError(errorDiv, 'Please enter a 6-digit code.');
      return;
    }

    try {
      // This would be a verification endpoint to confirm 2FA setup
      const response = await fetch(`${API_BASE}/users/${username}/2fa/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...TokenManager.getAuthHeader()
        },
        body: JSON.stringify({ code })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        TwoFactorAuth.closeSetupModal();
        alert('Two-Factor Authentication enabled successfully!');
        // Refresh the profile page to show 2FA is now enabled
        window.location.reload();
      } else {
        TwoFactorAuth.show2FAError(errorDiv, data.error || 'Invalid code.');
      }

    } catch (error) {
      TwoFactorAuth.show2FAError(errorDiv, 'Network error. Please try again.');
    }
  }

  /**
   * Disable 2FA
   */
  static async disableTwoFactor(): Promise<void> {
    if (!TokenManager.isAuthenticated()) {
      alert('Please log in first.');
      return;
    }

    if (!confirm('Are you sure you want to disable Two-Factor Authentication?')) {
      return;
    }

    try {
      const tokenData = TokenManager.getTokenData();
      if (!tokenData) return;

      const response = await fetch(`${API_BASE}/users/${tokenData.username}/2fa/disable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...TokenManager.getAuthHeader()
        },
        body: JSON.stringify({})
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('Two-Factor Authentication disabled successfully.');
        window.location.reload();
      } else {
        alert('Failed to disable 2FA: ' + (data.error || 'Unknown error'));
      }

    } catch (error) {
      alert('Network error while disabling 2FA.');
    }
  }

  /**
   * Close 2FA setup modal
   */
  private static closeSetupModal(): void {
    const modal = document.getElementById('twofa-setup-modal');
    if (modal) {
      modal.remove();
    }
  }

  /**
   * Show error in 2FA forms
   */
  private static show2FAError(errorDiv: HTMLElement, message: string): void {
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
  }

  /**
   * Hide error in 2FA forms
   */
  private static hide2FAError(errorDiv: HTMLElement): void {
    errorDiv.classList.add('hidden');
  }
}