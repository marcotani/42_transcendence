import { API_BASE } from '../config/constants.js';
import { StorageService } from '../services/storage.js';
import { MatchHistoryManager } from './match-history.js';

// Declare global window extensions
declare global {
  interface Window {
    loggedInUser: string | null;
    setLoggedInUser: (username: string | null, newAvatarUrl?: string, skipRender?: boolean) => void;
  }
}

export class ProfileManager {
  /**
   * Attach listeners and fill data for the profile page
   */
  static attachProfilePageListeners(): void {
    // Delete profile button logic
    const deleteBtn = document.getElementById('delete-profile-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async () => {
        if (!confirm('Are you sure you want to delete your profile? This action cannot be undone.')) return;
        if (!confirm('This is your last chance! Do you really want to delete your profile and all your data?')) return;
        // Prompt for password
        const password = prompt('Please enter your current password to confirm deletion:');
        if (!password) return;
        const errorDiv = document.getElementById('delete-profile-error');
        errorDiv?.classList.add('hidden');
        try {
          const res = await fetch(`${API_BASE}/users/${window.loggedInUser}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
          });
          const data = await res.json();
          if (!res.ok) {
            errorDiv!.textContent = data.error || 'Failed to delete profile.';
            errorDiv!.classList.remove('hidden');
          } else {
            alert('Your profile has been deleted.');
            window.setLoggedInUser(null);
            window.location.hash = '';
          }
        } catch (err) {
          errorDiv!.textContent = 'Network error.';
          errorDiv!.classList.remove('hidden');
        }
      });
    }

    const loggedInUser = (window as any).loggedInUser;
    if (!loggedInUser) return;

    // Fetch user info, stats, and match history
    Promise.all([
      fetch(`${API_BASE}/users/${loggedInUser}`).then(res => res.json()),
      fetch(`${API_BASE}/stats/${loggedInUser}`).then(res => res.json()),
      fetch(`${API_BASE}/matches/history/${loggedInUser}`).then(res => res.json())
    ]).then(([user, stats, matchHistory]) => {
      ProfileManager.populateProfileData(user, stats, matchHistory);
      ProfileManager.setupPaddleColorSelector(user);
    });

    // Navigation listeners
    document.getElementById('edit-profile-btn')?.addEventListener('click', () => {
      window.location.hash = '#edit-profile';
    });
    document.getElementById('back-home-profile')?.addEventListener('click', () => {
      window.location.hash = '';
    });
  }

  /**
   * Populate profile page with user data
   */
  private static populateProfileData(user: any, stats: any, matchHistory: any): void {
    // Avatar
    let avatarUrl = user.profile?.avatarUrl || '';
    if (avatarUrl.startsWith('/uploads') || avatarUrl.startsWith('/static')) {
      avatarUrl = API_BASE + avatarUrl;
    }
    // Add cache-busting query string to force refresh after upload
    if (avatarUrl && avatarUrl.includes('/uploads/')) {
      const cacheBuster = StorageService.getAvatarCacheBuster();
      avatarUrl += (avatarUrl.includes('?') ? '&' : '?') + 'v=' + cacheBuster;
    }
    
    // Show avatar image (default or uploaded) with SVG fallback
    const avatarHtml = avatarUrl
      ? `<img src='${avatarUrl}' alt='avatar' class='w-32 h-32 rounded-full border-4 border-gray-600 bg-gray-700 object-cover mb-2' onerror=\"this.style.display='none'; this.nextElementSibling.style.display='flex';\" /><span class='w-32 h-32 rounded-full bg-gray-700 border-4 border-gray-600 flex items-center justify-center mb-2' style='display:none;'><svg width='64' height='64' fill='none' viewBox='0 0 24 24'><circle cx='12' cy='8' r='4' fill='#bbb'/><ellipse cx='12' cy='18' rx='7' ry='4' fill='#bbb'/></svg></span>`
      : `<span class='w-32 h-32 rounded-full bg-gray-700 border-4 border-gray-600 flex items-center justify-center mb-2'><svg width='64' height='64' fill='none' viewBox='0 0 24 24'><circle cx='12' cy='8' r='4' fill='#bbb'/><ellipse cx='12' cy='18' rx='7' ry='4' fill='#bbb'/></svg></span>`;
    document.getElementById('profile-avatar')!.innerHTML = avatarHtml;

    // Basic info
    document.getElementById('profile-alias')!.textContent = user.profile?.alias || user.username;
    document.getElementById('profile-username')!.textContent = '@' + user.username;

    // Email (show only if emailVisible is true)
    const emailDiv = document.getElementById('profile-email');
    if (emailDiv) {
      if (user.profile?.emailVisible && user.email && user.email !== '*************') {
        emailDiv.textContent = user.email;
        emailDiv.style.display = 'block';
      } else {
        emailDiv.textContent = '';
        emailDiv.style.display = 'none';
      }
    }

    // Bio
    const bio = user.profile?.bio;
    const bioDiv = document.getElementById('profile-bio');
    if (bio && bio.trim()) {
      bioDiv!.textContent = '';
      bioDiv!.innerHTML = `<div class='whitespace-pre-line text-gray-300'>${bio}</div>`;
    } else {
      bioDiv!.innerHTML = '';
    }

    // Stats
    ProfileManager.populateStats(stats);

    // Match History
    const matchHistoryHtml = MatchHistoryManager.generateMatchHistoryHtml(matchHistory.matches || []);
    document.getElementById('profile-match-history')!.innerHTML = matchHistoryHtml;
  }

  /**
   * Populate stats section
   */
  private static populateStats(stats: any): void {
    const statsHtml = `
      <div class='grid grid-cols-2 gap-4 mb-2'>
        <div class='bg-gray-800 rounded-lg p-4 flex flex-col items-center'>
          <div class='text-lg font-semibold text-green-400'>Bot</div>
          <div class='flex space-x-4 mt-2'>
            <div class='text-center'>
              <div class='text-2xl font-bold'>${stats.botWins ?? 0}</div>
              <div class='text-gray-400 text-sm'>Wins</div>
            </div>
            <div class='text-center'>
              <div class='text-2xl font-bold'>${stats.botLosses ?? 0}</div>
              <div class='text-gray-400 text-sm'>Losses</div>
            </div>
          </div>
        </div>
        <div class='bg-gray-800 rounded-lg p-4 flex flex-col items-center'>
          <div class='text-lg font-semibold text-blue-400'>Player</div>
          <div class='flex space-x-4 mt-2'>
            <div class='text-center'>
              <div class='text-2xl font-bold'>${stats.playerWins ?? 0}</div>
              <div class='text-gray-400 text-sm'>Wins</div>
            </div>
            <div class='text-center'>
              <div class='text-2xl font-bold'>${stats.playerLosses ?? 0}</div>
              <div class='text-gray-400 text-sm'>Losses</div>
            </div>
          </div>
        </div>
      </div>
      <div class='bg-gray-800 rounded-lg p-4 flex flex-col items-center'>
        <div class='text-lg font-semibold text-yellow-400'>Tournament Wins</div>
        <div class='text-3xl font-bold mt-2'>${stats.tournamentWins ?? 0}</div>
      </div>
    `;
    document.getElementById('profile-stats-counters')!.innerHTML = statsHtml;
  }

  /**
   * Setup paddle color selector
   */
  private static setupPaddleColorSelector(user: any): void {
    setTimeout(() => {
      const skinColorSelect = document.getElementById('profile-skinColor') as HTMLSelectElement | null;
      const skinColorConfirm = document.getElementById('profile-skinColor-confirm') as HTMLButtonElement | null;
      if (skinColorSelect && skinColorConfirm && window.loggedInUser) {
        // Set initial value from user profile  
        if (user.profile?.skinColor) {
          skinColorSelect.value = user.profile.skinColor;
        }
        skinColorConfirm.onclick = () => {
          const newColor = skinColorSelect.value;
          fetch(`${API_BASE}/users/${window.loggedInUser}/skin`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ skinColor: newColor })
          })
            .then(res => res.ok ? res.json() : res.json().then(e => Promise.reject(e)))
            .then(() => {
              document.getElementById('profile-skinColor-success')!.textContent = 'Paddle color updated!';
              document.getElementById('profile-skinColor-success')!.classList.remove('hidden');
              document.getElementById('profile-skinColor-error')!.classList.add('hidden');
            })
            .catch(err => {
              document.getElementById('profile-skinColor-error')!.textContent = err.error || 'Failed to update color.';
              document.getElementById('profile-skinColor-error')!.classList.remove('hidden');
              document.getElementById('profile-skinColor-success')!.classList.add('hidden');
            });
        };
      }
    }, 0);
  }

  /**
   * Attach listeners for edit profile page
   */
  static attachEditProfilePageListeners(): void {
    const form = document.getElementById('edit-profile-form') as HTMLFormElement | null;
    const avatarInput = document.getElementById('edit-avatar') as HTMLInputElement | null;
    const avatarPreview = document.getElementById('edit-avatar-preview');

    // Avatar preview functionality
    if (avatarInput && avatarPreview) {
      avatarInput.addEventListener('change', () => {
        const file = avatarInput.files && avatarInput.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = e => {
            avatarPreview.innerHTML = `<img src='${e.target?.result}' alt='avatar preview' class='w-24 h-24 rounded-full object-cover border-2 border-gray-600' />`;
          };
          reader.readAsDataURL(file);
        } else {
          avatarPreview.innerHTML = '';
        }
      });
    }

    const loggedInUser = window.loggedInUser;
    if (form && loggedInUser) {
      ProfileManager.setupEditProfileForm(form, avatarInput, avatarPreview);
    }
  }

  /**
   * Setup edit profile form with submission handling
   */
  private static setupEditProfileForm(form: HTMLFormElement, avatarInput: HTMLInputElement | null, avatarPreview: HTMLElement | null): void {
    let original = { alias: '', username: '', email: '', bio: '', skinColor: '#FFFFFF', emailVisible: true };
    let formReady = false;
    let isSubmitting = false;
    
    // Initially disable submit button
    const submitBtn = document.getElementById('edit-profile-submit') as HTMLButtonElement;
    if (submitBtn) {
      submitBtn.disabled = true;
    }
    
    // const loggedInUser is already imported
    
    // Prefill form with current user info
    fetch(`${API_BASE}/users/${window.loggedInUser}`)
      .then(res => res.json())
      .then(user => {
        original = {
          alias: user.profile?.alias || '',
          username: user.username || '',
          email: user.email || '',
          bio: user.profile?.bio || '',
          skinColor: user.profile?.skinColor || '#FFFFFF',
          emailVisible: user.profile?.emailVisible !== false
        };
        (document.getElementById('edit-alias') as HTMLInputElement).value = original.alias;
        (document.getElementById('edit-username') as HTMLInputElement).value = original.username;
        (document.getElementById('edit-email') as HTMLInputElement).value = original.email;
        (document.getElementById('edit-bio') as HTMLTextAreaElement).value = original.bio;
        (document.getElementById('edit-email-visible') as HTMLInputElement).checked = original.emailVisible;
        formReady = true;
        
        // Enable submit button and update text
        const submitBtn = document.getElementById('edit-profile-submit') as HTMLButtonElement;
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Update Profile';
        }
      });
      
    form.addEventListener('submit', async (e) => {
      await ProfileManager.handleEditProfileSubmit(e, formReady, isSubmitting, original, avatarInput, avatarPreview);
    });
  }

  /**
   * Handle edit profile form submission
   */
  private static async handleEditProfileSubmit(
    e: Event, 
    formReady: boolean, 
    isSubmitting: boolean, 
    original: any, 
    avatarInput: HTMLInputElement | null, 
    avatarPreview: HTMLElement | null
  ): Promise<void> {
    e.preventDefault();
    
    console.log('[DEBUG] Form submit event triggered');
    
    // Prevent multiple submissions
    if (isSubmitting) {
      console.log('[DEBUG] Already submitting, ignoring duplicate submission');
      return;
    }
    
    // Prevent submission if form data isn't loaded yet
    if (!formReady) {
      console.log('[DEBUG] Form not ready yet');
      const errorDiv = document.getElementById('edit-profile-error');
      const successDiv = document.getElementById('edit-profile-success');
      if (errorDiv) {
        errorDiv.textContent = 'Please wait for form to load completely before submitting.';
        errorDiv.classList.remove('hidden');
      }
      if (successDiv) {
        successDiv.classList.add('hidden');
      }
      return;
    }
    
    isSubmitting = true;
    
    try {
      await ProfileManager.processProfileUpdate(original, avatarInput, avatarPreview);
    } finally {
      isSubmitting = false;
      const currentSubmitBtn = document.getElementById('edit-profile-submit') as HTMLButtonElement;
      if (currentSubmitBtn) {
        currentSubmitBtn.disabled = false;
        currentSubmitBtn.textContent = 'Update Profile';
      }
    }
  }

  /**
   * Process the actual profile update
   */
  private static async processProfileUpdate(
    original: any, 
    avatarInput: HTMLInputElement | null, 
    avatarPreview: HTMLElement | null
  ): Promise<void> {
    if (!window.loggedInUser) {
      console.error('No logged in user');
      return;
    }
    
    const alias = (document.getElementById('edit-alias') as HTMLInputElement).value.trim();
    const username = (document.getElementById('edit-username') as HTMLInputElement).value.trim();
    const email = (document.getElementById('edit-email') as HTMLInputElement).value.trim();
    const bio = (document.getElementById('edit-bio') as HTMLTextAreaElement).value;
    const password = (document.getElementById('edit-password') as HTMLInputElement).value.trim();
    const emailVisible = (document.getElementById('edit-email-visible') as HTMLInputElement).checked;
    
    const currentPasswordInput = document.getElementById('edit-current-password') as HTMLInputElement;
    const currentPassword = currentPasswordInput ? currentPasswordInput.value.trim() : '';
    
    const errorDiv = document.getElementById('edit-profile-error');
    const successDiv = document.getElementById('edit-profile-success');
    const form = document.getElementById('edit-profile-form') as HTMLFormElement;
    const submitBtn = form.querySelector('button[type=\"submit\"]') as HTMLButtonElement | null;
    
    if (errorDiv) errorDiv.classList.add('hidden');
    if (successDiv) successDiv.classList.add('hidden');
    
    // Validation
    const wantsUsernameChange: boolean = !!(username && username !== original.username);
    const wantsEmailChange: boolean = !!(email && email !== original.email);
    const wantsPasswordChange: boolean = !!(password && password.length > 0);
    const wantsAvatarChange: boolean = !!(avatarInput && avatarInput.files && avatarInput.files.length > 0);
    const wantsBioChange: boolean = bio !== original.bio;
    const wantsAliasChange: boolean = !!(alias && alias !== original.alias);
    const wantsEmailVisibilityChange: boolean = emailVisible !== original.emailVisible;
    
    let errorMsg = '';
    
    // Check if at least one field is being changed
    if (!wantsAliasChange && !wantsUsernameChange && !wantsEmailChange && !wantsPasswordChange && !wantsAvatarChange && !wantsBioChange && !wantsEmailVisibilityChange) {
      errorMsg = 'At least one field must be filled.';
    }
    
    // Current password only required for sensitive changes
    if ((wantsUsernameChange || wantsEmailChange || wantsPasswordChange) && !currentPassword) {
      errorMsg = 'Current password is required to change username, email, or password.';
    }
    
    if (errorMsg) {
      if (errorDiv) {
        errorDiv.textContent = errorMsg;
        errorDiv.classList.remove('hidden');
      }
      if (successDiv) {
        successDiv.classList.add('hidden');
      }
      return;
    }
    
    let ok = true;
    let msg = '';
    let aliasTargetUser = window.loggedInUser;
    
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Updating...';
    }
    
    try {
      // Update user credentials if needed
      if (wantsUsernameChange || wantsEmailChange || wantsPasswordChange) {
        const result = await ProfileManager.updateUserCredentials(
          wantsUsernameChange, wantsEmailChange, wantsPasswordChange,
          username, email, password, currentPassword, original
        );
        ok = result.ok;
        msg = result.msg;
        aliasTargetUser = result.aliasTargetUser;
      }
      
      // Avatar upload if needed
      if (ok && wantsAvatarChange && avatarInput && avatarInput.files && avatarInput.files.length > 0 && aliasTargetUser) {
        const result = await ProfileManager.uploadAvatar(avatarInput, aliasTargetUser, avatarPreview);
        ok = result.ok;
        if (!ok) msg = result.msg;
      }
      
      // Update other profile fields
      if (ok && aliasTargetUser) {
        const result = await ProfileManager.updateProfileFields(
          alias, bio, emailVisible, original, aliasTargetUser,
          wantsBioChange, wantsEmailVisibilityChange, wantsAliasChange
        );
        ok = result.ok;
        if (!ok) msg = result.msg;
      }
      
    } catch (err) {
      ok = false;
      msg = err instanceof Error ? err.message : 'Network error updating profile.';
    }
    
    // Show result
    if (ok) {
      const currentSuccessDiv = document.getElementById('edit-profile-success');
      const currentErrorDiv = document.getElementById('edit-profile-error');
      
      if (currentSuccessDiv) {
        currentSuccessDiv.textContent = 'Profile updated successfully!';
        currentSuccessDiv.classList.remove('hidden');
      }
      if (currentErrorDiv) {
        currentErrorDiv.classList.add('hidden');
      }
    } else {
      const currentErrorDiv = document.getElementById('edit-profile-error');
      const currentSuccessDiv = document.getElementById('edit-profile-success');
      
      if (currentErrorDiv) {
        currentErrorDiv.textContent = msg;
        currentErrorDiv.classList.remove('hidden');
      }
      if (currentSuccessDiv) {
        currentSuccessDiv.classList.add('hidden');
      }
    }
  }

  /**
   * Update user credentials (username, email, password)
   */
  private static async updateUserCredentials(
    wantsUsernameChange: boolean, wantsEmailChange: boolean, wantsPasswordChange: boolean,
    username: string, email: string, password: string, currentPassword: string, original: any
  ): Promise<{ok: boolean, msg: string, aliasTargetUser: string}> {
    const updateBody: any = {};
    let aliasTargetUser = (window as any).loggedInUser;
    
    if (wantsUsernameChange) updateBody.newUsername = username;
    if (wantsEmailChange) updateBody.newEmail = email;
    if (wantsPasswordChange) updateBody.newPassword = password;
    if (wantsUsernameChange || wantsEmailChange || wantsPasswordChange) {
      updateBody.currentPassword = currentPassword;
    }
    
    if (Object.keys(updateBody).length > 0) {
      try {
        const userRes = await fetch(`${API_BASE}/users/${window.loggedInUser}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateBody)
        });
        const userResBody = await userRes.json();
        if (!userRes.ok) {
          return { ok: false, msg: userResBody.error || 'Failed to update profile.', aliasTargetUser };
        } else {
          if (updateBody.newUsername) {
            window.setLoggedInUser(updateBody.newUsername);
            aliasTargetUser = updateBody.newUsername;
            // Update form with new data after username change
            await ProfileManager.updateFormAfterUsernameChange(updateBody.newUsername, original);
          } else if (updateBody.newEmail) {
            await ProfileManager.updateFormAfterEmailChange(aliasTargetUser, original);
          }
        }
      } catch (err) {
        return { 
          ok: false, 
          msg: err instanceof Error ? err.message : 'Network error updating profile.',
          aliasTargetUser 
        };
      }
    }
    
    return { ok: true, msg: '', aliasTargetUser };
  }

  /**
   * Upload avatar
   */
  private static async uploadAvatar(
    avatarInput: HTMLInputElement, 
    aliasTargetUser: string, 
    avatarPreview: HTMLElement | null
  ): Promise<{ok: boolean, msg: string}> {
    const file = avatarInput.files![0];
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const avatarRes = await fetch(`${API_BASE}/users/${aliasTargetUser}/avatar`, {
        method: 'PATCH',
        body: formData
      });
      const avatarResBody = await avatarRes.json();
      if (!avatarRes.ok) {
        return { ok: false, msg: avatarResBody.error || 'Failed to upload avatar.' };
      } else {
        const newAvatarUrl = avatarResBody.avatarUrl;
        window.setLoggedInUser(aliasTargetUser, newAvatarUrl, true);
        // Clear file input and preview
        avatarInput.value = '';
        if (avatarPreview) avatarPreview.innerHTML = '';
        return { ok: true, msg: '' };
      }
    } catch (err) {
      return { 
        ok: false, 
        msg: err instanceof Error ? err.message : 'Network error uploading avatar.' 
      };
    }
  }

  /**
   * Update other profile fields (alias, bio, email visibility)
   */
  private static async updateProfileFields(
    alias: string, bio: string, emailVisible: boolean, original: any, aliasTargetUser: string,
    wantsBioChange: boolean, wantsEmailVisibilityChange: boolean, wantsAliasChange: boolean
  ): Promise<{ok: boolean, msg: string}> {
    // Update alias if changed
    if (wantsAliasChange) {
      try {
        const aliasRes = await fetch(`${API_BASE}/users/${aliasTargetUser}/alias`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ alias })
        });
        const aliasResBody = await aliasRes.json();
        if (!aliasRes.ok) {
          return { ok: false, msg: aliasResBody.error || 'Failed to update alias.' };
        }
      } catch (err) {
        return { ok: false, msg: err instanceof Error ? err.message : 'Network error updating alias.' };
      }
    }
    
    // Update bio if changed
    if (bio && wantsBioChange) {
      try {
        const bioRes = await fetch(`${API_BASE}/users/${aliasTargetUser}/bio`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bio })
        });
        const bioResBody = await bioRes.json();
        if (!bioRes.ok) {
          return { ok: false, msg: bioResBody.error || 'Failed to update biography.' };
        }
      } catch (err) {
        return { ok: false, msg: err instanceof Error ? err.message : 'Network error updating biography.' };
      }
    }
    
    // Update email visibility if changed
    if (wantsEmailVisibilityChange) {
      try {
        const emailVisRes = await fetch(`${API_BASE}/users/${aliasTargetUser}/email-visibility`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emailVisible })
        });
        const emailVisResBody = await emailVisRes.json();
        if (!emailVisRes.ok) {
          return { ok: false, msg: emailVisResBody.error || 'Failed to update email visibility.' };
        }
      } catch (err) {
        return { ok: false, msg: err instanceof Error ? err.message : 'Network error updating email visibility.' };
      }
    }
    
    return { ok: true, msg: '' };
  }

  /**
   * Update form after username change
   */
  private static async updateFormAfterUsernameChange(newUsername: string, original: any): Promise<void> {
    try {
      const newUserRes = await fetch(`${API_BASE}/users/${newUsername}`);
      if (newUserRes.ok) {
        const newUser = await newUserRes.json();
        original.alias = newUser.profile?.alias || '';
        original.username = newUser.username || '';
        original.email = newUser.email || '';
        original.bio = newUser.profile?.bio || '';
        original.skinColor = newUser.profile?.skinColor || '#FFFFFF';
        original.emailVisible = newUser.profile?.emailVisible !== false;
        
        // Preserve current password field when updating form
        const currentPasswordField = document.getElementById('edit-current-password') as HTMLInputElement;
        const currentPasswordValue = currentPasswordField?.value || '';
        
        try {
          (document.getElementById('edit-alias') as HTMLInputElement).value = original.alias;
          (document.getElementById('edit-username') as HTMLInputElement).value = original.username;
          (document.getElementById('edit-email') as HTMLInputElement).value = original.email;
          (document.getElementById('edit-bio') as HTMLTextAreaElement).value = original.bio;
          (document.getElementById('edit-email-visible') as HTMLInputElement).checked = original.emailVisible;
          
          // Restore current password field
          if (currentPasswordField) {
            currentPasswordField.value = currentPasswordValue;
          }
        } catch (domError) {
          console.error('Error updating form fields after username change:', domError);
        }
      }
    } catch (err) {
      console.warn('Error updating form after username change:', err);
    }
  }

  /**
   * Update form after email change
   */
  private static async updateFormAfterEmailChange(aliasTargetUser: string, original: any): Promise<void> {
    try {
      const newUserRes = await fetch(`${API_BASE}/users/${aliasTargetUser}`);
      if (newUserRes.ok) {
        const newUser = await newUserRes.json();
        original.alias = newUser.profile?.alias || '';
        original.username = newUser.username || '';
        original.email = newUser.email || '';
        original.bio = newUser.profile?.bio || '';
        original.skinColor = newUser.profile?.skinColor || '#FFFFFF';
        original.emailVisible = newUser.profile?.emailVisible !== false;
        
        // Preserve current password field when updating form
        const currentPasswordField = document.getElementById('edit-current-password') as HTMLInputElement;
        const currentPasswordValue = currentPasswordField?.value || '';
        
        (document.getElementById('edit-alias') as HTMLInputElement).value = original.alias;
        (document.getElementById('edit-username') as HTMLInputElement).value = original.username;
        (document.getElementById('edit-email') as HTMLInputElement).value = original.email;
        (document.getElementById('edit-bio') as HTMLTextAreaElement).value = original.bio;
        (document.getElementById('edit-email-visible') as HTMLInputElement).checked = original.emailVisible;
        
        // Restore current password field
        if (currentPasswordField) {
          currentPasswordField.value = currentPasswordValue;
        }
      }
    } catch (err) {
      console.warn('Error updating form after email change:', err);
    }
  }
}